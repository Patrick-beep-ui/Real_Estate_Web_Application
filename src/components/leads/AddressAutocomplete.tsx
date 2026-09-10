"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, AlertTriangle, AlertCircle } from "lucide-react";
import { validateAddressShape } from "@/lib/shared/address";
import type { AddressSource, AddressMeta } from "@/lib/shared/address";

export type { AddressSource, AddressMeta } from "@/lib/shared/address";

export type AddressOnChange = (value: string, meta: AddressMeta) => void;

// Only the IP coords promise is shared module-scope (idempotent, keyed by IP,
// safe for any number of mounted instances). All per-instance state lives in
// the component so two forms on one page never stomp each other.
let geoPromise: Promise<{ lat: number; lng: number } | null> | null = null;

async function fetchGeoCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!geoPromise) {
      geoPromise = fetch("https://ipapi.co/json/")
        .then((r) => r.json())
        .then((d) => (d.latitude ? { lat: d.latitude, lng: d.longitude } : null))
        .catch(() => null);
    }
    return await geoPromise;
  } catch {
    return null;
  }
}

interface Suggestion {
  placeId: string;
  description: string;
}

type SuggestionMode = "native_loading" | "native" | "proxy" | "manual";

function createSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now()}${Math.random().toString(36).slice(2)}`;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: AddressOnChange;
  id: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  iconClassName?: string;
  /** Descriptive server-side address error to render inline under the input. */
  errorText?: string;
}

/** Bold the segments of `description` that match the typed `query`, the same
 *  visual Google's native dropdown shows via `.pac-matched` on dev. */
function highlightDescription(description: string, query: string): React.ReactNode[] {
  const q = query.trim();
  const out: React.ReactNode[] = [];
  if (!q) return [description];
  const lowerDesc = description.toLowerCase();
  const lowerQ = q.toLowerCase();
  let pos = 0;
  let key = 0;
  while (pos < description.length) {
    const idx = lowerDesc.indexOf(lowerQ, pos);
    if (idx === -1) {
      out.push(description.slice(pos));
      break;
    }
    if (idx > pos) out.push(description.slice(pos, idx));
    out.push(
      <span key={key++} className="pac-matched">
        {description.slice(idx, idx + q.length)}
      </span>
    );
    pos = idx + q.length;
  }
  return out;
}

export default function AddressAutocomplete({
  value,
  onChange,
  id,
  placeholder,
  required,
  autoFocus,
  className,
  iconClassName = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
  errorText,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const inputValueRef = useRef("");
  const lastEmitRef = useRef<{ value: string; source?: AddressSource; canAdvance: boolean } | null>(null);

  const [suggestionMode, setSuggestionMode] =
    useState<SuggestionMode>("native_loading");
  const proxySessionTokenRef = useRef<string>(createSessionToken());
  const proxyAbortRef = useRef<AbortController | null>(null);

  const [inputValue, setInputValue] = useState(value);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSource, setLastSource] = useState<AddressSource>(value.trim() ? "manual_confirmed" as AddressSource : "api_fallback" as AddressSource);
  const [predictions, setPredictions] = useState<Suggestion[]>([]);
  const [predictionState, setPredictionState] = useState<"idle" | "loading" | "done" | "error">("idle");

  inputValueRef.current = inputValue;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    fetchGeoCoords()
      .then((c) => {
        if (!cancelled) {
          setCoords(c);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoords(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      proxyAbortRef.current?.abort();
    };
  }, []);

  // Load the Maps script. Service-unavailable is derived ONLY from this load
  // result — never from guessing at geocoder output. Nothing after this point
  // decides "unreachable" on its own.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) {
      setSuggestionMode("native");
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setSuggestionMode("proxy");
      return;
    }
    let cancelled = false;
    try {
      const callbackName = "__gmp_cb_" + Date.now();
      (window as any)[callbackName] = () => {
        if (!cancelled) setSuggestionMode("native");
        delete (window as any)[callbackName];
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setSuggestionMode("proxy");
      };
      document.head.appendChild(script);
      return () => {
        cancelled = true;
        delete (window as any)[callbackName];
      };
    } catch {
      setSuggestionMode("proxy");
    }
  }, []);

  // If the script still hasn't loaded shortly after mount, treat it as
  // unavailable and fall back rather than leaving the user blocked forever.
  useEffect(() => {
    if (suggestionMode !== "native_loading") return;
    const timer = setTimeout(() => {
      setSuggestionMode("proxy");
    }, 3000);
    return () => clearTimeout(timer);
  }, [suggestionMode]);

  useEffect(() => {
    if (suggestionMode !== "native" || !window.google?.maps?.places) return;
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    } catch {
      setSuggestionMode("proxy");
    }
  }, [suggestionMode]);

  const runProxyPredictions = async (raw: string) => {
    proxyAbortRef.current?.abort();
    const controller = new AbortController();
    proxyAbortRef.current = controller;
    setPredictionState("loading");

    try {
      const response = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          input: raw,
          sessionToken: proxySessionTokenRef.current,
        }),
      });

      if (!response.ok) throw new Error("Places proxy unavailable");

      const body = (await response.json()) as { suggestions?: Suggestion[] };
      if (inputValueRef.current !== raw) return;

      setPredictions(body.suggestions || []);
      setPredictionState("done");
      console.log("AddressAutocomplete: proxy suggestions", body.suggestions);
    } catch {
      if (controller.signal.aborted || inputValueRef.current !== raw) return;

      setPredictions([]);
      setPredictionState("error");
      setSuggestionMode("manual");
    }
  };

  const runNativePredictions = (raw: string) => {
    const service = autocompleteServiceRef.current;
    if (!service) {
      setSuggestionMode("proxy");
      void runProxyPredictions(raw);
      return;
    }
    setPredictionState("loading");
    const req: google.maps.places.AutocompletionRequest = {
      input: raw,
      types: ["address"],
      componentRestrictions: { country: "us" },
    };
    if (coords) {
      req.location = new google.maps.LatLng(coords.lat, coords.lng);
      req.radius = 80000;
    }
    try {
      service.getPlacePredictions(req, (res, status) => {
        if (inputValueRef.current !== raw) return;
        if (status === "OK" && res && res.length > 0) {
          setPredictions(res.map((p) => ({ placeId: p.place_id, description: p.description })));
          setPredictionState("done");
        } else if (status === "ZERO_RESULTS") {
          setPredictions([]);
          setPredictionState("done");
        } else {
          setPredictions([]);
          // A loaded script can still be denied by Google or an embedded
          // browser. Use the server proxy before asking for manual entry.
          setSuggestionMode("proxy");
          void runProxyPredictions(raw);
        }
      });
    } catch {
      setPredictions([]);
      setSuggestionMode("proxy");
      void runProxyPredictions(raw);
    }
  };

  const runPredictionsDebounced = (raw: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (suggestionMode === "native") {
        runNativePredictions(raw);
      } else if (suggestionMode === "proxy") {
        void runProxyPredictions(raw);
      }
    }, 250);
  };

  const selectSuggestion = (s: Suggestion) => {
    const places = placesServiceRef.current;
    if (places) {
      places.getDetails(
        { placeId: s.placeId, fields: ["formatted_address", "address_components", "name"] },
        (place, status) => {
          if (status === "OK" && place) {
            const normalized = buildFormatted(place);
            setInputValue(normalized);
            setLastSource("google_selected");
            setPredictions([]);
            setPredictionState("idle");
          }
        }
      );
    }
    setPredictions([]);
    setPredictionState("idle");
  };

  const selectProxySuggestion = async (suggestion: Suggestion) => {
    setPredictions([]);
    setPredictionState("loading");

    try {
      const response = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          sessionToken: proxySessionTokenRef.current,
        }),
      });

      if (!response.ok) throw new Error("Place details unavailable");

      // The proxy intentionally returns only the normalized address.
      const address = await response.json() as string;
      if (!address.trim()) throw new Error("Place details missing address");

      setInputValue(address);
      setLastSource("server_places_selected");
      setPredictionState("idle");
      proxySessionTokenRef.current = createSessionToken();
    } catch {
      setPredictionState("error");
      setSuggestionMode("manual");
    }
  };

  const buildFormatted = (place: google.maps.places.PlaceResult): string => {
    let formatted = "";
    if (place.address_components) {
      const streetNumber =
        place.address_components.find((c) => c.types.includes("street_number"))?.long_name || "";
      const route =
        place.address_components.find((c) => c.types.includes("route"))?.long_name || "";
      const city =
        place.address_components.find((c) => c.types.includes("locality"))?.long_name || "";
      const state =
        place.address_components.find((c) => c.types.includes("administrative_area_level_1"))?.short_name || "";
      const zip =
        place.address_components.find((c) => c.types.includes("postal_code"))?.long_name || "";
      const street = `${streetNumber} ${route}`.trim();
      const parts = [street, city, state ? `${state} ${zip}` : zip].filter(Boolean);
      formatted = parts.join(", ");
    }
    if (!formatted) formatted = place.formatted_address || place.name || "";
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    setLastSource(raw.trim() ? "manual_confirmed" : "api_fallback");
    setPredictions([]);
    if (raw.trim().length >= 3 && suggestionMode !== "manual") {
      setPredictionState("loading");
      runPredictionsDebounced(raw.trim());
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setPredictionState("idle");
    }
  };

  // Push the current value + guard state up to the parent whenever it changes,
  // so step gates can enforce "you can't skip suggestions that are on screen."
  const hasSuggestions = predictions.length > 0;
  const shapeOk = validateAddressShape(inputValue.trim());
  const canAdvance =
    suggestionMode === "manual"
      ? inputValue.trim().length > 0 && shapeOk
      : inputValue.trim().length > 0 && !hasSuggestions && predictionState !== "loading";
  const effectiveSource: AddressSource =
    suggestionMode === "manual" ? "api_fallback" : lastSource;

  useEffect(() => {
    const current = lastEmitRef.current;
    if (
      current &&
      current.value === inputValue &&
      current.source === effectiveSource &&
      current.canAdvance === canAdvance
    ) {
      return;
    }
    lastEmitRef.current = { value: inputValue, source: effectiveSource, canAdvance };
    onChangeRef.current(inputValue, { source: effectiveSource, canAdvance });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, hasSuggestions, predictionState, suggestionMode, lastSource]);

  const showShapeWarning = !errorText && predictionState === "done" && !hasSuggestions && inputValue.trim().length > 0 && !shapeOk;

  return (
    <div>
      <div className="relative">
        <MapPin className={iconClassName} />
        <label htmlFor={id} className="sr-only">
          {placeholder || "Property Address"}
        </label>
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder || "Enter your property address"}
          value={inputValue}
          onChange={handleChange}
          className={className}
          required={required}
          autoFocus={autoFocus}
        />
        {hasSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
            <ul>
              {predictions.map((p) => (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onClick={() => {
                      if (suggestionMode === "proxy") {
                        void selectProxySuggestion(p);
                      } else {
                        selectSuggestion(p);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {highlightDescription(p.description, inputValue)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {errorText && (
        <div className="mt-3">
          <p className="text-xs text-red-600 flex items-start gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </p>
        </div>
      )}
      {!errorText && (hasSuggestions || showShapeWarning || suggestionMode === "proxy" || suggestionMode === "manual") && (
        <div className="mt-3 flex items-center gap-1.5 min-h-[20px]">
          {hasSuggestions && (
            <p className="text-xs text-muted-foreground">
              Please select from the suggestions above
            </p>
          )}
          {showShapeWarning && (
            <p className="text-xs text-muted-foreground">
              That doesn&apos;t look like a complete address. Please add a street
              number, street name, city, state, and ZIP.
            </p>
          )}
          {suggestionMode === "proxy" && inputValue.trim().length > 0 && !hasSuggestions && predictionState === "loading" && (
            <p className="text-xs text-muted-foreground">
              Loading address suggestions...
            </p>
          )}
          {suggestionMode === "manual" && inputValue.trim().length > 0 && !hasSuggestions && !showShapeWarning && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Address suggestions are unavailable. Enter a complete address; it will be verified on submit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

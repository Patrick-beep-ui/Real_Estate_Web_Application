"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, AlertTriangle } from "lucide-react";
import { validateAddressShape } from "@/lib/shared/addressValidation";
import type { AddressSource } from "@/lib/shared/addressValidation";

export type { AddressSource } from "@/lib/shared/addressValidation";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
  canAdvance: boolean;
}

export type AddressOnChange = (value: string, meta: AddressMeta) => void;

// Only the IP coords promise is shared module-scope (idempotent, keyed by IP,
// safe for any number of mounted instances). All per-instance state lives in
// the component so two forms on one page never stomp each other.
let geoPromise: Promise<{ lat: number; lng: number } | null> | null = null;

async function fetchGeoCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!geoPromise) {
      geoPromise = fetch("https://ipinfo.io/json")
        .then((r) => r.json())
        .then((d) => {
          if (d.loc) {
            const [lat, lng] = d.loc.split(",").map(Number);
            return lat && lng ? { lat, lng } : null;
          }
          return null;
        })
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

interface AddressAutocompleteProps {
  value: string;
  onChange: AddressOnChange;
  id: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  iconClassName?: string;
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
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const inputValueRef = useRef("");
  const lastEmitRef = useRef<{ value: string; source?: AddressSource; canAdvance: boolean } | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
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
    };
  }, []);

  // Load the Maps script. Service-unavailable is derived ONLY from this load
  // result — never from guessing at geocoder output. Nothing after this point
  // decides "unreachable" on its own.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setApiUnavailable(true);
      return;
    }
    let cancelled = false;
    try {
      const callbackName = "__gmp_cb_" + Date.now();
      (window as any)[callbackName] = () => {
        if (!cancelled) setScriptLoaded(true);
        delete (window as any)[callbackName];
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setApiUnavailable(true);
      };
      document.head.appendChild(script);
      return () => {
        cancelled = true;
        delete (window as any)[callbackName];
      };
    } catch {
      setApiUnavailable(true);
      // timeout fallback will also fire, but this is the explicit catch()
    }
  }, []);

  // If the script still hasn't loaded shortly after mount, treat it as
  // unavailable and fall back rather than leaving the user blocked forever.
  useEffect(() => {
    if (scriptLoaded || apiUnavailable) return;
    const timer = setTimeout(() => {
      setApiUnavailable(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [scriptLoaded, apiUnavailable]);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps?.places) return;
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    } catch {
      setApiUnavailable(true);
    }
  }, [scriptLoaded]);

  const runPredictions = (raw: string) => {
    const service = autocompleteServiceRef.current;
    if (!service) {
      setPredictionState("error");
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
          setPredictionState("error");
        }
      });
    } catch {
      setPredictions([]);
      setPredictionState("error");
    }
  };

  const runPredictionsDebounced = (raw: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPredictions(raw), 250);
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
    setPredictionState(raw.trim() ? "loading" : "idle");
    if (raw.trim()) {
      runPredictionsDebounced(raw.trim());
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  };

  // Push the current value + guard state up to the parent whenever it changes,
  // so step gates can enforce "you can't skip suggestions that are on screen."
  const hasSuggestions = predictions.length > 0;
  const shapeOk = validateAddressShape(inputValue.trim());
  const canAdvance =
    apiUnavailable
      ? inputValue.trim().length > 0
      : inputValue.trim().length > 0 && !hasSuggestions && predictionState !== "loading";
  const effectiveSource: AddressSource = apiUnavailable ? "api_fallback" : lastSource;

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
  }, [inputValue, hasSuggestions, predictionState, apiUnavailable, lastSource]);

  const showShapeWarning = !apiUnavailable && predictionState === "done" && !hasSuggestions && inputValue.trim().length > 0 && !shapeOk;

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
          <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {predictions.map((p) => (
              <li key={p.placeId}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(p)}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {highlightDescription(p.description, inputValue)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(hasSuggestions || showShapeWarning || apiUnavailable) && (
        <div className="mt-3 flex items-center gap-1.5 min-h-[20px]">
          {hasSuggestions && (
            <p className="text-xs text-muted-foreground">
              Please select from the suggestions above
            </p>
          )}
          {showShapeWarning && (
            <p className="text-xs text-muted-foreground">
              That doesn&apos;t look like a complete address. Please add a street
              number, street name, city, and ZIP.
            </p>
          )}
          {apiUnavailable && inputValue.trim().length > 0 && !hasSuggestions && !showShapeWarning && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Address lookup unavailable — submitting as typed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

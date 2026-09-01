"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, CheckCircle, AlertTriangle } from "lucide-react";

export type AddressSource = "google_selected" | "manual_confirmed" | "api_fallback";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
  unverified?: boolean;
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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(inputValue);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsLoaded, setCoordsLoaded] = useState(false);
  const [addressWasSelected, setAddressWasSelected] = useState(false);
  const [addressManuallyConfirmed, setAddressManuallyConfirmed] = useState(false);
  const [pendingOverride, setPendingOverride] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const [predictionState, setPredictionState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [predictions, setPredictions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchGeoCoords()
      .then((c) => {
        if (!cancelled) {
          setCoords(c);
          setCoordsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoords(null);
          setCoordsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      // No key configured — never block a lead. Emit existing input as fallback.
      setApiFailed(true);
      if (value.trim()) emitFallback(value);
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
        if (!cancelled) setScriptLoaded(false);
      };
      document.head.appendChild(script);
      return () => {
        cancelled = true;
        delete (window as any)[callbackName];
      };
    } catch {
      // timeout fallback will handle it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps?.places) return;
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    } catch (err) {
      console.error("[AddressAutocomplete] Service init failed:", err);
    }
  }, [scriptLoaded]);

  const emitFallback = (raw: string) => {
    onChangeRef.current(raw, { source: "api_fallback" });
  };

  const emitConfirmed = (raw: string, normalized: string) => {
    onChangeRef.current(normalized, { source: "manual_confirmed" });
    setInputValue(normalized);
    setAddressManuallyConfirmed(true);
  };

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
          setPredictions(
            res.map((p) => ({ placeId: p.place_id, description: p.description }))
          );
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

  // refs to avoid stale closures inside async callbacks
  const runPredictionsDebounced = (raw: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPredictions(raw), 250);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Maps script may fail to load — fall back to manual entry after a timeout.
  useEffect(() => {
    if (scriptLoaded || coordsLoaded === false) return;
    if (apiFailed) return;
    const timer = setTimeout(() => {
      if (!scriptLoaded) {
        setApiFailed(true);
        if (inputValueRef.current.trim()) {
          emitFallback(inputValueRef.current);
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [scriptLoaded, coordsLoaded, apiFailed]);

  const selectSuggestion = (s: Suggestion) => {
    const places = placesServiceRef.current;
    if (places) {
      places.getDetails(
        { placeId: s.placeId, fields: ["formatted_address", "address_components", "name"] },
        (place, status) => {
          if (status === "OK" && place) {
            const normalized = buildFormatted(place);
            setInputValue(normalized);
            setAddressWasSelected(true);
            setAddressManuallyConfirmed(false);
            setPendingOverride(false);
            setPredictions([]);
            setPredictionState("idle");
            onChangeRef.current(normalized, { source: "google_selected" });
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

  const handleManualConfirm = async () => {
    if (!inputValue.trim()) return;
    setVerifying(true);
    setPendingOverride(false);
    try {
      const { verifyAddress } = await import("@/lib/shared/addressValidation");
      const result = await verifyAddress(inputValue);
      if (result.status === "verified") {
        emitConfirmed(inputValue, result.normalized);
      } else if (result.status === "unverifiable") {
        // Do NOT accept the raw string. Require an explicit second click before
        // the value reaches the form, so an unverified address can never advance.
        setPendingOverride(true);
      } else {
        // service unavailable — accept to avoid losing the lead
        setAddressManuallyConfirmed(true);
        onChangeRef.current(inputValue, { source: "api_fallback" });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleUseAnyway = () => {
    setPendingOverride(false);
    setAddressManuallyConfirmed(true);
    onChangeRef.current(inputValue, {
      source: "manual_confirmed",
      unverified: true,
      override: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    setAddressWasSelected(false);
    setAddressManuallyConfirmed(false);
    setPendingOverride(false);
    setPredictions([]);
    setPredictionState("idle");
    const trimmed = raw.trim();
    if (trimmed) {
      runPredictionsDebounced(trimmed);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  };

  const isTyping = inputValue.length > 0;
  const isConfirmed = addressWasSelected || addressManuallyConfirmed || apiFailed;
  const showHint = isTyping && !isConfirmed && !pendingOverride;
  const suggestionsVisible = predictionState === "done" && predictions.length > 0;
  const noSuggestionsFound = predictionState === "done" && predictions.length === 0;
  const autocompleteDown = predictionState === "error" || apiFailed;

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
        {suggestionsVisible && (
          <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {predictions.map((p) => (
              <li key={p.placeId}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(p)}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {p.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(showHint || addressWasSelected || addressManuallyConfirmed || pendingOverride) && (
        <div className="mt-3 flex flex-col gap-1.5 min-h-[20px]">
          {showHint && (
            suggestionsVisible ? (
              <p className="text-xs text-muted-foreground">Please select from the suggestions above</p>
            ) : autocompleteDown ? (
              <button
                type="button"
                onClick={handleManualConfirm}
                disabled={verifying}
                className="text-xs text-primary underline hover:text-primary/80 transition-colors"
              >
                {verifying ? "Verifying address…" : "Confirm this address"}
              </button>
            ) : noSuggestionsFound ? (
              <p className="text-xs text-muted-foreground">
                We couldn&apos;t find that address.{" "}
                <button
                  type="button"
                  onClick={handleManualConfirm}
                  disabled={verifying}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {verifying ? "Verifying…" : "Enter it manually"}
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Searching…</p>
            )
          )}
          {pendingOverride && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600">
                We couldn&apos;t verify that address.{" "}
                <button
                  type="button"
                  onClick={handleUseAnyway}
                  className="text-primary underline hover:text-primary/80 transition-colors font-medium"
                >
                  Use it anyway — I confirm this is correct
                </button>
              </p>
            </div>
          )}
          {addressWasSelected && (
            <>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-600">Address verified</span>
              </span>
            </>
          )}
          {addressManuallyConfirmed && !pendingOverride && (
            <>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-600">Address confirmed</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

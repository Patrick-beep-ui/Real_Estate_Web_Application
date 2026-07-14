"use client";

import { useRef, useEffect, useState } from "react";
import { MapPin, CheckCircle } from "lucide-react";

let geoPromise: Promise<{ lat: number; lng: number } | null> | null = null;

async function fetchGeoCoords(): Promise<{ lat: number; lng: number } | null> {
  if (!geoPromise) {
    geoPromise = fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => (d.latitude ? { lat: d.latitude, lng: d.longitude } : null))
      .catch(() => null);
  }
  return geoPromise;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsLoaded, setCoordsLoaded] = useState(false);
  const [addressWasSelected, setAddressWasSelected] = useState(false);
  const [addressManuallyConfirmed, setAddressManuallyConfirmed] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    fetchGeoCoords().then((c) => {
      setCoords(c);
      setCoordsLoaded(true);
    });
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    const callbackName = "__gmp_cb_" + Date.now();
    (window as any)[callbackName] = () => {
      setScriptLoaded(true);
      delete (window as any)[callbackName];
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const ready = scriptLoaded && coordsLoaded;

  const checkForSuggestions = () => {
    const pacContainer = document.querySelector(".pac-container");
    if (pacContainer) {
      const items = pacContainer.querySelectorAll(".pac-item");
      setSuggestionsVisible(items.length > 0);
    } else {
      setSuggestionsVisible(false);
    }
  };

  const checkForSuggestionsDebounced = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(checkForSuggestions, 350);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    const options: google.maps.places.AutocompleteOptions & {
      location?: google.maps.LatLng;
      radius?: number;
    } = {
      types: ["address"],
      componentRestrictions: { country: "us" },
    };
    if (coords) {
      options.location = new google.maps.LatLng(coords.lat, coords.lng);
      options.radius = 80000;
    }
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);
    autocomplete.setFields(["formatted_address", "address_components", "name"]);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      let formatted = "";

      if (place.address_components) {
        const streetNumber = place.address_components.find((c) =>
          c.types.includes("street_number")
        )?.long_name || "";
        const route = place.address_components.find((c) =>
          c.types.includes("route")
        )?.long_name || "";
        const city = place.address_components.find((c) =>
          c.types.includes("locality")
        )?.long_name || "";
        const state = place.address_components.find((c) =>
          c.types.includes("administrative_area_level_1")
        )?.short_name || "";
        const zip = place.address_components.find((c) =>
          c.types.includes("postal_code")
        )?.long_name || "";

        const street = `${streetNumber} ${route}`.trim();
        const parts = [street, city, state ? `${state} ${zip}` : zip].filter(Boolean);
        formatted = parts.join(", ");
      }

      if (!formatted) {
        formatted = place.formatted_address || place.name || "";
      }

      if (formatted) {
        setInputValue(formatted);
        setAddressWasSelected(true);
        setAddressManuallyConfirmed(false);
        onChange(formatted);
      }
    });
    autocompleteRef.current = autocomplete;
    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const observer = new MutationObserver(checkForSuggestions);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (ready || apiFailed) return;
    const timer = setTimeout(() => {
      if (!scriptLoaded) {
        setApiFailed(true);
        if (inputValue.trim()) {
          onChange(inputValue);
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [ready, apiFailed, scriptLoaded, inputValue, onChange]);

  const handleManualConfirm = () => {
    setAddressManuallyConfirmed(true);
    onChange(inputValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setAddressWasSelected(false);
    setAddressManuallyConfirmed(false);
    checkForSuggestionsDebounced();
  };

  const isTyping = inputValue.length > 0;
  const isConfirmed = addressWasSelected || addressManuallyConfirmed || apiFailed;
  const showHint = isTyping && !isConfirmed;

  return (
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
      {showHint && (
        <div className="absolute left-0 top-full mt-1 z-10 flex items-center gap-2">
          {suggestionsVisible ? (
            <p className="text-xs text-muted-foreground">
              Please select from the suggestions above
            </p>
          ) : (
            <button
              type="button"
              onClick={handleManualConfirm}
              className="text-xs text-primary underline hover:text-primary/80 transition-colors"
            >
              Confirm this address
            </button>
          )}
        </div>
      )}
      {addressWasSelected && (
        <div className="absolute left-0 top-full mt-1 z-10 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <p className="text-xs text-green-600">Address verified</p>
        </div>
      )}
      {addressManuallyConfirmed && (
        <div className="absolute left-0 top-full mt-1 z-10 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <p className="text-xs text-green-600">Address confirmed</p>
        </div>
      )}
    </div>
  );
}

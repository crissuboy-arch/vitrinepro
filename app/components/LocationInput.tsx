"use client";

import { useState, useEffect, useRef } from "react";

interface Place {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface LocationInputProps {
  value: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    lat: number;
    lng: number;
  };
  onChange: (location: LocationInputProps["value"]) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [query, setQuery] = useState(value.address || "");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAddress = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=5&countrycodes=pt,br`,
          {
            headers: {
              "User-Agent": "VitrinePro/1.0",
            },
          }
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (place: Place) => {
    const city =
      place.address.city ||
      place.address.town ||
      place.address.village ||
      place.address.state ||
      "";
    
    onChange({
      address: place.display_name.split(",")[0],
      city: city,
      country: place.address.country || "",
      postalCode: place.address.postcode || "",
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    });
    setQuery(place.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const clearLocation = () => {
    setQuery("");
    onChange({
      address: "",
      city: "",
      country: "",
      postalCode: "",
      lat: 0,
      lng: 0,
    });
  };

  return (
    <div ref={inputRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Localização
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Digite o endereço..."
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex flex-col"
            >
              <span className="text-slate-800">{place.display_name.split(",")[0]}</span>
              <span className="text-slate-500 text-xs">
                {place.address.city || place.address.town || place.address.village}
                {place.address.state && `, ${place.address.state}`}
                {place.address.country && ` - ${place.address.country}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {value.lat !== 0 && value.lng !== 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Localização definida
          </span>
          <button
            onClick={clearLocation}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Alterar
          </button>
        </div>
      )}
    </div>
  );
}
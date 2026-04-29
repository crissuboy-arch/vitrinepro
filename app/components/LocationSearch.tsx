"use client";

import { useState } from "react";
import LocationInput from "./LocationInput";
import MapDisplay from "./MapDisplay";

interface LocationData {
  address: string;
  city: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  showMap?: boolean;
}

export default function LocationSearch({
  value,
  onChange,
  showMap = true,
}: LocationSearchProps) {
  const [searchMode, setSearchMode] = useState<"city" | "nearby">("city");

  const handleCitySearch = async (city: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          city
        )}&limit=1`,
        {
          headers: { "User-Agent": "VitrinePro/1.0" },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        onChange({
          address: data[0].display_name.split(",")[0],
          city: data[0].address.city || data[0].address.town || data[0].name,
          country: data[0].address.country || "",
          postalCode: data[0].address.postcode || "",
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      }
    } catch (error) {
      console.error("City search error:", error);
    }
  };

  const handleNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            address: "Minha localização",
            city: "Próximo",
            country: "",
            postalCode: "",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchMode("city")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            searchMode === "city"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🔍 Buscar por cidade
        </button>
        <button
          onClick={() => {
            setSearchMode("nearby");
            handleNearby();
          }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            searchMode === "nearby"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📍 Perto de mim
        </button>
      </div>

      {/* Input or Nearby display */}
      {searchMode === "city" ? (
        <LocationInput value={value} onChange={onChange} />
      ) : value.lat !== 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm flex items-center gap-2">
            <span>📍</span>
            Localização atual detectada
          </p>
          <button
            onClick={handleNearby}
            className="text-xs text-green-600 mt-1 hover:underline"
          >
            Atualizar localização
          </button>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <p className="text-slate-600 text-sm">Clique para detectar sua localização</p>
        </div>
      )}

      {/* Map Display */}
      {showMap && value.lat !== 0 && value.lng !== 0 && (
        <MapDisplay
          lat={value.lat}
          lng={value.lng}
          address={value.address}
        />
      )}
    </div>
  );
}
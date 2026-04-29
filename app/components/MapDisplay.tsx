"use client";

import { useEffect, useRef } from "react";

interface MapDisplayProps {
  lat: number;
  lng: number;
  address?: string;
  businessName?: string;
  compact?: boolean;
}

export default function MapDisplay({
  lat,
  lng,
  address,
  businessName,
  compact = false,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!lat || !lng || !mapRef.current || typeof window === "undefined") return;

    const mapContainer = mapRef.current;
    if (!mapContainer) return;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainer, {
        center: [lat, lng],
        zoom: compact ? 15 : 16,
        zoomControl: false,
        dragging: !compact,
        scrollWheelZoom: !compact,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:#d4af37;width:24px;height:24px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg style="width:12px;height:12px;fill:#0f172a;" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6c0 5 6 10 6 10s6-5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(map);

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, compact]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lng}&q=${encodeURIComponent(address || "")}`;

  if (!lat || !lng) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div
          ref={mapRef}
          className="w-full h-48 rounded-lg overflow-hidden bg-slate-100"
        />
      )}

      {compact && (
        <div
          ref={mapRef}
          className="w-full h-32 rounded-lg overflow-hidden bg-slate-100"
        />
      )}

      <div className="flex gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-3.59 0-6.5-2.91-6.5-6.5S6.41 3.5 10 3.5s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z" />
          </svg>
          Ver no mapa
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 bg-[#35ef5b] text-slate-900 text-sm font-medium rounded-lg hover:bg-[#2ddb4f] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v10l7 5 7-5V7l-7-5zm0 2.5l4 2.5v6l-4 2.5-4-2.5v-6l4-2.5z" />
          </svg>
          Traçar rota
        </a>
      </div>
    </div>
  );
}
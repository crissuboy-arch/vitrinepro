/* eslint-disable */
/**
 * app/components/NearbyMap.tsx — A4.12
 *
 * Multi-marker Leaflet map for discovery ("Perto de Mim" / /explorar).
 * Reuses the exact lazy-loading pattern of MapDisplay (single Leaflet
 * stack in the project — no second map library).
 *
 *  - Markers: filtered businesses WITH valid coordinates only.
 *  - Blue dot: the visitor's location (session-only, never persisted).
 *  - No markers → the caller shows an empty state; this component renders
 *    nothing when there is nothing valid to draw.
 */
"use client";

import { useEffect, useRef } from "react";

export interface NearbyMapBusiness {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}

interface NearbyMapProps {
  businesses: NearbyMapBusiness[];
  userLocation?: { lat: number; lng: number } | null;
}

export default function NearbyMap({ businesses, userLocation }: NearbyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const validBusinesses = businesses.filter(
    (b) =>
      Number.isFinite(b.lat) &&
      Number.isFinite(b.lng) &&
      b.lat >= -90 &&
      b.lat <= 90 &&
      b.lng >= -180 &&
      b.lng <= 180
  );

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;
    if (validBusinesses.length === 0 && !userLocation) return;

    const mapContainer = mapRef.current;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [validBusinesses[0].lat, validBusinesses[0].lng];

      const map = L.map(mapContainer, {
        center,
        zoom: userLocation ? 13 : 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds: Array<[number, number]> = [];

      // Business markers (gold pin, links to the public vitrine)
      for (const b of validBusinesses) {
        const icon = L.divIcon({
          className: "nearby-marker",
          html: `<div style="background:#d4af37;width:26px;height:26px;border-radius:50%;border:3px solid #0f172a;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
            <svg style="width:13px;height:13px;fill:#0f172a;" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6c0 5 6 10 6 10s6-5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
            </svg></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
        const safeName = b.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        marker.bindPopup(
          `<a href="/vitrine/${encodeURIComponent(b.slug)}" style="font-weight:700;color:#0f172a;">${safeName}</a>`
        );
        bounds.push([b.lat, b.lng]);
      }

      // Visitor location (blue dot — session only)
      if (userLocation) {
        const dot = L.divIcon({
          className: "nearby-user",
          html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.25);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: dot }).addTo(map);
        bounds.push([userLocation.lat, userLocation.lng]);
      }

      if (bounds.length > 1) {
        map.fitBounds(L.latLngBounds(bounds).pad(0.15));
      }

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // Rebuild when the marker set or the user location changes.
  }, [JSON.stringify(validBusinesses.map((b) => [b.id, b.lat, b.lng])), userLocation?.lat, userLocation?.lng]);

  if (validBusinesses.length === 0 && !userLocation) return null;

  return (
    <div
      ref={mapRef}
      className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800 z-0"
      aria-label="Mapa de negócios próximos"
    />
  );
}

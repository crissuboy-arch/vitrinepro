"use client";

import { useState, useEffect } from "react";
import { isFavorited, toggleFavorite } from "@/lib/favorites";

const GOLD = "#C8A96B";

export default function FavoriteButton({
  businessId,
  initialCount = 0,
  initialFavorited,
  showCount = true,
  variant = "card",
  className = "",
}: {
  businessId: string;
  initialCount?: number;
  initialFavorited?: boolean;
  showCount?: boolean;
  variant?: "card" | "header";
  className?: string;
}) {
  const [fav, setFav] = useState(initialFavorited ?? false);
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If the caller preloaded the favorite state, skip the per-button fetch.
    if (initialFavorited !== undefined) return;
    let active = true;
    isFavorited(businessId)
      .then((v) => { if (active) setFav(v); })
      .catch(() => {});
    return () => { active = false; };
  }, [businessId, initialFavorited]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    const optimistic = !fav;
    setFav(optimistic);
    setCount((c) => Math.max(0, c + (optimistic ? 1 : -1)));
    if (optimistic) {
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }

    try {
      const real = await toggleFavorite(businessId);
      if (real !== optimistic) {
        // Reconcile if the server disagreed with the optimistic guess.
        setFav(real);
        setCount((c) => Math.max(0, c + (real ? 1 : -1) - (optimistic ? 1 : -1)));
      }
    } catch {
      setFav(!optimistic);
      setCount((c) => Math.max(0, c - (optimistic ? 1 : -1)));
    } finally {
      setBusy(false);
    }
  }

  const heart = (
    <svg
      viewBox="0 0 24 24"
      width={variant === "header" ? 20 : 18}
      height={variant === "header" ? 20 : 18}
      fill={fav ? GOLD : "none"}
      stroke={fav ? GOLD : "currentColor"}
      strokeWidth="2"
      style={{ transform: pulse ? "scale(1.3)" : "scale(1)", transition: "transform 0.3s ease" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={fav}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
          fav ? "border-[#C8A96B]/50 bg-[#C8A96B]/10 text-[#C8A96B]" : "border-slate-700 text-slate-300 hover:border-[#C8A96B]/40"
        } ${className}`}
      >
        {heart}
        <span className="text-xs font-bold">{fav ? "Guardado" : "Guardar"}</span>
        {showCount && <span className="text-xs text-slate-400">· {count}</span>}
      </button>
    );
  }

  // "card" variant — pill for a marketplace card corner.
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={fav}
      aria-label="Favoritar"
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition-colors ${
        fav ? "text-[#C8A96B]" : "text-gray-200"
      } ${className}`}
    >
      {heart}
      {showCount && <span className="text-xs font-semibold">{count}</span>}
    </button>
  );
}

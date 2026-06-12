"use client";

import { useState } from "react";
import { uploadCover } from "@/lib/supabase-storage";
import { updateBusiness } from "@/lib/business-actions";

// Feature 1 — Professional cover editor.
// Three ways to set a business cover: upload an image, pick a solid colour, or
// pick a premium gradient. Image is stored in `cover_url` (existing column);
// colour/gradient are stored as a CSS string in `cover_gradient` (migration 008).
// Render priority everywhere: cover_url > cover_gradient > #0a0d14.

const GOLD = "#C8A96B";

const PRESET_COLORS = [
  "#0a0d14", "#1a2235", "#7b2d1e", "#1e3a1e",
  "#2d1e3a", "#3a2d1e", "#1e2d3a", "#0d1f0d",
];

const GRADIENTS: { name: string; css: string }[] = [
  { name: "Noite Dourada", css: "linear-gradient(135deg, #0a0d14 0%, #1a1500 100%)" },
  { name: "Oceano", css: "linear-gradient(135deg, #0a1628 0%, #0d3b5e 100%)" },
  { name: "Vinho", css: "linear-gradient(135deg, #1a0a0a 0%, #4a1020 100%)" },
  { name: "Floresta", css: "linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 100%)" },
  { name: "Pôr do Sol", css: "linear-gradient(135deg, #1a0a00 0%, #3a1a00 100%)" },
  { name: "Roxo Premium", css: "linear-gradient(135deg, #0a0a1a 0%, #1a0a3a 100%)" },
];

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Tab = "upload" | "color" | "gradient";

export type CoverPatch = { cover_url?: string; cover_gradient?: string };

export default function CoverEditorModal({
  businessId,
  currentCoverUrl,
  currentGradient,
  onClose,
  onSaved,
}: {
  businessId: string;
  currentCoverUrl?: string | null;
  currentGradient?: string | null;
  onClose: () => void;
  onSaved: (patch: CoverPatch) => void;
}) {
  const gradientIsLinear = !!currentGradient && currentGradient.startsWith("linear-gradient");
  const initialTab: Tab = currentCoverUrl
    ? "upload"
    : gradientIsLinear
    ? "gradient"
    : currentGradient
    ? "color"
    : "upload";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(currentCoverUrl || null);
  const [color, setColor] = useState<string>(
    currentGradient && !gradientIsLinear ? currentGradient : PRESET_COLORS[0],
  );
  const [gradient, setGradient] = useState<string>(
    gradientIsLinear ? (currentGradient as string) : GRADIENTS[0].css,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato inválido. Usa JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Imagem demasiado grande (máximo 5 MB).");
      return;
    }
    setError(null);
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  }

  // Background of the live preview pane for the active tab.
  const previewStyle: React.CSSProperties =
    tab === "upload" && filePreview
      ? { backgroundImage: `url(${filePreview})`, backgroundSize: "cover", backgroundPosition: "center" }
      : tab === "color"
      ? { background: color }
      : tab === "gradient"
      ? { background: gradient }
      : { background: "#0a0d14" };

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let patch: CoverPatch;
      if (tab === "upload") {
        if (!file) {
          // No new file chosen — nothing to do.
          onClose();
          return;
        }
        const url = await uploadCover(file, businessId);
        // Only touch cover_url so an image works even before migration 008.
        patch = { cover_url: url };
      } else {
        const value = tab === "color" ? color : gradient;
        // Clear the image so the colour/gradient is visible (cover_url has priority).
        patch = { cover_url: "", cover_gradient: value };
      }

      const res = await updateBusiness(businessId, patch);
      if (!res.success) throw new Error(res.error || "Erro ao guardar a capa.");
      onSaved(patch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao guardar a capa.";
      // Friendly hint if the gradient column hasn't been migrated yet.
      if (/cover_gradient/.test(msg)) {
        setError("Aplica a migration 008_cover_gradient no Supabase para guardar cores e gradientes.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => { setTab(id); setError(null); }}
      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
        tab === id
          ? "bg-[#C8A96B] text-[#0a0d14]"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Editor de Capa</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Live preview */}
        <div className="px-6 pt-5">
          <div
            className="h-40 w-full rounded-xl border border-gray-800 flex items-center justify-center"
            style={previewStyle}
          >
            {tab === "upload" && !filePreview && (
              <span className="text-gray-500 text-sm">Pré-visualização da capa</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-5">
          {tabBtn("upload", "Imagem")}
          {tabBtn("color", "Cor")}
          {tabBtn("gradient", "Gradiente")}
        </div>

        {/* Tab content */}
        <div className="px-6 py-5 min-h-[140px]">
          {tab === "upload" && (
            <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-700 hover:border-[#C8A96B] rounded-xl cursor-pointer transition-colors">
              <span className="text-2xl">🖼️</span>
              <span className="text-sm text-gray-300 font-semibold">Escolher imagem</span>
              <span className="text-[11px] text-gray-500">JPG, PNG ou WebP · máx. 5 MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </label>
          )}

          {tab === "color" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    className={`h-12 rounded-lg border-2 transition-transform hover:scale-105 ${
                      color === c ? "border-[#C8A96B]" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 rounded cursor-pointer bg-transparent border border-gray-700"
                />
                <span className="text-sm text-gray-400">Cor personalizada</span>
                <span className="ml-auto text-xs font-mono text-gray-400">{color}</span>
              </div>
            </div>
          )}

          {tab === "gradient" && (
            <div className="grid grid-cols-2 gap-3">
              {GRADIENTS.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setGradient(g.css)}
                  className={`h-16 rounded-lg border-2 flex items-end p-2 transition-transform hover:scale-[1.02] ${
                    gradient === g.css ? "border-[#C8A96B]" : "border-transparent"
                  }`}
                  style={{ background: g.css }}
                >
                  <span className="text-[11px] font-semibold text-white/90 drop-shadow">{g.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-3 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0a0d14] transition-colors disabled:opacity-60"
            style={{ minWidth: 110 }}
          >
            {saving ? "A guardar..." : "Guardar capa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { GOLD };

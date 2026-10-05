"use client";

import { useRef, useState } from "react";
import {
  CoverFraming,
  DEFAULT_COVER_FRAMING,
  MIN_COVER_ZOOM,
  MAX_COVER_ZOOM,
  coverImgStyle,
} from "@/lib/cover-framing";

interface Props {
  coverUrl: string;
  initial: CoverFraming;
  onSave: (f: CoverFraming) => Promise<void>;
  onReplace: () => void;
  onRemove: () => Promise<void>;
  onClose: () => void;
}

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Editor de enquadramento da capa — CSS puro, sem bibliotecas.
 * Arrastar (mouse + touch via Pointer Events) move a imagem;
 * zoom ajusta a escala. A original nunca é alterada.
 */
export default function CoverFramingEditor({
  coverUrl,
  initial,
  onSave,
  onReplace,
  onRemove,
  onClose,
}: Props) {
  const [framing, setFraming] = useState<CoverFraming>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: framing.x, oy: framing.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const el = areaRef.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    // Arrastar para a direita revela a parte esquerda → x diminui.
    const dxPct = ((e.clientX - d.sx) / rect.width) * 100;
    const dyPct = ((e.clientY - d.sy) / rect.height) * 100;
    setFraming((f) => ({
      ...f,
      x: clampPct(d.ox - dxPct),
      y: clampPct(d.oy - dyPct),
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const zoomBy = (delta: number) =>
    setFraming((f) => ({
      ...f,
      zoom: Math.min(MAX_COVER_ZOOM, Math.max(MIN_COVER_ZOOM, +(f.zoom + delta).toFixed(2))),
    }));

  const reset = () => setFraming({ ...DEFAULT_COVER_FRAMING });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(framing);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remover a imagem de capa?")) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  const style = coverImgStyle(framing);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Editar enquadramento da capa"
    >
      <div
        className="w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Editar enquadramento</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preview real do banner */}
        <div className="px-5 pt-4">
          <div
            ref={areaRef}
            className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 select-none"
          >
            <img
              src={coverUrl}
              alt="Pré-visualização da capa"
              draggable={false}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
              style={{ ...style, touchAction: "none" }}
            />
            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-xl" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Arrasta a imagem para enquadrar · {Math.round(framing.x)}% / {Math.round(framing.y)}% · zoom {framing.zoom.toFixed(2)}×
          </p>
        </div>

        {/* Zoom */}
        <div className="flex items-center justify-center gap-3 px-5 py-3">
          <button
            onClick={() => zoomBy(-0.25)}
            disabled={framing.zoom <= MIN_COVER_ZOOM}
            aria-label="Diminuir zoom"
            className="w-10 h-10 rounded-full border border-white/15 text-white text-lg font-bold hover:border-[#C8A96B]/60 transition-colors disabled:opacity-30"
          >
            −
          </button>
          <span className="text-xs text-slate-400 w-16 text-center">Zoom</span>
          <button
            onClick={() => zoomBy(0.25)}
            disabled={framing.zoom >= MAX_COVER_ZOOM}
            aria-label="Aumentar zoom"
            className="w-10 h-10 rounded-full border border-white/15 text-white text-lg font-bold hover:border-[#C8A96B]/60 transition-colors disabled:opacity-30"
          >
            +
          </button>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
          <button
            onClick={reset}
            className="px-4 py-2.5 border border-white/15 text-slate-300 hover:text-white hover:border-white/40 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors"
          >
            Repor
          </button>
          <button
            onClick={onReplace}
            className="px-4 py-2.5 border border-white/15 text-slate-300 hover:text-white hover:border-white/40 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors"
          >
            Trocar imagem
          </button>
          <button
            onClick={remove}
            disabled={removing}
            className="px-4 py-2.5 border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {removing ? "…" : "Remover"}
          </button>
          <div className="flex-1" />
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

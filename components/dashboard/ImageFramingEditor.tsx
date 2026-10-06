"use client";

import { useRef, useState } from "react";
import {
  ImageFraming,
  centerFraming,
  fitAreaFraming,
  restoreFraming,
  dragFraming,
  zoomFraming,
  DEFAULT_IMAGE_FRAMING,
} from "@/lib/image-framing";

interface Props {
  imageUrl: string;
  initial: ImageFraming;
  onSave: (f: ImageFraming) => Promise<void>;
  onReplace: () => void;
  onRemove: () => Promise<void>;
  onClose: () => void;
  /** Título do modal. Ex.: "Enquadramento do produto" */
  title: string;
  /** Proporção do preview real do card. Ex.: "4/5" (produto), "16/9" (capa) */
  previewAspect: string;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Editor genérico de enquadramento — CSS puro, sem bibliotecas.
 * Usado pela capa e pelo produto para a experiência ficar consistente.
 *
 * - Arrastar (mouse + touch via Pointer Events) escolhe a parte visível.
 * - "Centralizar imagem": x=50/y=50, preserva o zoom atual.
 * - "Ajustar à área": centro + zoom padrão (ponto inicial correto).
 * - "Repor": volta aos valores guardados ao abrir (descarta edições).
 * - A imagem original nunca é alterada; sem crop destrutivo.
 */
export default function ImageFramingEditor({
  imageUrl,
  initial,
  onSave,
  onReplace,
  onRemove,
  onClose,
  title,
  previewAspect,
  minZoom = 1,
  maxZoom = 3,
}: Props) {
  const initialRef = useRef<ImageFraming>({ ...initial });
  const [framing, setFraming] = useState<ImageFraming>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; base: ImageFraming } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, base: { ...framing } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const el = areaRef.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const dxPct = ((e.clientX - d.sx) / rect.width) * 100;
    const dyPct = ((e.clientY - d.sy) / rect.height) * 100;
    setFraming(dragFraming(d.base, dxPct, dyPct));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const style = {
    objectPosition: `${framing.x}% ${framing.y}%`,
    transform: `scale(${framing.zoom})`,
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ ...framing });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remover esta imagem?")) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className="w-full max-w-md m-auto bg-[#0F172A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Preview real do card */}
          <div className="px-5 pt-4">
            <div
              ref={areaRef}
              className="relative w-full rounded-xl overflow-hidden bg-slate-900 select-none"
              style={{ aspectRatio: previewAspect }}
            >
              <img
                src={imageUrl}
                alt="Pré-visualização"
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
              Arraste a imagem para escolher o que ficará visível
            </p>
            <p className="text-[11px] text-slate-600">
              {Math.round(framing.x)}% / {Math.round(framing.y)}% · zoom {framing.zoom.toFixed(2)}×
            </p>
          </div>

          {/* Centralizar / Ajustar */}
          <div className="flex items-center justify-center gap-2 px-5 pt-3">
            <button
              onClick={() => setFraming((f) => centerFraming(f))}
              className="flex-1 px-3 py-2.5 border border-white/15 text-slate-200 hover:text-white hover:border-[#C8A96B]/60 text-xs font-semibold rounded-lg transition-colors"
            >
              Centralizar imagem
            </button>
            <button
              onClick={() => setFraming(fitAreaFraming())}
              className="flex-1 px-3 py-2.5 border border-white/15 text-slate-200 hover:text-white hover:border-[#C8A96B]/60 text-xs font-semibold rounded-lg transition-colors"
            >
              Ajustar à área
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center justify-center gap-3 px-5 py-3">
            <button
              onClick={() => setFraming((f) => zoomFraming(f, -0.25, minZoom, maxZoom))}
              disabled={framing.zoom <= minZoom}
              aria-label="Diminuir zoom"
              className="w-10 h-10 rounded-full border border-white/15 text-white text-lg font-bold hover:border-[#C8A96B]/60 transition-colors disabled:opacity-30"
            >
              −
            </button>
            <span className="text-xs text-slate-400 w-16 text-center">Zoom</span>
            <button
              onClick={() => setFraming((f) => zoomFraming(f, 0.25, minZoom, maxZoom))}
              disabled={framing.zoom >= maxZoom}
              aria-label="Aumentar zoom"
              className="w-10 h-10 rounded-full border border-white/15 text-white text-lg font-bold hover:border-[#C8A96B]/60 transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>

          {/* Ações */}
          <div className="px-5 pb-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFraming(restoreFraming(initialRef.current))}
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
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="w-full px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {saving ? "A guardar…" : "Guardar enquadramento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_IMAGE_FRAMING };

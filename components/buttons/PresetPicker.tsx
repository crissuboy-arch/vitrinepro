"use client";

import { Sparkles } from "lucide-react";
import type { PageButton } from "@/types/buttons";
import { BUTTON_PRESETS, type ButtonPreset } from "./buttonPresets";
import { CustomButtonRenderer } from "./CustomButtonRenderer";

interface Props {
  hasSelection: boolean;
  onApplyToSelected: (preset: ButtonPreset) => void;
  onApplyToAll: (preset: ButtonPreset) => void;
}

function previewButton(preset: ButtonPreset): PageButton {
  return {
    id: `preview-${preset.id}`,
    businessId: "preview",
    type: "custom",
    label: preset.name,
    sublabel: preset.description,
    url: "#",
    icon: "Sparkles",
    style: preset.style,
    rules: {},
    order: 0,
    active: true,
    clickCount: 0,
  };
}

export default function PresetPicker({
  hasSelection,
  onApplyToSelected,
  onApplyToAll,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-white/5 p-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A96B]" />
        <p className="text-[11px] leading-relaxed text-gray-400">
          Aplique um estilo pronto (Apple, Glass, Luxury, Neon, Gold…) ao botão
          selecionado ou a todos de uma vez. As cores e a animação são
          substituídas; o conteúdo mantém-se.
        </p>
      </div>

      <div className="space-y-2.5">
        {BUTTON_PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="space-y-2 rounded-xl border border-gray-800 bg-[#0F172A] p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{preset.name}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                {preset.category}
              </span>
            </div>

            <div
              className="rounded-lg border border-white/5 p-3"
              style={{ backgroundColor: preset.previewBg }}
            >
              <CustomButtonRenderer button={previewButton(preset)} isInteractive={false} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => onApplyToSelected(preset)}
                className="flex-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                Aplicar ao selecionado
              </button>
              <button
                type="button"
                onClick={() => onApplyToAll(preset)}
                className="flex-1 rounded-lg bg-[#C8A96B] py-1.5 text-[10px] font-bold text-[#0F172A] transition-colors hover:bg-[#D4BB82]"
              >
                Aplicar a todos
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

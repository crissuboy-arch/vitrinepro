"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  BUTTON_CATALOG,
  type ButtonCatalogItem,
} from "./buttonPresets";
import { getButtonIcon } from "./buttonIcons";

interface Props {
  onPick: (item: ButtonCatalogItem) => void;
  onClose: () => void;
}

const CATEGORIES = [
  "Todos",
  "Redes Sociais",
  "Mensagens & Chamadas",
  "Pagamentos",
  "Agendamentos & Formulários",
  "Outros & Links",
] as const;

export default function ButtonCatalogModal({ onPick, onClose }: Props) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");

  const items = useMemo(
    () =>
      cat === "Todos"
        ? BUTTON_CATALOG
        : BUTTON_CATALOG.filter((i) => i.category === cat),
    [cat],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar botão"
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-800 bg-[#0F172A] shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <div>
            <h2 className="text-base font-semibold text-[#C8A96B]">
              Biblioteca de botões
            </h2>
            <p className="text-xs text-gray-500">
              Escolha um canal ou rede para adicionar em 1 clique.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-gray-800 px-4 py-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                cat === c
                  ? "bg-[#C8A96B] text-[#0F172A]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2.5 overflow-y-auto p-4 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.type + item.name}
              type="button"
              onClick={() => onPick(item)}
              className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0a0d14] p-3 text-left transition-colors hover:border-[#C8A96B]/50"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: item.brandColor }}
              >
                {getButtonIcon(item.iconName, item.type, "w-5 h-5")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-white">
                  {item.name}
                </span>
                <span className="block truncate text-[10px] text-gray-500">
                  {item.category}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

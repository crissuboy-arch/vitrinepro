"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  MousePointerClick,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { PageButton } from "@/types/buttons";
import { getButtonIcon } from "./buttonIcons";

interface Props {
  buttons: PageButton[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onToggleActive: (button: PageButton) => void;
  onDuplicate: (button: PageButton) => void;
  onDelete: (button: PageButton) => void;
  onAddDivider: () => void;
}

type Filter = "todos" | "ativos" | "inativos" | "separadores";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "inativos", label: "Inativos" },
  { id: "separadores", label: "Separadores" },
];

export default function ButtonList({
  buttons,
  selectedId,
  onSelect,
  onMove,
  onToggleActive,
  onDuplicate,
  onDelete,
  onAddDivider,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buttons.filter((b) => {
      const matchesQuery =
        !q ||
        b.label.toLowerCase().includes(q) ||
        (b.sublabel ?? "").toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === "ativos") return b.active;
      if (filter === "inativos") return !b.active;
      if (filter === "separadores") return b.type === "divider";
      return true;
    });
  }, [buttons, query, filter]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar botões..."
          className="w-full rounded-lg border border-gray-800 bg-[#0a0d14] py-2 pl-9 pr-8 text-xs text-[#f5f0e8] outline-none focus:border-[#C8A96B]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar pesquisa"
            className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors ${
                filter === f.id
                  ? "bg-[#C8A96B] text-[#0F172A]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddDivider}
          className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-gray-300 hover:bg-white/10"
        >
          + Separador
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-[#0a0d14] p-8 text-center">
          <MousePointerClick className="mx-auto mb-2 h-8 w-8 text-gray-600" />
          <p className="text-xs font-semibold text-gray-300">
            Nenhum botão encontrado
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Use &quot;Adicionar botão&quot; para incluir redes ou links.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((btn) => {
            const isSelected = btn.id === selectedId;
            const idxInFull = buttons.findIndex((b) => b.id === btn.id);
            return (
              <li
                key={btn.id}
                onClick={() => onSelect(btn.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-colors ${
                  isSelected
                    ? "border-[#C8A96B] bg-[#C8A96B]/10"
                    : "border-gray-800 bg-[#0a0d14] hover:border-gray-700"
                } ${!btn.active ? "opacity-55" : ""}`}
              >
                <div
                  className="flex shrink-0 flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onMove(btn.id, "up")}
                    disabled={idxInFull === 0}
                    aria-label="Mover para cima"
                    className="text-gray-500 hover:text-white disabled:opacity-20"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(btn.id, "down")}
                    disabled={idxInFull === buttons.length - 1}
                    aria-label="Mover para baixo"
                    className="text-gray-500 hover:text-white disabled:opacity-20"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10"
                  style={{
                    backgroundColor: btn.style.bgColor || "#0B1B33",
                    color: btn.style.iconColor || "#FFFFFF",
                  }}
                >
                  {getButtonIcon(btn.icon, btn.type, "w-4 h-4")}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-white">
                    <span className="truncate">{btn.label || "Sem nome"}</span>
                    {btn.style.animation && btn.style.animation !== "none" && (
                      <span className="rounded bg-[#C8A96B]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#C8A96B]">
                        {btn.style.animation}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-gray-500">
                    {btn.sublabel || btn.url || "Link não especificado"}
                  </div>
                </div>

                <div
                  className="flex shrink-0 items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleActive(btn)}
                    aria-label={btn.active ? "Ocultar botão" : "Mostrar botão"}
                    className={`rounded-lg p-1.5 ${
                      btn.active
                        ? "text-emerald-400 hover:bg-emerald-400/10"
                        : "text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    {btn.active ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(btn)}
                    aria-label="Duplicar botão"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(btn)}
                    aria-label="Eliminar botão"
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import type { RedeSocial, ContentStatus, ViewMode } from "@/types/content-calendar";
import { REDES, STATUS_OPTIONS } from "@/types/content-calendar";

interface Props {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  rede: RedeSocial | "todas";
  onRede: (r: RedeSocial | "todas") => void;
  status: ContentStatus | "todos";
  onStatus: (s: ContentStatus | "todos") => void;
}

const selectCls =
  "rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white outline-none focus:border-[#C8A96B]";

export default function CalendarFilters({
  view,
  onView,
  rede,
  onRede,
  status,
  onStatus,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-lg border border-gray-800 bg-gray-900 p-1">
        <button
          type="button"
          onClick={() => onView("lista")}
          aria-pressed={view === "lista"}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === "lista" ? "bg-[#C8A96B] text-[#0F172A]" : "text-gray-400 hover:text-white"
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => onView("calendario")}
          aria-pressed={view === "calendario"}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === "calendario" ? "bg-[#C8A96B] text-[#0F172A]" : "text-gray-400 hover:text-white"
          }`}
        >
          Calendário
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Filtrar por rede social"
          value={rede}
          onChange={(e) => onRede(e.target.value as RedeSocial | "todas")}
          className={selectCls}
        >
          <option value="todas">Todas as redes</option>
          {REDES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => onStatus(e.target.value as ContentStatus | "todos")}
          className={selectCls}
        >
          <option value="todos">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

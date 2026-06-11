"use client";

import type { ContentItem } from "@/types/content-calendar";
import { redeMeta, statusMeta } from "@/types/content-calendar";

interface Props {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export default function ContentListView({ items, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 py-16 text-center text-sm text-gray-500">
        Nenhum conteúdo encontrado. Crie o seu primeiro item de calendário.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const rede = redeMeta(item.rede_social);
        const st = statusMeta(item.status);
        return (
          <li
            key={item.id}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-sm transition-colors hover:border-[#C8A96B]/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${rede.color}22`, color: rede.color }}
                  >
                    {rede.label}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: `${st.color}22`, color: st.color }}
                  >
                    {st.label}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {formatDate(item.data)}
                    {item.hora ? ` · ${item.hora}` : ""}
                  </span>
                </div>
                <h3 className="truncate text-sm font-semibold text-white">{item.titulo}</h3>
                {item.legenda && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{item.legenda}</p>
                )}
              </div>

              <div className="flex gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => item.id && onDelete(item.id)}
                  className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-950/40"
                >
                  Excluir
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

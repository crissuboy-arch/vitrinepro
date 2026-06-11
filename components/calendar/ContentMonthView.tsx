"use client";

import { useState } from "react";
import type { ContentItem } from "@/types/content-calendar";
import { redeMeta } from "@/types/content-calendar";

interface Props {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function ymd(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function ContentMonthView({ items, onEdit }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<string, ContentItem[]>();
  for (const it of items) {
    const arr = byDay.get(it.data) ?? [];
    arr.push(it);
    byDay.set(it.data, arr);
  }

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Mês anterior"
          className="rounded-lg px-3 py-1.5 text-lg leading-none text-gray-300 hover:bg-white/5"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold text-[#C8A96B]">
          {MONTHS[month]} {year}
        </h3>
        <button
          type="button"
          onClick={goNext}
          aria-label="Próximo mês"
          className="rounded-lg px-3 py-1.5 text-lg leading-none text-gray-300 hover:bg-white/5"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {w}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="min-h-[64px] rounded-lg" />;
          }
          const key = ymd(year, month, day);
          const dayItems = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={`min-h-[64px] rounded-lg border p-1 text-left ${
                isToday ? "border-[#C8A96B]/60 bg-[#C8A96B]/5" : "border-gray-800 bg-[#0F172A]/40"
              }`}
            >
              <div className="mb-1 text-[10px] font-semibold text-gray-400">{day}</div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((it) => {
                  const rede = redeMeta(it.rede_social);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => onEdit(it)}
                      title={it.titulo}
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                      style={{ background: `${rede.color}33` }}
                    >
                      {it.titulo}
                    </button>
                  );
                })}
                {dayItems.length > 3 && (
                  <span className="block text-[9px] text-gray-500">+{dayItems.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

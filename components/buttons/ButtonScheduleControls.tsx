"use client";

import type { ButtonRules, WeekdayKey } from "@/types/buttons";
import { WEEKDAYS } from "@/types/buttons";

interface Props {
  rules: ButtonRules;
  onChange: (patch: Partial<ButtonRules>) => void;
}

const fieldCls =
  "w-full rounded-lg border border-gray-800 bg-[#0a0d14] px-2 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#C8A96B]";
const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500";

export default function ButtonScheduleControls({ rules, onChange }: Props) {
  const days = rules.daysOfWeek ?? [];

  const toggleDay = (day: WeekdayKey) => {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    onChange({ daysOfWeek: next });
  };

  return (
    <div className="space-y-4 text-xs">
      <p className="rounded-lg bg-white/5 p-2.5 text-[11px] leading-relaxed text-gray-400">
        Controla quando o botão aparece na vitrine. Sem regras, o botão está
        sempre visível (enquanto estiver ativo).
      </p>

      <div>
        <span className={labelCls}>Dias da semana</span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  on
                    ? "bg-[#C8A96B] text-[#0F172A]"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        {days.length === 0 && (
          <p className="mt-1 text-[10px] text-gray-600">
            Nenhum selecionado = todos os dias.
          </p>
        )}
      </div>

      <label className="flex items-center justify-between border-t border-gray-800 pt-3 text-[11px] font-semibold text-gray-300">
        Apenas ao fim de semana
        <input
          type="checkbox"
          checked={rules.weekendOnly ?? false}
          onChange={(e) => onChange({ weekendOnly: e.target.checked })}
          className="h-4 w-4 accent-[#C8A96B]"
        />
      </label>

      <label className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
        <span>
          Apenas no horário de funcionamento
          <span className="ml-1 text-[9px] font-normal text-gray-600">
            (aplicado na Fase 6)
          </span>
        </span>
        <input
          type="checkbox"
          checked={rules.businessHoursOnly ?? false}
          onChange={(e) => onChange({ businessHoursOnly: e.target.checked })}
          className="h-4 w-4 accent-[#C8A96B]"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
        <div>
          <span className={labelCls}>Aparece a partir de</span>
          <input
            type="date"
            value={rules.startDate ?? ""}
            onChange={(e) => onChange({ startDate: e.target.value || null })}
            className={fieldCls}
          />
        </div>
        <div>
          <span className={labelCls}>Deixa de aparecer em</span>
          <input
            type="date"
            value={rules.endDate ?? ""}
            onChange={(e) => onChange({ endDate: e.target.value || null })}
            className={fieldCls}
          />
        </div>
      </div>
    </div>
  );
}

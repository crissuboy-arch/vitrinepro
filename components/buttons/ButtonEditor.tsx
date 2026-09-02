"use client";

import { useState } from "react";
import { BarChart3, CalendarClock, ChevronDown, Copy, Palette, Type } from "lucide-react";
import type { ButtonPatch, ButtonRules, ButtonStyle, PageButton } from "@/types/buttons";
import { getButtonIcon } from "./buttonIcons";
import ButtonStyleControls from "./ButtonStyleControls";
import ButtonScheduleControls from "./ButtonScheduleControls";

interface Props {
  button: PageButton;
  onPatch: (patch: ButtonPatch) => void;
  onDuplicate: (button: PageButton) => void;
}

type Section = "basic" | "style" | "schedule" | "stats";

const fieldCls =
  "w-full rounded-lg border border-gray-800 bg-[#0a0d14] px-3 py-2 text-xs text-[#f5f0e8] outline-none focus:border-[#C8A96B]";
const labelCls = "mb-1 block text-[11px] font-semibold text-gray-300";

function Accordion({
  id,
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  id: Section;
  open: boolean;
  onToggle: (id: Section) => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0F172A]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between border-b border-gray-800 bg-white/5 p-3 text-xs font-bold text-[#C8A96B]"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

export default function ButtonEditor({ button, onPatch, onDuplicate }: Props) {
  const [open, setOpen] = useState<Section | "">("basic");
  const toggle = (id: Section) => setOpen((cur) => (cur === id ? "" : id));

  const patchStyle = (p: Partial<ButtonStyle>) =>
    onPatch({ style: { ...button.style, ...p } });
  const patchRules = (p: Partial<ButtonRules>) =>
    onPatch({ rules: { ...button.rules, ...p } });

  const isDivider = button.type === "divider";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-white/5 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10"
            style={{
              backgroundColor: button.style.bgColor || "#0B1B33",
              color: button.style.iconColor || "#FFFFFF",
            }}
          >
            {getButtonIcon(button.icon, button.type, "w-4 h-4")}
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold text-white">
              {button.label || "Sem nome"}
            </div>
            <div className="text-[10px] text-gray-500">Tipo: {button.type}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDuplicate(button)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-700 px-2 py-1 text-[10px] font-bold text-gray-300 hover:border-[#C8A96B]"
        >
          <Copy className="h-3 w-3" /> Duplicar
        </button>
      </div>

      <Accordion
        id="basic"
        open={open === "basic"}
        onToggle={toggle}
        icon={<Type className="h-4 w-4" />}
        title="1. Conteúdo"
      >
        <div className="space-y-3">
          <div>
            <span className={labelCls}>
              {isDivider ? "Texto do separador" : "Título do botão"}
            </span>
            <input
              value={button.label}
              onChange={(e) => onPatch({ label: e.target.value })}
              className={fieldCls}
            />
          </div>
          {!isDivider && (
            <>
              <div>
                <span className={labelCls}>Subtítulo</span>
                <input
                  value={button.sublabel ?? ""}
                  onChange={(e) => onPatch({ sublabel: e.target.value })}
                  placeholder="Ex.: Atendimento rápido 24/7"
                  className={fieldCls}
                />
              </div>
              <div>
                <span className={labelCls}>Link / ação (URL)</span>
                <input
                  value={button.url}
                  onChange={(e) => onPatch({ url: e.target.value })}
                  placeholder="https://…  ·  tel:+351…  ·  mailto:…"
                  className={`${fieldCls} font-mono`}
                />
              </div>
              {button.type === "whatsapp" && (
                <div>
                  <span className={labelCls}>Mensagem predefinida de WhatsApp</span>
                  <textarea
                    rows={2}
                    value={button.whatsappMsg ?? ""}
                    onChange={(e) => onPatch({ whatsappMsg: e.target.value })}
                    placeholder="Olá! Gostava de pedir informações."
                    className={`${fieldCls} resize-none`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Accordion>

      {!isDivider && (
        <Accordion
          id="style"
          open={open === "style"}
          onToggle={toggle}
          icon={<Palette className="h-4 w-4" />}
          title="2. Estilo, cores & animação"
        >
          <ButtonStyleControls style={button.style} onChange={patchStyle} />
        </Accordion>
      )}

      <Accordion
        id="schedule"
        open={open === "schedule"}
        onToggle={toggle}
        icon={<CalendarClock className="h-4 w-4" />}
        title="3. Regras de exibição & agendamento"
      >
        <ButtonScheduleControls rules={button.rules} onChange={patchRules} />
      </Accordion>

      {!isDivider && (
        <Accordion
          id="stats"
          open={open === "stats"}
          onToggle={toggle}
          icon={<BarChart3 className="h-4 w-4" />}
          title="4. Estatísticas"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-800 bg-[#0a0d14] p-3 text-center">
              <div className="text-[10px] font-bold text-gray-500">
                Cliques totais
              </div>
              <div className="mt-0.5 text-lg font-black text-[#C8A96B]">
                {button.clickCount}
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-[#0a0d14] p-3 text-center">
              <div className="text-[10px] font-bold text-gray-500">Estado</div>
              <div className="mt-0.5 text-sm font-bold text-white">
                {button.active ? "Visível" : "Oculto"}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-600">
            Os cliques são contabilizados quando a vitrine pública ligar os
            botões (Fase 6). O registo agregado usa o analytics existente
            (evento <code className="text-gray-400">button_click</code>).
          </p>
        </Accordion>
      )}
    </div>
  );
}

"use client";

import type { ButtonStyle, ButtonShadow } from "@/types/buttons";
import { BUTTON_ANIMATIONS } from "@/types/buttons";

interface Props {
  style: ButtonStyle;
  onChange: (patch: Partial<ButtonStyle>) => void;
}

const fieldCls =
  "w-full rounded-lg border border-gray-800 bg-[#0a0d14] px-2 py-1.5 text-xs text-[#f5f0e8] outline-none focus:border-[#C8A96B]";
const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500";

const RADII = [
  { value: "rounded-full", label: "Pílula (total)" },
  { value: "rounded-3xl", label: "Muito suave" },
  { value: "rounded-2xl", label: "Suave" },
  { value: "rounded-xl", label: "Médio" },
  { value: "rounded-md", label: "Ligeiro" },
  { value: "rounded-none", label: "Reto" },
];
const WIDTHS = ["0px", "1px", "2px", "3px", "4px"];
const SHADOWS: { value: ButtonShadow; label: string }[] = [
  { value: "none", label: "Nenhuma" },
  { value: "sm", label: "Suave" },
  { value: "md", label: "Média" },
  { value: "lg", label: "Elevada" },
  { value: "xl", label: "Extra elevada" },
  { value: "2xl", label: "Máxima" },
  { value: "glow", label: "Brilho (glow)" },
];
const FONT_WEIGHTS = [
  { value: "font-normal", label: "Normal" },
  { value: "font-medium", label: "Médio" },
  { value: "font-semibold", label: "Semi-negrito" },
  { value: "font-bold", label: "Negrito" },
  { value: "font-extrabold", label: "Extra negrito" },
  { value: "font-black", label: "Preto" },
];
const FONT_SIZES = [
  { value: "text-xs", label: "XS" },
  { value: "text-sm", label: "S" },
  { value: "text-base", label: "M" },
  { value: "text-lg", label: "L" },
];

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const current = value || fallback;
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(current) ? current : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border border-gray-800 bg-transparent"
          aria-label={label}
        />
        <input
          type="text"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldCls} font-mono text-[10px]`}
        />
      </div>
    </div>
  );
}

export default function ButtonStyleControls({ style, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <ColorField
          label="Fundo"
          value={style.bgColor}
          fallback="#0B1B33"
          onChange={(v) => onChange({ bgColor: v })}
        />
        <ColorField
          label="Texto"
          value={style.textColor}
          fallback="#FFFFFF"
          onChange={(v) => onChange({ textColor: v })}
        />
        <ColorField
          label="Ícone"
          value={style.iconColor}
          fallback="#FFFFFF"
          onChange={(v) => onChange({ iconColor: v })}
        />
      </div>

      <div className="space-y-2 border-t border-gray-800 pt-3">
        <label className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
          Ativar gradiente
          <input
            type="checkbox"
            checked={style.useGradient ?? false}
            onChange={(e) => onChange({ useGradient: e.target.checked })}
            className="h-4 w-4 accent-[#C8A96B]"
          />
        </label>
        {style.useGradient && (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/5 p-2">
            <ColorField
              label="Início"
              value={style.gradientStart}
              fallback={style.bgColor || "#0B1B33"}
              onChange={(v) => onChange({ gradientStart: v })}
            />
            <ColorField
              label="Fim"
              value={style.gradientEnd}
              fallback="#1E293B"
              onChange={(v) => onChange({ gradientEnd: v })}
            />
            <div>
              <span className={labelCls}>Direção</span>
              <select
                value={style.gradientDir || "to-r"}
                onChange={(e) =>
                  onChange({ gradientDir: e.target.value as ButtonStyle["gradientDir"] })
                }
                className={fieldCls}
              >
                <option value="to-r">→ Direita</option>
                <option value="to-l">← Esquerda</option>
                <option value="to-b">↓ Baixo</option>
                <option value="to-t">↑ Cima</option>
                <option value="to-br">↘ Diagonal</option>
                <option value="to-tr">↗ Diagonal</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
        <div>
          <span className={labelCls}>Raio da borda</span>
          <select
            value={style.borderRadius || "rounded-2xl"}
            onChange={(e) => onChange({ borderRadius: e.target.value })}
            className={fieldCls}
          >
            {RADII.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelCls}>Espessura da borda</span>
          <select
            value={style.borderWidth || "0px"}
            onChange={(e) => onChange({ borderWidth: e.target.value })}
            className={fieldCls}
          >
            {WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w === "0px" ? "Sem borda" : w}
              </option>
            ))}
          </select>
        </div>
        {style.borderWidth && style.borderWidth !== "0px" && (
          <ColorField
            label="Cor da borda"
            value={style.borderColor}
            fallback="#C8A96B"
            onChange={(v) => onChange({ borderColor: v })}
          />
        )}
        <div>
          <span className={labelCls}>Sombra</span>
          <select
            value={style.shadow || "md"}
            onChange={(e) => onChange({ shadow: e.target.value as ButtonShadow })}
            className={fieldCls}
          >
            {SHADOWS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {style.shadow === "glow" && (
          <>
            <ColorField
              label="Cor do brilho"
              value={style.glowColor}
              fallback="#C8A96B"
              onChange={(v) => onChange({ glowColor: v })}
            />
            <div>
              <span className={labelCls}>Intensidade</span>
              <select
                value={style.glowIntensity || "medium"}
                onChange={(e) =>
                  onChange({
                    glowIntensity: e.target.value as ButtonStyle["glowIntensity"],
                  })
                }
                className={fieldCls}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-gray-800 pt-3">
        <span className={labelCls}>Opacidade — {(style.opacity ?? 1).toFixed(2)}</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={style.opacity ?? 1}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-[#C8A96B]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-gray-800 pt-3">
        <div>
          <span className={labelCls}>Peso da fonte</span>
          <select
            value={style.fontWeight || "font-bold"}
            onChange={(e) => onChange({ fontWeight: e.target.value })}
            className={fieldCls}
          >
            {FONT_WEIGHTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelCls}>Tamanho da fonte</span>
          <select
            value={style.fontSize || "text-sm"}
            onChange={(e) => onChange({ fontSize: e.target.value })}
            className={fieldCls}
          >
            {FONT_SIZES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3">
        <span className={labelCls}>Animação</span>
        <div className="grid grid-cols-2 gap-2">
          {BUTTON_ANIMATIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange({ animation: a.id })}
              className={`rounded-lg border p-2 text-left transition-colors ${
                (style.animation || "none") === a.id
                  ? "border-[#C8A96B] bg-[#C8A96B]/10"
                  : "border-gray-800 bg-[#0a0d14] hover:border-gray-700"
              }`}
            >
              <div className="text-[11px] font-bold text-white">{a.label}</div>
              <div className="text-[9px] text-gray-500">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

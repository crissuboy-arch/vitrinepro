"use client";

import { useState } from "react";
import { Monitor, MousePointerClick, Smartphone, Tablet } from "lucide-react";
import type { PageButton } from "@/types/buttons";
import { isButtonScheduledNow } from "@/types/buttons";
import { CustomButtonRenderer } from "./CustomButtonRenderer";

export type DeviceMode = "mobile" | "tablet" | "desktop";

interface Props {
  businessName: string;
  businessDescription?: string | null;
  logoUrl?: string | null;
  buttons: PageButton[];
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  selectedId?: string | null;
}

type CanvasBg = "light" | "dark" | "cream";

const CANVAS: Record<CanvasBg, { bg: string; text: string; swatch: string }> = {
  light: { bg: "#F8FAFC", text: "#14181F", swatch: "#F8FAFC" },
  dark: { bg: "#0A0D14", text: "#F5F0E8", swatch: "#0A0D14" },
  cream: { bg: "#FAF4EA", text: "#2D2421", swatch: "#FAF4EA" },
};

const FRAME: Record<DeviceMode, string> = {
  mobile: "w-[340px]",
  tablet: "w-[520px]",
  desktop: "w-[760px]",
};

export default function ButtonPreview({
  businessName,
  businessDescription,
  logoUrl,
  buttons,
  deviceMode,
  onDeviceModeChange,
  selectedId,
}: Props) {
  const [canvasBg, setCanvasBg] = useState<CanvasBg>("light");
  const c = CANVAS[canvasBg];

  const visible = buttons.filter(
    (b) => b.active && isButtonScheduledNow(b),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-gray-800 bg-[#0F172A] p-1">
          {(
            [
              ["mobile", Smartphone, "Telemóvel"],
              ["tablet", Tablet, "Tablet"],
              ["desktop", Monitor, "Desktop"],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onDeviceModeChange(mode)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                deviceMode === mode
                  ? "bg-[#C8A96B] text-[#0F172A]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Fundo
          </span>
          {(Object.keys(CANVAS) as CanvasBg[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCanvasBg(key)}
              aria-label={`Fundo ${key}`}
              className={`h-6 w-6 rounded-full border border-gray-700 transition-transform ${
                canvasBg === key ? "scale-110 ring-2 ring-[#C8A96B]" : ""
              }`}
              style={{ backgroundColor: CANVAS[key].swatch }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto rounded-2xl bg-[#0a0d14] p-6">
        <div
          className={`${FRAME[deviceMode]} h-fit max-w-full overflow-hidden rounded-[32px] border-4 border-[#0F172A] shadow-2xl`}
          style={{ backgroundColor: c.bg, color: c.text }}
        >
          <div className="flex h-6 items-center justify-center bg-[#0F172A]">
            <div className="h-1.5 w-14 rounded-full bg-white/20" />
          </div>

          <div className="border-b border-black/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#0F172A] text-lg font-black text-white shadow">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                businessName.slice(0, 2).toUpperCase()
              )}
            </div>
            <h3 className="text-base font-black tracking-tight">{businessName}</h3>
            {businessDescription && (
              <p className="mx-auto mt-1 max-w-xs text-xs opacity-70">
                {businessDescription}
              </p>
            )}
          </div>

          <div className="space-y-3 p-6">
            {visible.length === 0 ? (
              <div className="py-12 text-center opacity-50">
                <MousePointerClick className="mx-auto mb-2 h-9 w-9" />
                <p className="text-xs font-bold">Nenhum botão visível</p>
                <p className="text-[11px]">
                  Ative um botão ou ajuste as regras de exibição.
                </p>
              </div>
            ) : (
              visible.map((btn) => (
                <div
                  key={btn.id}
                  className={
                    btn.id === selectedId
                      ? "rounded-2xl ring-2 ring-[#C8A96B] ring-offset-2 ring-offset-transparent"
                      : ""
                  }
                >
                  <CustomButtonRenderer button={btn} isInteractive={false} />
                </div>
              ))
            )}
          </div>

          <div className="border-t border-black/5 p-3 text-center text-[10px] font-semibold opacity-50">
            {businessName} · VitrinePro
          </div>
        </div>
      </div>
    </div>
  );
}

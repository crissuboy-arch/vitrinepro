"use client";

// Renderiza um botão da página pública a partir da sua configuração.
// Adaptado de Montra (CustomButtonRenderer.tsx) para o modelo aninhado
// PageButton.style / PageButton.rules da VitrinePro.
// Usado pelo preview do dashboard e, na Fase 6, pela vitrine pública.

import { useState, type CSSProperties, type MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import type { PageButton, ButtonStyle } from "@/types/buttons";
import { getButtonIcon } from "./buttonIcons";

interface Props {
  button: PageButton;
  isInteractive?: boolean;
  onActivate?: (button: PageButton) => void;
  className?: string;
}

const GRADIENT_ANGLE: Record<string, string> = {
  "to-r": "90deg",
  "to-l": "270deg",
  "to-t": "0deg",
  "to-b": "180deg",
  "to-tr": "45deg",
  "to-br": "135deg",
};

function shadowValue(style: ButtonStyle): string {
  switch (style.shadow) {
    case "sm":
      return "0 1px 2px 0 rgba(0,0,0,0.05)";
    case "md":
      return "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
    case "lg":
      return "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
    case "xl":
      return "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)";
    case "2xl":
      return "0 25px 50px -12px rgba(0,0,0,0.25)";
    case "inner":
      return "inset 0 2px 4px 0 rgba(0,0,0,0.06)";
    case "glow": {
      const color = style.glowColor || "rgba(200,161,91,0.5)";
      const spread =
        style.glowIntensity === "high"
          ? "20px"
          : style.glowIntensity === "medium"
            ? "12px"
            : "6px";
      return `0 0 ${spread} ${color}`;
    }
    default:
      return style.glowColor ? `0 0 10px ${style.glowColor}` : "none";
  }
}

function animationClass(anim?: string): string {
  switch (anim) {
    case "pulse":
      return "animate-pulse";
    case "bounce":
      return "animate-bounce";
    case "float":
      return "vp-anim-float";
    case "shake":
      return "vp-anim-wiggle";
    case "ripple":
      return "transition-all duration-300 hover:scale-[1.02] active:scale-95";
    case "zoom":
      return "transition-transform duration-300 hover:scale-105";
    case "hover-scale":
      return "transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5";
    case "hover-glow":
      return "transition-all duration-300 hover:shadow-lg hover:brightness-110";
    case "hover-shadow":
      return "transition-all duration-300 hover:shadow-2xl";
    case "glow":
      return "vp-anim-glow";
    case "neon":
      return "animate-pulse";
    default:
      return "transition-all duration-200 hover:opacity-95 active:scale-[0.98]";
  }
}

export function CustomButtonRenderer({
  button,
  isInteractive = true,
  onActivate,
  className = "",
}: Props) {
  const [pressed, setPressed] = useState(false);
  const style = button.style ?? {};

  // Separador / divisor
  if (button.type === "divider") {
    const color = style.textColor || "#64748B";
    return (
      <div
        className={`flex w-full items-center justify-center gap-3 py-3 ${className}`}
      >
        <div className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.25 }} />
        {button.label ? (
          <span
            className="px-2 text-[11px] font-extrabold uppercase tracking-widest"
            style={{ color }}
          >
            {button.label}
          </span>
        ) : null}
        <div className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.25 }} />
      </div>
    );
  }

  const bgColor = style.bgColor || "#0B1B33";
  const textColor = style.textColor || "#FFFFFF";
  const iconColor = style.iconColor || textColor;
  const borderWidth = style.borderWidth || "0px";
  const borderRadius = style.borderRadius || "rounded-2xl";

  let background = bgColor;
  if (style.useGradient) {
    const angle = GRADIENT_ANGLE[style.gradientDir || "to-r"] || "90deg";
    background = `linear-gradient(${angle}, ${style.gradientStart || bgColor}, ${style.gradientEnd || "#1E293B"})`;
  }

  const paddingX = style.paddingX || "px-5";
  const paddingY = style.paddingY || "py-3.5";
  const fontWeight = style.fontWeight || "font-bold";
  const fontSize = style.fontSize || "text-sm";
  const alignment = style.alignment || "center";
  const justify =
    alignment === "start"
      ? "justify-start"
      : alignment === "end"
        ? "justify-end"
        : "justify-center";

  let widthClass = "w-full";
  if (style.widthMode === "auto") widthClass = "w-auto max-w-full";
  if (style.widthMode === "custom") widthClass = "";

  const containerStyle: CSSProperties = {
    background,
    borderWidth,
    borderStyle: borderWidth !== "0px" ? "solid" : "none",
    borderColor: style.borderColor || "transparent",
    boxShadow: shadowValue(style),
    opacity: style.opacity ?? 1,
    height: style.heightPx ? `${style.heightPx}px` : undefined,
    width:
      style.widthMode === "custom" && style.customWidthPx
        ? `${style.customWidthPx}px`
        : undefined,
    minHeight: "48px",
    fontFamily: style.fontFamily || undefined,
  };

  const classes = [
    "group relative flex items-center gap-3.5",
    paddingX,
    paddingY,
    borderRadius,
    widthClass,
    justify,
    animationClass(style.animation),
    pressed ? "scale-95" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleActivate = (e: MouseEvent) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    setPressed(true);
    window.setTimeout(() => setPressed(false), 300);
    onActivate?.(button);
  };

  const inner = (
    <>
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ color: iconColor }}
      >
        {getButtonIcon(button.icon, button.type)}
      </span>
      <span
        className={`flex min-w-0 flex-col overflow-hidden ${alignment === "center" ? "items-center text-center" : "text-left"}`}
      >
        <span
          className={`${fontWeight} ${fontSize} truncate leading-snug`}
          style={{ color: textColor }}
        >
          {button.label || "Botão sem nome"}
        </span>
        {button.sublabel ? (
          <span
            className="truncate text-[11px] font-normal opacity-85"
            style={{ color: textColor }}
          >
            {button.sublabel}
          </span>
        ) : null}
      </span>
      <span className="ml-auto shrink-0 pl-1 opacity-70">
        <ChevronRight className="h-4 w-4" style={{ color: iconColor }} />
      </span>
    </>
  );

  const isExternal =
    isInteractive && button.url.startsWith("http") && button.url !== "#";

  if (isExternal) {
    return (
      <a
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleActivate}
        className={classes}
        style={containerStyle}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      className={`${classes} ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
      style={containerStyle}
    >
      {inner}
    </button>
  );
}

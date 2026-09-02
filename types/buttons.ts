// Tipos do módulo "Botões & Links" (/dashboard/botoes).
// Adaptado do Montra (src/types/index.ts) para a arquitetura da VitrinePro:
// - modelo aninhado (style / rules) alinhado com a tabela page_buttons (migração 008);
// - mapeamento explícito entre o objeto da app (camelCase) e a linha do Postgres (snake_case).

export type ButtonType =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "telegram"
  | "twitter"
  | "threads"
  | "pinterest"
  | "discord"
  | "twitch"
  | "spotify"
  | "snapchat"
  | "google_business"
  | "google_maps"
  | "google_reviews"
  | "website"
  | "online_store"
  | "mbway"
  | "pix"
  | "stripe"
  | "paypal"
  | "email"
  | "call"
  | "manychat"
  | "calendly"
  | "google_calendar"
  | "form"
  | "book"
  | "catalog"
  | "divider"
  | "custom";

export type ButtonAnimation =
  | "none"
  | "pulse"
  | "glow"
  | "bounce"
  | "float"
  | "shake"
  | "ripple"
  | "zoom"
  | "hover-scale"
  | "hover-glow"
  | "hover-shadow"
  | "neon";

export type ButtonShadow =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "inner"
  | "glow";

export type GradientDir = "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-br";
export type WidthMode = "full" | "auto" | "custom";
export type Alignment = "start" | "center" | "end";
export type GlowIntensity = "low" | "medium" | "high";
export type WeekdayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

/** Configuração visual do botão — persistida em page_buttons.style (jsonb). */
export interface ButtonStyle {
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  borderColor?: string;
  borderWidth?: string; // '0px'..'4px'
  borderRadius?: string; // 'rounded-none'..'rounded-full'
  useGradient?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDir?: GradientDir;
  shadow?: ButtonShadow;
  glowColor?: string;
  glowIntensity?: GlowIntensity;
  animation?: ButtonAnimation;
  opacity?: number; // 0.2..1
  paddingX?: string; // 'px-4'..'px-6'
  paddingY?: string; // 'py-3'..'py-4'
  widthMode?: WidthMode;
  customWidthPx?: number;
  heightPx?: number;
  alignment?: Alignment;
  fontFamily?: string;
  fontWeight?: string; // 'font-normal'..'font-black'
  fontSize?: string; // 'text-xs'..'text-lg'
}

/** Regras de exibição e agendamento — persistidas em page_buttons.rules (jsonb). */
export interface ButtonRules {
  daysOfWeek?: WeekdayKey[]; // vazio/ausente = todos os dias
  businessHoursOnly?: boolean;
  weekendOnly?: boolean;
  startDate?: string | null; // 'YYYY-MM-DD' — aparece a partir de
  endDate?: string | null; // 'YYYY-MM-DD' — desaparece depois de
}

/** Botão tal como usado na aplicação. */
export interface PageButton {
  id: string;
  businessId: string;
  type: ButtonType;
  label: string;
  sublabel?: string;
  url: string;
  icon?: string;
  whatsappMsg?: string;
  presetId?: string;
  style: ButtonStyle;
  rules: ButtonRules;
  order: number;
  active: boolean;
  clickCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Dados para criar um botão novo (id/businessId/clickCount vêm da BD). */
export type NewPageButton = Omit<
  PageButton,
  "id" | "businessId" | "clickCount" | "createdAt" | "updatedAt"
>;

export type ButtonPatch = Partial<
  Pick<
    PageButton,
    | "type"
    | "label"
    | "sublabel"
    | "url"
    | "icon"
    | "whatsappMsg"
    | "presetId"
    | "style"
    | "rules"
    | "order"
    | "active"
  >
>;

/** Linha crua da tabela public.page_buttons. */
export interface PageButtonRow {
  id: string;
  business_id: string;
  type: string;
  label: string;
  sublabel: string | null;
  url: string;
  icon: string | null;
  whatsapp_msg: string | null;
  preset_id: string | null;
  style: ButtonStyle | null;
  rules: ButtonRules | null;
  display_order: number;
  active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

// ── Mapeamento BD ⇆ App ─────────────────────────────────────

export function rowToButton(row: PageButtonRow): PageButton {
  return {
    id: row.id,
    businessId: row.business_id,
    type: (row.type as ButtonType) ?? "custom",
    label: row.label ?? "",
    sublabel: row.sublabel ?? undefined,
    url: row.url ?? "",
    icon: row.icon ?? undefined,
    whatsappMsg: row.whatsapp_msg ?? undefined,
    presetId: row.preset_id ?? undefined,
    style: row.style ?? {},
    rules: row.rules ?? {},
    order: row.display_order ?? 0,
    active: row.active ?? true,
    clickCount: row.click_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type InsertRow = Omit<
  PageButtonRow,
  "id" | "click_count" | "created_at" | "updated_at"
>;

export function buttonToInsertRow(
  businessId: string,
  b: NewPageButton,
): InsertRow {
  return {
    business_id: businessId,
    type: b.type,
    label: b.label ?? "",
    sublabel: b.sublabel ?? null,
    url: b.url ?? "",
    icon: b.icon ?? null,
    whatsapp_msg: b.whatsappMsg ?? null,
    preset_id: b.presetId ?? null,
    style: b.style ?? {},
    rules: b.rules ?? {},
    display_order: b.order ?? 0,
    active: b.active ?? true,
  };
}

export function patchToUpdateRow(patch: ButtonPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.type !== undefined) out.type = patch.type;
  if (patch.label !== undefined) out.label = patch.label;
  if (patch.sublabel !== undefined) out.sublabel = patch.sublabel || null;
  if (patch.url !== undefined) out.url = patch.url;
  if (patch.icon !== undefined) out.icon = patch.icon || null;
  if (patch.whatsappMsg !== undefined) out.whatsapp_msg = patch.whatsappMsg || null;
  if (patch.presetId !== undefined) out.preset_id = patch.presetId || null;
  if (patch.style !== undefined) out.style = patch.style;
  if (patch.rules !== undefined) out.rules = patch.rules;
  if (patch.order !== undefined) out.display_order = patch.order;
  if (patch.active !== undefined) out.active = patch.active;
  return out;
}

// ── Catálogo de animações (para os controlos do editor) ─────

export const BUTTON_ANIMATIONS: {
  id: ButtonAnimation;
  label: string;
  desc: string;
}[] = [
  { id: "none", label: "Sem animação", desc: "Estático" },
  { id: "hover-scale", label: "Hover Scale", desc: "Aumenta ao passar o rato" },
  { id: "pulse", label: "Pulse", desc: "Pulsar suave" },
  { id: "bounce", label: "Bounce", desc: "Saltar contínuo" },
  { id: "float", label: "Float", desc: "Flutuar no ar" },
  { id: "ripple", label: "Ripple", desc: "Toque elástico" },
  { id: "hover-glow", label: "Hover Glow", desc: "Brilho ao passar" },
  { id: "hover-shadow", label: "Hover Shadow", desc: "Sombra ao passar" },
  { id: "glow", label: "Glow", desc: "Brilho permanente" },
  { id: "zoom", label: "Zoom", desc: "Aproxima no hover" },
  { id: "shake", label: "Shake", desc: "Vibração de atenção" },
  { id: "neon", label: "Neon", desc: "Néon futurista" },
];

export const WEEKDAYS: { id: WeekdayKey; label: string }[] = [
  { id: "seg", label: "Seg" },
  { id: "ter", label: "Ter" },
  { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" },
  { id: "sex", label: "Sex" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

// ── Avaliação das regras (usado no preview e, na Fase 6, na vitrine) ──

const WEEKDAY_INDEX: Record<number, WeekdayKey> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sab",
};

/**
 * Indica se um botão deve aparecer numa determinada data segundo as suas regras.
 * `businessHoursOnly` não é avaliado aqui (depende do opening_hours do negócio);
 * fica para quem consumir esta função com esse contexto.
 */
export function isButtonScheduledNow(
  button: Pick<PageButton, "rules">,
  now: Date = new Date(),
): boolean {
  const r = button.rules ?? {};

  if (r.startDate) {
    const start = new Date(`${r.startDate}T00:00:00`);
    if (now < start) return false;
  }
  if (r.endDate) {
    const end = new Date(`${r.endDate}T23:59:59`);
    if (now > end) return false;
  }

  const today = WEEKDAY_INDEX[now.getDay()];
  if (r.weekendOnly && today !== "sab" && today !== "dom") return false;
  if (r.daysOfWeek && r.daysOfWeek.length > 0 && !r.daysOfWeek.includes(today)) {
    return false;
  }

  return true;
}

export type RedeSocial =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "pinterest"
  | "linkedin";

export type ContentStatus =
  | "ideia"
  | "planejado"
  | "produzido"
  | "agendado"
  | "publicado";

export type ViewMode = "lista" | "calendario";

export interface ContentItem {
  id?: string;
  user_id?: string;
  business_id?: string | null;
  titulo: string;
  rede_social: RedeSocial;
  data: string; // YYYY-MM-DD
  hora?: string | null; // HH:MM
  status: ContentStatus;
  legenda?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const REDES: { id: RedeSocial; label: string; color: string }[] = [
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", color: "#22D3EE" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "pinterest", label: "Pinterest", color: "#E60023" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
];

export const STATUS_OPTIONS: { id: ContentStatus; label: string; color: string }[] = [
  { id: "ideia", label: "Ideia", color: "#94A3B8" },
  { id: "planejado", label: "Planejado", color: "#C8A96B" },
  { id: "produzido", label: "Produzido", color: "#3B82F6" },
  { id: "agendado", label: "Agendado", color: "#A855F7" },
  { id: "publicado", label: "Publicado", color: "#22C55E" },
];

export const emptyContent = (): ContentItem => ({
  titulo: "",
  rede_social: "instagram",
  data: new Date().toISOString().slice(0, 10),
  hora: "",
  status: "ideia",
  legenda: "",
  observacoes: "",
});

export const redeMeta = (id: RedeSocial) =>
  REDES.find((r) => r.id === id) ?? REDES[0];

export const statusMeta = (id: ContentStatus) =>
  STATUS_OPTIONS.find((s) => s.id === id) ?? STATUS_OPTIONS[0];

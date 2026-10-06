/**
 * lib/montra-tabs.ts — A3
 *
 * Single registry of the "Gerenciar Montra" tabs (A3.3 / A3.17).
 * The dashboard renders these; tests assert the 10 areas exist.
 */
export interface MontraTab {
  id: string;
  label: string;
}

export const MONTRA_TABS: MontraTab[] = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "informacoes", label: "Informações" },
  { id: "produtos", label: "Produtos/Menu" },
  { id: "galeria", label: "Galeria" },
  // A6.5 — "Novidades na Vitrine": publicar/editar/desativar/excluir novidades.
  { id: "novidades", label: "Novidades" },
  { id: "horarios", label: "Horários" },
  { id: "localizacao", label: "Localização" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "catalogo", label: "Catálogo" },
  { id: "analytics", label: "Analytics" },
  { id: "plano", label: "Plano" },
];

export const DEFAULT_MONTRA_TAB = "visao-geral";

export function isValidMontraTab(t: string | null | undefined): t is string {
  return !!t && MONTRA_TABS.some((x) => x.id === t);
}

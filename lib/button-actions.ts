// Camada de dados do módulo "Botões & Links".
// Persiste em public.page_buttons (migração 008) via o cliente browser do Supabase.
// A RLS "Owner manage buttons" garante que só o dono do negócio lê/escreve.

import { supabase } from "@/app/lib/supabase";
import {
  buttonToInsertRow,
  patchToUpdateRow,
  rowToButton,
  type ButtonPatch,
  type NewPageButton,
  type PageButton,
  type PageButtonRow,
} from "@/types/buttons";

const TABLE = "page_buttons";

export async function listButtons(businessId: string): Promise<PageButton[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("business_id", businessId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data as PageButtonRow[] | null) ?? []).map(rowToButton);
}

export async function createButton(
  businessId: string,
  button: NewPageButton,
): Promise<PageButton> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(buttonToInsertRow(businessId, button))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToButton(data as PageButtonRow);
}

export async function updateButton(
  id: string,
  patch: ButtonPatch,
): Promise<PageButton> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patchToUpdateRow(patch))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToButton(data as PageButtonRow);
}

export async function deleteButton(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Grava a nova ordem. Recebe os ids já na ordem pretendida e escreve
 * display_order = índice. Updates individuais (o Supabase JS não faz upsert
 * parcial em lote de forma fiável sob RLS).
 */
export async function reorderButtons(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from(TABLE).update({ display_order: index }).eq("id", id),
    ),
  );
}

/** Cria uma cópia de um botão existente, logo a seguir na ordem. */
export async function duplicateButton(
  businessId: string,
  source: PageButton,
): Promise<PageButton> {
  const copy: NewPageButton = {
    type: source.type,
    label: source.label ? `${source.label} (cópia)` : "",
    sublabel: source.sublabel,
    url: source.url,
    icon: source.icon,
    whatsappMsg: source.whatsappMsg,
    presetId: source.presetId,
    style: { ...source.style },
    rules: { ...source.rules },
    order: source.order + 1,
    active: source.active,
  };
  return createButton(businessId, copy);
}

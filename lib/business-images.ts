/**
 * lib/business-images.ts — BUGFIX imagem da Montra (Turma da Mônica)
 *
 * Causa raiz provada: o painel fazia upload para o Storage e depois
 * `supabase.from("businesses").update(...)` SEM verificar `error`.
 * Se o UPDATE falhasse, a UI mostrava a imagem localmente (setBusiness)
 * mas o banco ficava vazio → /explorar e /vitrine mostravam fallback.
 *
 * Esta camada centraliza a persistência:
 *  - verifica o erro do UPDATE e falha de forma audível;
 *  - valida a URL antes de gravar;
 *  - galeria grava em `gallery_images` (tabela que o app lê),
 *    não em `business_images` (legado — o trigger de sync é
 *    gallery_images → business_images, nunca o inverso).
 *
 * Pura quanto a React; recebe um client mínimo injetável (testável).
 */

export type BusinessImageField = "logo_url" | "cover_url";

export interface DbError {
  message: string;
}

/** Client mínimo necessário (Supabase JS é compatível). */
export interface ImageDbClient {
  from(table: string): {
    update(
      values: Record<string, string>
    ): {
      // PromiseLike: o PostgrestFilterBuilder é "thenable", não Promise.
      eq(col: string, val: string): PromiseLike<{ error: DbError | null }>;
    };
    insert(
      rows: Array<Record<string, unknown>>
    ): PromiseLike<{ error: DbError | null }>;
  };
}

export class BusinessImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessImageError";
  }
}

function assertHttpUrl(url: string, what: string): void {
  if (!url || !url.startsWith("http")) {
    throw new BusinessImageError(
      `URL de imagem inválida para ${what}. O upload pode não ter concluído.`
    );
  }
}

/**
 * Grava logo_url ou cover_url na business. Falha de forma audível
 * se o UPDATE for rejeitado (ex.: RLS, constraint) — nunca silenciosa.
 */
export async function persistBusinessImageField(
  db: ImageDbClient,
  businessId: string,
  field: BusinessImageField,
  url: string
): Promise<void> {
  assertHttpUrl(url, field);
  const { error } = await db
    .from("businesses")
    .update({ [field]: url })
    .eq("id", businessId);
  if (error) {
    throw new BusinessImageError(
      `A imagem foi enviada, mas não ficou guardada (${field}): ${error.message}`
    );
  }
}

/**
 * Grava imagens da galeria na tabela que o app lê (`gallery_images`).
 * O onboarding gravava em `business_images` (tabela legada de
 * compatibilidade) — essas imagens nunca apareciam em lado nenhum.
 */
export async function persistGalleryImages(
  db: ImageDbClient,
  businessId: string,
  urls: string[]
): Promise<void> {
  const valid = urls.filter((u) => u && u.startsWith("http"));
  if (valid.length === 0) return;
  const { error } = await db.from("gallery_images").insert(
    valid.map((image_url, order_index) => ({
      business_id: businessId,
      image_url,
      order_index,
    }))
  );
  if (error) {
    throw new BusinessImageError(
      `As fotos foram enviadas, mas não ficaram guardadas na galeria: ${error.message}`
    );
  }
}

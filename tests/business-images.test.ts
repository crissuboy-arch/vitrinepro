/**
 * tests/business-images.test.ts — regressão do bug da imagem (Turma da Mônica)
 *
 * CAUSA RAIZ PROVADA: o painel fazia UPDATE de logo_url/cover_url no banco
 * sem verificar `error` → a UI mostrava a imagem localmente sem ela estar
 * persistida. Prova: DOM ao vivo — cartão e /vitrine sem nenhum <img>,
 * só fallbacks (gradiente + emojis), enquanto logo_url/cover_url vazios.
 *
 * A correção centraliza a persistência em lib/business-images.ts, que
 * falha de forma AUDÍVEL (nunca silenciosa).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  persistBusinessImageField,
  persistGalleryImages,
  BusinessImageError,
  type ImageDbClient,
} from "../lib/business-images.ts";

function makeDb(error: { message: string } | null = null) {
  const calls: Array<{ table: string; op: string; payload: unknown }> = [];
  const db: ImageDbClient = {
    from(table: string) {
      return {
        update(values: Record<string, string>) {
          calls.push({ table, op: "update", payload: values });
          return { eq: () => Promise.resolve({ error }) };
        },
        insert(rows: Array<Record<string, unknown>>) {
          calls.push({ table, op: "insert", payload: rows });
          return Promise.resolve({ error });
        },
      };
    },
  };
  return { db, calls };
}

async function rejectsWithBusinessImageError(p: Promise<unknown>, fieldRe?: RegExp) {
  let err: unknown = null;
  try {
    await p;
  } catch (e) {
    err = e;
  }
  assert.ok(err instanceof BusinessImageError, "devia lançar BusinessImageError");
  if (fieldRe) assert.match((err as Error).message, fieldRe);
}

describe("persistBusinessImageField (regressão Turma da Mônica)", () => {
  it("grava logo_url/cover_url na tabela businesses", async () => {
    const { db, calls } = makeDb();
    await persistBusinessImageField(db, "biz-1", "logo_url", "https://x.supabase.co/a.png");
    await persistBusinessImageField(db, "biz-1", "cover_url", "https://x.supabase.co/b.png");
    assert.equal(calls.length, 2);
    assert.equal(calls[0].table, "businesses");
    assert.equal(calls[0].op, "update");
    assert.deepEqual(calls[0].payload, { logo_url: "https://x.supabase.co/a.png" });
    assert.deepEqual(calls[1].payload, { cover_url: "https://x.supabase.co/b.png" });
  });

  it("FALHA DE FORMA AUDÍVEL quando o UPDATE é rejeitado (nunca silencioso)", async () => {
    // Antes da correção, este erro era ignorado e a UI mostrava a imagem
    // localmente sem persistir — o card ficava com fallback genérico.
    const { db } = makeDb({ message: "RLS violation" });
    await rejectsWithBusinessImageError(
      persistBusinessImageField(db, "biz-1", "logo_url", "https://x.supabase.co/a.png"),
      /logo_url/
    );
  });

  it("rejeita URL inválida antes de tocar no banco", async () => {
    const { db, calls } = makeDb();
    await rejectsWithBusinessImageError(persistBusinessImageField(db, "biz-1", "logo_url", ""));
    assert.equal(calls.length, 0);
  });
});

describe("persistGalleryImages (tabela correta)", () => {
  it("grava em gallery_images com coluna image_url (não business_images/url)", async () => {
    // O onboarding gravava em business_images (tabela legada) — o trigger
    // de sync é gallery_images → business_images, nunca o inverso.
    const { db, calls } = makeDb();
    await persistGalleryImages(db, "biz-1", ["https://x.supabase.co/g1.png"]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].table, "gallery_images");
    assert.equal(calls[0].op, "insert");
    assert.deepEqual(calls[0].payload, [
      { business_id: "biz-1", image_url: "https://x.supabase.co/g1.png", order_index: 0 },
    ]);
  });

  it("falha de forma audível quando o INSERT é rejeitado", async () => {
    const { db } = makeDb({ message: "boom" });
    await rejectsWithBusinessImageError(persistGalleryImages(db, "biz-1", ["https://x/a.png"]));
  });

  it("não chama o banco quando não há URLs válidas", async () => {
    const { db, calls } = makeDb();
    await persistGalleryImages(db, "biz-1", []);
    await persistGalleryImages(db, "biz-1", [""]);
    assert.equal(calls.length, 0);
  });
});

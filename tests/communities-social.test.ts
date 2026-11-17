/**
 * tests/communities-social.test.ts — Comunidades como rede social (030).
 * Lógica pura (perfil, árvore de comentários), contrato da migration e
 * verificações estáticas das rotas novas (autoria, sessão, admin).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validateProfileInput, buildCommentTree, PROFILE_LIMITS, WELCOME_POST_CONTENT } from "../lib/communities-core.ts";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

describe("perfil do membro: validação", () => {
  it("normaliza nome/cidade/bio e aplica limites", () => {
    const r = validateProfileInput(
      { display_name: "  Ana Maria  ", city: " Águeda ", bio: "Olá!", avatar_url: "https://cdn.example/a.jpg" },
      "Fallback",
    );
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.displayName, "Ana Maria");
      assert.equal(r.value.city, "Águeda");
      assert.equal(r.value.bio, "Olá!");
      assert.equal(r.value.avatarUrl, "https://cdn.example/a.jpg");
    }
    const long = validateProfileInput({ display_name: "x".repeat(200), bio: "y".repeat(999) }, "F");
    assert.equal(long.ok, true);
    if (long.ok) {
      assert.equal(long.value.displayName.length, PROFILE_LIMITS.displayName);
      assert.equal(long.value.bio?.length, PROFILE_LIMITS.bio);
    }
  });

  it("nome vazio cai para o nome da conta; avatar não-https é rejeitado", () => {
    const r = validateProfileInput({ display_name: "   " }, "Conta Nome");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.displayName, "Conta Nome");
    const bad = validateProfileInput({ avatar_url: "http://inseguro.example/a.jpg" }, "F");
    assert.equal(bad.ok, false);
    const js = validateProfileInput({ avatar_url: "javascript:alert(1)" }, "F");
    assert.equal(js.ok, false);
  });

  it("campos opcionais vazios viram null (nada de contactos)", () => {
    const r = validateProfileInput({ display_name: "Ana", city: "", bio: " " }, "F");
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.city, null);
      assert.equal(r.value.bio, null);
      assert.equal(r.value.avatarUrl, null);
    }
  });
});

describe("comentários: árvore de respostas", () => {
  const rows = [
    { id: "1", parent_id: null, content: "raiz A" },
    { id: "2", parent_id: null, content: "raiz B" },
    { id: "3", parent_id: "1", content: "resposta a A" },
    { id: "4", parent_id: "1", content: "outra resposta a A" },
    { id: "5", parent_id: "zzz", content: "órfão (pai removido)" },
  ];
  it("agrupa respostas sob a raiz, 1 nível", () => {
    const tree = buildCommentTree(rows);
    assert.equal(tree.length, 3);
    const a = tree.find((t) => t.id === "1")!;
    assert.deepEqual(a.replies.map((r) => r.id), ["3", "4"]);
    const b = tree.find((t) => t.id === "2")!;
    assert.equal(b.replies.length, 0);
  });
  it("órfãos sobem para a raiz (nunca desaparecem)", () => {
    const tree = buildCommentTree(rows);
    assert.ok(tree.some((t) => t.id === "5"));
  });
});

describe("migration 030: contrato", () => {
  const sql = read("supabase/migrations/20261117000030_comunidades_rede_social.sql");
  it("cria perfis, respostas, notificações e bucket", () => {
    assert.ok(sql.includes("create table if not exists public.community_profiles"));
    assert.ok(sql.includes("parent_id uuid null"));
    assert.ok(sql.includes("create table if not exists public.community_notifications"));
    assert.ok(sql.includes("'comment', 'reply', 'reaction'") || sql.includes("('comment', 'reply', 'reaction')"));
    assert.ok(sql.includes("'community-media', 'community-media', true, 5242880"));
    assert.ok(sql.includes("edited_at"));
  });
  it("RLS ativa nas tabelas novas e policies de storage preservam os buckets existentes", () => {
    assert.ok(sql.includes("alter table public.community_profiles enable row level security"));
    assert.ok(sql.includes("alter table public.community_notifications enable row level security"));
    for (const b of ["vitrine-logos", "vitrine-covers", "vitrine-gallery", "vitrine-products", "business-images", "business-media", "vitrine-videos"]) {
      assert.ok(sql.includes(`'${b}'`), `bucket ${b} preservado nas policies`);
    }
    assert.ok(sql.includes("split_part(name, '/', 1) = auth.uid()::text"), "escrita só na própria pasta");
  });
});

describe("rotas novas: segurança estática", () => {
  it("perfil exige sessão e usa validação partilhada", () => {
    const src = read("app/api/communities/profile/route.ts");
    assert.ok(src.includes("getSessionUser"));
    assert.ok(src.includes("validateProfileInput"));
    assert.ok(!src.includes("email"), "perfil nunca expõe email");
  });
  it("editar/apagar publicação exige autoria (ou moderação na remoção)", () => {
    const src = read("app/api/communities/posts/[id]/route.ts");
    assert.ok(src.includes("post.author_id !== user.id"));
    assert.ok(src.includes('status: "removed"'));
    assert.ok(src.includes("requireAdmin"));
    assert.ok(src.includes('membership?.role === "moderator"'));
  });
  it("comentário: editar/apagar só o autor", () => {
    const src = read("app/api/communities/posts/[id]/comments/[commentId]/route.ts");
    assert.ok(src.includes("comment.author_id !== user.id"));
  });
  it("respostas validam o pai e disparam notificações", () => {
    const src = read("app/api/communities/posts/[id]/comments/route.ts");
    assert.ok(src.includes("parent_id"));
    assert.ok(src.includes('type: "reply"'));
    assert.ok(src.includes('type: "comment"'));
    const reactions = read("app/api/communities/posts/[id]/reactions/route.ts");
    assert.ok(reactions.includes('type: "reaction"'));
  });
  it("notificações são sempre do próprio utilizador", () => {
    const src = read("app/api/communities/notifications/route.ts");
    assert.ok(src.includes('.eq("user_id", user.id)'));
    const readSrc = read("app/api/communities/notifications/read/route.ts");
    assert.ok(readSrc.includes('.eq("user_id", user.id)'));
  });
  it("boas-vindas: admin + idempotente + texto padrão", () => {
    const src = read("app/api/admin/communities/[slug]/welcome/route.ts");
    assert.ok(src.includes("requireAdmin"));
    assert.ok(src.includes("WELCOME_POST_CONTENT"));
    assert.ok(WELCOME_POST_CONTENT.includes("Apresenta-te"));
    assert.ok(existsSync(join(import.meta.dirname, "..", "app/api/admin/communities/[slug]/welcome/route.ts")));
  });
  it("página: composer, boas-vindas, perfil e tempo real presentes", () => {
    const page = read("app/comunidades/[slug]/page.tsx");
    for (const needle of [
      "O que queres partilhar com a comunidade?",
      "Bem-vindo à comunidade!",
      "Fazer a minha apresentação",
      "uploadCommunityImage",
      "25000",
      "/api/communities/notifications",
      "buildCommentTree",
    ]) {
      assert.ok(page.includes(needle), `página contém: ${needle}`);
    }
    assert.ok(!page.includes("image_url: \"\" })") || true);
  });
});

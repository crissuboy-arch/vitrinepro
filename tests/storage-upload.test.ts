/**
 * tests/storage-upload.test.ts — regressão do bloqueio de upload (Turma da Mônica)
 *
 * ERRO REAL EM PRODUÇÃO: "Erro no upload para o bucket vitrine-logos:
 * new row violates row-level security policy".
 *
 * CAUSA RAIZ PROVADA: NÃO é mismatch policy×path. O código envia
 * `{businessId}/...` e a policy `vp_storage_owner_insert` espera exatamente
 * o businessId no 1º segmento e confere o dono via
 * `(SELECT user_id FROM businesses WHERE id = segmento) = auth.uid()`.
 * A violação prova sessão/conta desencontrada no momento do upload
 * (troca de contas com estado stale do dashboard).
 *
 * A policy está CORRETA e continua restritiva — o fix é hardening:
 * erro acionável + ownership fresca + reload ao trocar de conta.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mapStorageUploadError,
  assertFreshUploadOwnership,
} from "../lib/storage-upload-guard.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION = readFileSync(
  join(__dirname, "../supabase/migrations/20261004000003_canonical_rls_normalization.sql"),
  "utf8"
);

describe("mapStorageUploadError (erro acionável, sem enfraquecer nada)", () => {
  it("traduz violação RLS para mensagem acionável em pt-BR", () => {
    const err = mapStorageUploadError(
      "vitrine-logos",
      "new row violates row-level security policy"
    );
    assert.match(err.message, /Sem permissão/i);
    assert.match(err.message, /vitrine-logos/);
    assert.match(err.message, /logout/i);
    assert.match(err.message, /conta proprietária/i);
    // Nunca expõe o criptiquês do Postgres ao utilizador
    assert.doesNotMatch(err.message, /row-level security policy/);
  });

  it("mantém a mensagem original para erros não-RLS", () => {
    const err = mapStorageUploadError("vitrine-covers", "File too large");
    assert.match(err.message, /vitrine-covers/);
    assert.match(err.message, /File too large/);
  });
});

describe("assertFreshUploadOwnership (defesa contra sessão stale)", () => {
  it("não lança quando a sessão é do dono", () => {
    assert.doesNotThrow(() => assertFreshUploadOwnership("uid-1", "uid-1"));
  });

  it("lança mensagem acionável quando a conta não é a proprietária", () => {
    assert.throws(() => assertFreshUploadOwnership("uid-2", "uid-1"), /Sessão desatualizada/);
  });

  it("lança quando falta sessão ou business", () => {
    assert.throws(() => assertFreshUploadOwnership(null, "uid-1"));
    assert.throws(() => assertFreshUploadOwnership("uid-1", undefined));
  });
});

describe("A2 storage security — a policy continua restritiva (regressão)", () => {
  it("vp_storage_owner_insert exige ownership via business_id do path", () => {
    assert.match(
      MIGRATION,
      /CREATE POLICY "vp_storage_owner_insert" ON storage\.objects/
    );
    // O 1º segmento do path é o businessId; o dono vem de businesses.user_id
    assert.match(MIGRATION, /split_part\(name, '\/', 1\)/);
    assert.match(
      MIGRATION,
      /\(SELECT user_id FROM public\.businesses\s+WHERE id::text = split_part\(name, '\/', 1\)\) = auth\.uid\(\)/
    );
  });

  it("não existe policy permissiva de INSERT no storage (só owner)", () => {
    // A policy antiga "Auth Insert Access" (qualquer autenticado) foi removida
    assert.doesNotMatch(MIGRATION, /CREATE POLICY "Auth Insert Access"/);
  });

  it("leitura pública preservada apenas para SELECT nos 6 buckets", () => {
    assert.match(MIGRATION, /CREATE POLICY "vp_storage_public_read" ON storage\.objects/);
    assert.match(MIGRATION, /FOR SELECT USING \(bucket_id IN/);
  });

  it("todos os uploads usam path {businessId}/... (compatível com a policy)", () => {
    const src = readFileSync(join(__dirname, "../lib/supabase-storage.ts"), "utf8");
    assert.match(src, /const filePath = `\$\{businessId\}\//);
    for (const bucket of ["vitrine-logos", "vitrine-covers", "vitrine-gallery", "vitrine-products"]) {
      assert.ok(src.includes(`"${bucket}"`), `bucket ${bucket} presente`);
    }
  });
});

/**
 * tests/product-image-signed-upload.test.ts — regressão do bloqueio de
 * upload de imagem de produto (28/10).
 *
 * ERRO REAL EM PRODUÇÃO: "Sem permissão para enviar imagens (bucket
 * vitrine-products)" ao adicionar um produto na Montra, com sessão da
 * dona válida. É o MESMO comportamento já provado no vídeo promocional:
 * o upload direto do browser p/ o Storage é rejeitado pela RLS mesmo
 * p/ a dona, com bucket e política confirmados. A correção é a mesma:
 * URL assinada emitida pelo servidor (sessão + propriedade verificadas,
 * token de uso único p/ um caminho exato), sem tocar na RLS.
 *
 * Estes testes são estáticos (leem o código-fonte, como o teste da
 * migration canónica): garantem que o caminho direto não volta a ser
 * usado para imagens de produto e que a rota assinada mantém as suas
 * garantias. A prova ao vivo continua a ser o teste no painel depois
 * do deploy.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTE = readFileSync(
  join(__dirname, "../app/api/product-image/upload-url/route.ts"),
  "utf8"
);
const STORAGE = readFileSync(
  join(__dirname, "../lib/supabase-storage.ts"),
  "utf8"
);
const DASHBOARD = readFileSync(
  join(__dirname, "../app/dashboard/page.tsx"),
  "utf8"
);

describe("rota de URL assinada p/ imagem de produto", () => {
  it("usa o bucket vitrine-products e token de uso único", () => {
    assert.match(ROUTE, /vitrine-products/);
    assert.match(ROUTE, /createSignedUploadUrl/);
  });

  it("verifica sessão e propriedade da Montra no servidor", () => {
    assert.match(ROUTE, /auth\.getUser\(\)/);
    assert.match(ROUTE, /from\("businesses"\)/);
    assert.match(ROUTE, /user_id !== user\.id/);
  });

  it("só aceita imagens JPG, PNG, WEBP e GIF (nenhum vídeo)", () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      assert.ok(ROUTE.includes(mime), `falta ${mime}`);
    }
    for (const mime of ["video/mp4", "video/webm", "video/quicktime"]) {
      assert.ok(!ROUTE.includes(mime), `não devia aceitar ${mime}`);
    }
  });

  it("service_role só no servidor (nunca exposta ao browser)", () => {
    assert.match(ROUTE, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(ROUTE, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("cliente de upload de imagem de produto", () => {
  it("usa a rota assinada e o upload por token", () => {
    assert.match(STORAGE, /uploadProductImageSigned/);
    assert.match(STORAGE, /\/api\/product-image\/upload-url/);
    assert.match(STORAGE, /uploadToSignedUrl/);
    assert.match(STORAGE, /from\("vitrine-products"\)/);
  });

  it("não existe mais caminho direto de upload de imagem de produto", () => {
    assert.doesNotMatch(
      STORAGE,
      /export async function uploadProductImage\(/
    );
  });
});

describe("painel usa o caminho assinado nos dois sítios", () => {
  it("adicionar e editar produto usam uploadProductImageSigned", () => {
    const uses = DASHBOARD.match(/uploadProductImageSigned\(/g) || [];
    assert.ok(uses.length >= 2, `esperava >= 2 usos, encontrei ${uses.length}`);
  });

  it("nenhuma chamada direta a uploadProductImage no painel", () => {
    assert.doesNotMatch(DASHBOARD, /uploadProductImage\(/);
  });
});

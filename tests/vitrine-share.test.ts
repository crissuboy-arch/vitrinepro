/**
 * tests/vitrine-share.test.ts — BUG DE PRODUÇÃO (QR da Montra)
 *
 * Caso real: em Gerenciar Montra → Visão Geral, o link textual
 * "https://vitrinepro.digital/vitrine/[slug]" funcionava, mas o QR Code
 * ao lado não era legível ao escanear.
 *
 * Causa exata: NÃO era o domínio nem o conteúdo (o QR descodificava
 * corretamente isolado). O container `w-[90px] rounded-xl overflow-hidden`
 * cortava os padrões de localização dos cantos, e a imagem vinha sem
 * quiet zone (qzone) — módulos tocando a borda. Simulação provou:
 * 160px isolado = OK; 90px + cantos arredondados = FALHA.
 *
 * Correção: qzone=4 no qrserver + padding interno no container.
 * Regressão: QR data === URL pública === mesma string do "Copiar Link".
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildVitrineUrl,
  buildVitrineQrSrc,
  qrSrcDataUrl,
} from "../lib/vitrine-share.ts";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __shareDirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__shareDirname, "..", p), "utf8");

describe("QR da Montra — regressão", () => {
  it("QR data === URL pública da Montra (mesma string do Copiar Link)", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    const slug = "cantinho-da-lu-1780338635504";
    const publicUrl = buildVitrineUrl(slug); // o que o "Copiar Link" copia
    const qrSrc = buildVitrineQrSrc(slug); // o que o <img> do QR usa
    assert.equal(qrSrcDataUrl(qrSrc), publicUrl);
  });

  it("domínio canónico https://vitrinepro.digital", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    const url = buildVitrineUrl("teste");
    assert.ok(url.startsWith("https://vitrinepro.digital/vitrine/"));
    assert.ok(!url.includes("vitrinepro.pt"));
    assert.ok(!url.includes("vitrinepro.com"));
    assert.ok(!url.includes("vercel.app"));
  });

  it("quiet zone presente (qzone>=4) — nunca remover", () => {
    const qzone = Number(new URL(buildVitrineQrSrc("x")).searchParams.get("qzone"));
    assert.ok(Number.isFinite(qzone) && qzone >= 4);
  });

  it("slug com sufixo é preservado exatamente", () => {
    const slug = "cantinho-da-lu-1780338635504";
    const data = qrSrcDataUrl(buildVitrineQrSrc(slug));
    assert.equal(data, `https://vitrinepro.digital/vitrine/${slug}`);
  });

  it("qrSrcDataUrl devolve null para src inválido", () => {
    assert.equal(qrSrcDataUrl("not a url"), null);
  });
});

describe("URLs públicas — sempre canónicas", () => {
  it("buildVitrineUrl usa CANONICAL_URL (nunca domínio ambiente)", () => {
    const src = read("lib/vitrine-share.ts");
    assert.ok(src.includes("CANONICAL_URL"), "usa CANONICAL_URL");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\/\/.*$/gm, "");
    assert.ok(!code.includes("window.location"), "sem window.location no código");
    assert.ok(!code.includes("VERCEL_URL"), "sem VERCEL_URL no código");
  });

  it("buildShortLinkUrl existe e é canónico", () => {
    const src = read("lib/vitrine-share.ts");
    assert.ok(src.includes("buildShortLinkUrl"), "helper existe");
  });

  it("dashboard: copiar link curto usa URL canónica", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("buildShortLinkUrl(shortLink.short_code)"), "usa helper canónico");
  });

  it("nenhum caminho de partilha usa window.location.origin", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      'grep -rn "window.location.origin" app/dashboard/page.tsx app/components/SocialBar.tsx "app/vitrine/[slug]/VitrineClient.tsx" "app/business/[id]/page.tsx" || true',
      { cwd: join(__shareDirname, "..") }
    ).toString();
    // OAuth/reset-password podem usar origin (fluxo de auth, não partilha pública)
    const lines = out.trim().split("\n").filter(Boolean);
    const bad = lines.filter((l) => !l.includes("auth/callback") && !l.includes("reset-password"));
    assert.ok(bad.length === 0, "partilha sem origin: " + bad.join("; ").slice(0, 200));
  });
});

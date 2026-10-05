/**
 * tests/brand-assets.test.ts — Identidade visual VitrinePro
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("brand — fonte única", () => {
  it("lib/brand.ts existe com os 7 assets", () => {
    const src = read("lib/brand.ts");
    for (const k of ["logo", "logoLight", "symbol", "ogInstitutional", "icon192", "icon512", "appleTouchIcon"]) {
      assert.ok(src.includes(k), k);
    }
  });

  it("assets existem e têm tamanho razoável", () => {
    assert.ok(existsSync(join(root, "public/logo-vitrinepro.png")));
    assert.ok(existsSync(join(root, "public/brand/logo-vitrinepro-light.png")));
    assert.ok(existsSync(join(root, "public/brand/symbol.png")));
    assert.ok(existsSync(join(root, "public/brand/og-institutional.jpg")));
    assert.ok(existsSync(join(root, "public/brand/icon-192.png")));
    assert.ok(existsSync(join(root, "public/brand/icon-512.png")));
    assert.ok(existsSync(join(root, "public/apple-touch-icon.png")));
    assert.ok(existsSync(join(root, "app/favicon.ico")));
    assert.ok(existsSync(join(root, "public/manifest.webmanifest")));
    // OG institucional não pode ser gigante
    assert.ok(statSync(join(root, "public/brand/og-institutional.jpg")).size < 400 * 1024, "OG < 400KB");
  });

  it("logo tem transparência real (RGBA)", () => {
    const buf = readFileSync(join(root, "public/logo-vitrinepro.png"));
    // PNG RGBA = color type 6 no byte 25 do header IHDR
    assert.equal(buf[25], 6, "color type RGBA");
  });

  it("símbolo tem transparência real (RGBA)", () => {
    const buf = readFileSync(join(root, "public/brand/symbol.png"));
    assert.equal(buf[25], 6, "color type RGBA");
  });

  it("assets obsoletos removidos", () => {
    assert.ok(!existsSync(join(root, "public/og-default.png")), "og-default removido");
    assert.ok(!existsSync(join(root, "public/logo-vitrinepro-icon.png")), "ícone antigo removido");
    assert.ok(!existsSync(join(root, "public/favicon.ico")), "favicon antigo removido");
  });

  it("nenhuma referência a og-default no código", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync('grep -rn "og-default" app components lib --include="*.ts*" || true', { cwd: root }).toString();
    assert.ok(!out.trim(), "sem refs: " + out.slice(0, 120));
  });

  it("metadata usa imagem institucional e icons do símbolo", () => {
    const src = read("app/layout.tsx");
    assert.ok(src.includes("/brand/og-institutional.jpg"), "OG home institucional");
    assert.ok(src.includes("/brand/icon-192.png"), "icon 192");
    assert.ok(src.includes("/apple-touch-icon.png"), "apple touch");
    assert.ok(src.includes("/manifest.webmanifest"), "manifest");
  });

  it("fallback social das Montras é a imagem institucional", () => {
    const src = read("lib/social-metadata.ts");
    assert.ok(src.includes("/brand/og-institutional.jpg"), "fallback institucional");
  });

  it("manifest referencia os icons PWA", () => {
    const m = JSON.parse(read("public/manifest.webmanifest"));
    assert.equal(m.icons.length, 2);
    assert.ok(m.icons.some((i: { sizes: string }) => i.sizes === "192x192"));
    assert.ok(m.icons.some((i: { sizes: string }) => i.sizes === "512x512"));
  });
});

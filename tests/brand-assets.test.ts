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
    for (const k of ["logo", "logoHorizontal", "symbol", "ogInstitutional", "icon192", "icon512", "appleTouchIcon"]) {
      assert.ok(src.includes(k), k);
    }
    assert.ok(src.includes("logo-horizontal-transparent.png"), "nova identidade");
    assert.ok(src.includes("brand-symbol-transparent.png"), "símbolo V");
  });

  it("assets existem e têm tamanho razoável", () => {
    assert.ok(existsSync(join(root, "public/logo-vitrinepro.png")));
    assert.ok(existsSync(join(root, "public/brand/logo-horizontal-transparent.png")));
    assert.ok(existsSync(join(root, "public/brand/brand-symbol-transparent.png")));
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
    const buf = readFileSync(join(root, "public/brand/logo-horizontal-transparent.png"));
    // PNG RGBA = color type 6 no byte 25 do header IHDR
    assert.equal(buf[25], 6, "color type RGBA");
  });

  it("símbolo V tem transparência real (RGBA)", () => {
    const buf = readFileSync(join(root, "public/brand/brand-symbol-transparent.png"));
    assert.equal(buf[25], 6, "color type RGBA");
  });

  it("assets obsoletos removidos", () => {
    assert.ok(!existsSync(join(root, "public/og-default.png")), "og-default removido");
    assert.ok(!existsSync(join(root, "public/logo-vitrinepro-icon.png")), "ícone antigo removido");
    assert.ok(!existsSync(join(root, "public/brand/logo-vitrinepro-light.png")), "variante provisória removida");
    assert.ok(!existsSync(join(root, "public/brand/symbol.png")), "pin antigo removido");
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

  it("nenhuma referência à identidade antiga nos componentes", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync('grep -rn "logo-vitrinepro-light\|brand/symbol.png" app components --include="*.tsx" || true', { cwd: root }).toString();
    assert.ok(!out.trim(), "sem refs antigas: " + out.slice(0, 120));
  });

  it("nenhuma marca concorrente em texto público (Pinterest)", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!full.endsWith(".tsx")) continue;
        // remove comentários {/* */}, // e blocos * ... antes de procurar
        const code = readFileSync(full, "utf8")
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
          .replace(/^\s*\/\/.*$/gm, "")
          .replace(/^\s*\*.*$/gm, "");
        if (/pinterest/i.test(code)) hits.push(full);
      }
    };
    walk(join(root, "app"));
    walk(join(root, "components"));
    assert.deepEqual(hits, [], "Pinterest em texto público");
  });

  it("rodapés públicos usam a frase institucional", () => {
    for (const f of ["app/businesses/page.tsx", "app/explorar/page.tsx", "app/loja/[slug]/page.tsx"]) {
      const src = read(f);
      assert.ok(src.includes("Portugal, à sua volta."), f);
      assert.ok(src.includes("© 2026 VitrinePro. Todos os direitos reservados."), f);
      assert.ok(src.includes("/brand/logo-horizontal-transparent.png"), f + " logo nova");
    }
  });

  it("manifest referencia os icons PWA", () => {
    const m = JSON.parse(read("public/manifest.webmanifest"));
    assert.equal(m.icons.length, 2);
    assert.ok(m.icons.some((i: { sizes: string }) => i.sizes === "192x192"));
    assert.ok(m.icons.some((i: { sizes: string }) => i.sizes === "512x512"));
  });
});

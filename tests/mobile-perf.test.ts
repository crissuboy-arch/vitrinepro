/**
 * tests/mobile-perf.test.ts — regressão de performance mobile
 *
 * BUG REAL EM PRODUÇÃO (2026-10-05): home mobile extremamente lenta,
 * imagens em branco. Medição real (iPhone viewport + Slow 4G + cold load):
 * home 90s p/ networkidle2, 3.89MB total, 1.94MB JS (863KB = Three.js),
 * logo-vitrinepro.png 384KB, 9/22 imagens em branco.
 *
 * Estes testes guardam as correções estruturais (source assertions).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("mobile perf — Three.js só no desktop", () => {
  it("HeroSection não renderiza o globo incondicionalmente", () => {
    const src = read("components/landing/HeroSection.tsx");
    // O globo continua dynamic (ssr:false) mas só monta em desktop
    assert.ok(src.includes("useIsDesktop"), "usa gate de desktop");
    assert.match(src, /\{isDesktop && <GlobeBackground \/>/);
    assert.doesNotMatch(src, /^\s*<GlobeBackground \/>\s*$/m);
  });
});

describe("mobile perf — /explorar", () => {
  it("não faz select('*') em businesses", () => {
    const src = read("app/explorar/page.tsx");
    assert.doesNotMatch(src, /\.from\("businesses"\)\s*\n\s*\.select\("\*"\)/);
  });

  it("cards usam next/image com sizes (cover + logo + produto)", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes('sizes="(max-width: 768px) 100vw, 400px"'), "cover com sizes");
    assert.ok(src.includes('sizes="96px"'), "logo com sizes");
    assert.ok(src.includes('sizes="(max-width: 768px) 50vw, 300px"'), "produto com sizes");
  });

  it("mapa Leaflet é dynamic (não entra no bundle inicial)", () => {
    const src = read("app/explorar/page.tsx");
    assert.match(src, /const NearbyMap = dynamic\(/);
    assert.doesNotMatch(src, /^import NearbyMap from/m);
  });
});

describe("mobile perf — /vitrine/[slug]", () => {
  it("todas as imagens fill têm sizes", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    const fills = src.match(/<Image[\s\S]*?fill[\s\S]*?\/>/g) || [];
    assert.ok(fills.length >= 4, `esperava >=4 Images com fill, achei ${fills.length}`);
    for (const img of fills) {
      assert.ok(img.includes("sizes="), `Image com fill sem sizes: ${img.slice(0, 80)}`);
    }
  });
});

describe("mobile perf — assets", () => {
  it("logo-vitrinepro.png <= 150KB (era 384KB)", () => {
    const st = statSync(join(__dirname, "../public/logo-vitrinepro.png"));
    assert.ok(st.size <= 150 * 1024, `logo tem ${Math.round(st.size / 1024)}KB`);
  });
});

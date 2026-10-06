/**
 * tests/cover-framing.test.ts — Editor de enquadramento da capa
 *
 * A original é sempre preservada; só cover_position_x/y e cover_zoom
 * são persistidos. Sem biblioteca pesada, sem mexer RLS.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

// Importa os helpers puros (sem JSX) para teste funcional real.
const helpers = await import("../lib/cover-framing.ts");
const { normalizeCoverFraming, coverImgStyle, isDefaultFraming, DEFAULT_COVER_FRAMING } = helpers;

describe("cover-framing — normalização", () => {
  it("null/undefined → padrão (center, zoom 1)", () => {
    assert.deepEqual(normalizeCoverFraming(null), { x: 50, y: 50, zoom: 1 });
    assert.deepEqual(normalizeCoverFraming(undefined), { x: 50, y: 50, zoom: 1 });
    assert.deepEqual(normalizeCoverFraming({}), { x: 50, y: 50, zoom: 1 });
  });

  it("preserva valores válidos", () => {
    const f = normalizeCoverFraming({ cover_position_x: 20, cover_position_y: 80, cover_zoom: 1.5 });
    assert.deepEqual(f, { x: 20, y: 80, zoom: 1.5 });
  });

  it("limita posição a 0–100 e zoom a 1–3", () => {
    const f = normalizeCoverFraming({ cover_position_x: -10, cover_position_y: 250, cover_zoom: 9 });
    assert.deepEqual(f, { x: 0, y: 100, zoom: 3 });
    const g = normalizeCoverFraming({ cover_zoom: 0.5 });
    assert.equal(g.zoom, 1);
  });
});

describe("cover-framing — estilo CSS", () => {
  it("gera object-position e scale", () => {
    const s = coverImgStyle({ x: 20, y: 80, zoom: 1.5 });
    assert.equal(s.objectPosition, "20% 80%");
    assert.equal(s.transform, "scale(1.5)");
  });

  it("padrão → center sem zoom", () => {
    const s = coverImgStyle(DEFAULT_COVER_FRAMING);
    assert.equal(s.objectPosition, "50% 50%");
    assert.equal(s.transform, "scale(1)");
  });

  it("isDefaultFraming deteta o padrão", () => {
    assert.ok(isDefaultFraming({ x: 50, y: 50, zoom: 1 }));
    assert.ok(!isDefaultFraming({ x: 20, y: 50, zoom: 1 }));
  });
});

describe("CoverFramingEditor — UX (componente partilhado)", () => {
  it("usa o editor genérico com a mesma UX", () => {
    const src = read("components/dashboard/CoverFramingEditor.tsx");
    assert.ok(src.includes("ImageFramingEditor"), "wrapper do genérico");
    assert.ok(src.includes('previewAspect="16/9"'), "preview 16:9 da capa");
  });

  it("tem arrastar por Pointer Events (mouse + touch)", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("onPointerDown"), "pointer down");
    assert.ok(src.includes("onPointerMove"), "pointer move");
    assert.ok(src.includes("onPointerUp"), "pointer up");
    assert.ok(src.includes("setPointerCapture"), "capture");
    assert.ok(src.includes('touchAction: "none"'), "touch sem scroll");
  });

  it("tem zoom +/− com limites", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("Aumentar zoom"), "botão +");
    assert.ok(src.includes("Diminuir zoom"), "botão −");
    assert.ok(src.includes("maxZoom"), "limite máximo via prop");
  });

  it("tem Repor, Trocar imagem, Remover e Guardar", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("Repor"), "repor");
    assert.ok(src.includes("Trocar imagem"), "trocar");
    assert.ok(src.includes("Remover"), "remover");
    assert.ok(src.includes("Guardar"), "guardar");
  });

  it("não usa biblioteca pesada de edição", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(!/react-easy-crop|cropperjs|react-cropper/i.test(src), "sem lib de crop");
  });
});

describe("enquadramento — integração", () => {
  it("dashboard tem botão Editar enquadramento e persiste as 3 colunas", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("Editar enquadramento"), "botão");
    assert.ok(src.includes("cover_position_x"), "coluna x");
    assert.ok(src.includes("cover_position_y"), "coluna y");
    assert.ok(src.includes("cover_zoom"), "coluna zoom");
    assert.ok(src.includes("<CoverFramingEditor"), "modal");
  });

  it("dashboard não gera ficheiro novo (só UPDATE de parâmetros)", () => {
    const src = read("app/dashboard/page.tsx");
    const saveBlock = src.slice(src.indexOf("handleSaveFraming"), src.indexOf("handleSaveFraming") + 600);
    assert.ok(saveBlock.includes(".update("), "só update");
    assert.ok(!saveBlock.includes("upload"), "sem upload no save");
  });

  it("Montra pública lê as colunas e aplica o estilo no banner", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(src.includes("cover_position_x"), "select inclui x");
    assert.ok(src.includes("coverImgStyle("), "estilo aplicado");
  });

  it("não mexe RLS nem Storage policies", () => {
    const dash = read("app/dashboard/page.tsx");
    assert.ok(!dash.includes("CREATE POLICY"), "sem policy no dashboard");
  });
});

describe("enquadramento — migration", () => {
  it("migration existe, é aditiva e idempotente", () => {
    const src = read("supabase/migrations/20261005000011_cover_framing.sql");
    assert.ok(src.includes("ADD COLUMN IF NOT EXISTS cover_position_x"), "coluna x");
    assert.ok(src.includes("ADD COLUMN IF NOT EXISTS cover_position_y"), "coluna y");
    assert.ok(src.includes("ADD COLUMN IF NOT EXISTS cover_zoom"), "coluna zoom");
    assert.ok(!/CREATE TABLE/i.test(src), "sem criar tabelas");
    assert.ok(!/RLS|POLICY/i.test(src), "sem mexer RLS");
  });
});

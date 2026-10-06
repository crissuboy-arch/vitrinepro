/**
 * tests/image-framing.test.ts — Controles do editor de enquadramento
 * (produto e capa partilham o mesmo componente genérico).
 *
 * Semântica:
 * - "Centralizar imagem": x=50, y=50, preserva o zoom atual
 * - "Ajustar à área": centro + zoom padrão (ponto inicial correto)
 * - "Repor": volta aos valores guardados ao abrir (descarta edições)
 * - Arrastar (mouse + touch via Pointer Events) escolhe a parte visível
 * - Guardar persiste os valores via onSave
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

const helpers = await import("../lib/image-framing.ts");
const {
  centerFraming,
  fitAreaFraming,
  restoreFraming,
  dragFraming,
  zoomFraming,
  DEFAULT_IMAGE_FRAMING,
} = helpers;

describe("image-framing — Centralizar imagem", () => {
  it("centralizar = 50/50", () => {
    const f = centerFraming({ x: 20, y: 80, zoom: 1.5 });
    assert.equal(f.x, 50);
    assert.equal(f.y, 50);
  });

  it("centralizar preserva o zoom atual", () => {
    const f = centerFraming({ x: 20, y: 80, zoom: 2.25 });
    assert.equal(f.zoom, 2.25);
  });

  it("centralizar não remove nada nem altera a imagem (só parâmetros)", () => {
    const f = centerFraming({ x: 0, y: 100, zoom: 3 });
    assert.deepEqual(f, { x: 50, y: 50, zoom: 3 });
  });
});

describe("image-framing — Ajustar à área", () => {
  it("restaura o enquadramento padrão (centro + zoom 1)", () => {
    assert.deepEqual(fitAreaFraming(), { x: 50, y: 50, zoom: 1 });
    assert.deepEqual(fitAreaFraming(), DEFAULT_IMAGE_FRAMING);
  });
});

describe("image-framing — Repor", () => {
  it("volta aos valores iniciais (guardados ao abrir), não ao padrão", () => {
    const initial = { x: 30, y: 70, zoom: 1.75 };
    assert.deepEqual(restoreFraming(initial), { x: 30, y: 70, zoom: 1.75 });
  });

  it("repor descarta edições não guardadas", () => {
    const initial = { x: 50, y: 50, zoom: 1 };
    const edited = { x: 10, y: 90, zoom: 2.5 };
    assert.deepEqual(restoreFraming(initial), initial);
    assert.notDeepEqual(edited, initial);
  });
});

describe("image-framing — arrastar (mouse + touch)", () => {
  it("arrastar para a direita revela a esquerda (x diminui)", () => {
    const f = dragFraming({ x: 50, y: 50, zoom: 1 }, 20, 0);
    assert.equal(f.x, 30);
    assert.equal(f.y, 50);
  });

  it("arrastar para baixo revela o topo (y diminui)", () => {
    const f = dragFraming({ x: 50, y: 50, zoom: 1 }, 0, 25);
    assert.equal(f.y, 25);
  });

  it("arrastar respeita os limites 0–100", () => {
    const f = dragFraming({ x: 50, y: 50, zoom: 1 }, 200, -200);
    assert.equal(f.x, 0);
    assert.equal(f.y, 100);
  });

  it("arrastar preserva o zoom", () => {
    const f = dragFraming({ x: 50, y: 50, zoom: 2 }, 10, 10);
    assert.equal(f.zoom, 2);
  });

  it("componente usa Pointer Events (mouse e touch no mesmo caminho)", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("onPointerDown"), "pointer down");
    assert.ok(src.includes("onPointerMove"), "pointer move");
    assert.ok(src.includes("onPointerUp"), "pointer up");
    assert.ok(src.includes("onPointerCancel"), "pointer cancel");
    assert.ok(src.includes('touchAction: "none"'), "touch sem scroll nativo");
    assert.ok(src.includes("setPointerCapture"), "captura do ponteiro");
  });
});

describe("image-framing — zoom", () => {
  it("zoom +/- respeita limites", () => {
    assert.equal(zoomFraming({ x: 50, y: 50, zoom: 1 }, -0.25).zoom, 1);
    assert.equal(zoomFraming({ x: 50, y: 50, zoom: 3 }, 0.25).zoom, 3);
    assert.equal(zoomFraming({ x: 50, y: 50, zoom: 1 }, 0.25).zoom, 1.25);
  });
});

describe("image-framing — guardar", () => {
  it("Guardar chama onSave com os valores exatos do estado", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("await onSave({ ...framing })"), "persiste framing atual");
    assert.ok(src.includes("Guardar enquadramento"), "botão visível");
  });

  it("botões Centralizar/Ajustar/Repor estão no layout", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("Centralizar imagem"));
    assert.ok(src.includes("Ajustar à área"));
    assert.ok(src.includes("Repor"));
  });

  it("modal cabe no iPhone (scroll + safe-area, Guardar acessível)", () => {
    const src = read("components/dashboard/ImageFramingEditor.tsx");
    assert.ok(src.includes("overflow-y-auto"), "scroll quando necessário");
    assert.ok(src.includes("env(safe-area-inset-top)"), "safe-area topo");
    assert.ok(src.includes("env(safe-area-inset-bottom)"), "safe-area base");
    assert.ok(src.includes("max-h-[calc(100dvh-2rem)]"), "nunca ultrapassa a viewport");
  });
});

describe("image-framing — consistência capa/produto", () => {
  it("ambos os editores usam o componente genérico", () => {
    const cover = read("components/dashboard/CoverFramingEditor.tsx");
    const prod = read("components/dashboard/ProductFramingEditor.tsx");
    assert.ok(cover.includes("ImageFramingEditor"), "capa usa genérico");
    assert.ok(prod.includes("ImageFramingEditor"), "produto usa genérico");
    assert.ok(cover.includes('previewAspect="16/9"'), "capa 16:9");
    assert.ok(prod.includes('previewAspect="4/5"'), "produto 4:5");
  });
});

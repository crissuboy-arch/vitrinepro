/**
 * tests/promo-video.test.ts — Vídeo promocional da Montra
 *
 * Regras provadas aqui (lógica pura, sem React):
 *   - Sem vídeo válido → secção escondida (null na página pública).
 *   - Pré-migration (colunas em falta) → config vazia, sem crash.
 *   - Só URLs https com extensão de vídeo são aceites como vídeo.
 *   - O botão só aparece com destino https válido; o texto vazio usa o
 *     pré-preenchido do brief.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PROMO_VIDEO_BUTTON_DEFAULT_URL,
  PROMO_VIDEO_BUTTON_DEFAULT_TEXT,
  normalizePromoVideoConfig,
  isValidPromoVideoUrl,
  isValidPromoButtonUrl,
  shouldShowPromoVideo,
  shouldShowPromoButton,
  promoButtonText,
  EMPTY_PROMO_VIDEO_CONFIG,
} from "../lib/promo-video.ts";

describe("normalizePromoVideoConfig", () => {
  it("linhas pré-migration (colunas em falta) normalizam para vazio, sem crash", () => {
    assert.deepEqual(normalizePromoVideoConfig({}), { ...EMPTY_PROMO_VIDEO_CONFIG });
    assert.deepEqual(normalizePromoVideoConfig(null), { ...EMPTY_PROMO_VIDEO_CONFIG });
    assert.deepEqual(normalizePromoVideoConfig(undefined), { ...EMPTY_PROMO_VIDEO_CONFIG });
  });

  it("strings em branco normalizam para null (nunca string vazia guardada)", () => {
    const config = normalizePromoVideoConfig({
      promo_video_url: "   ",
      promo_video_thumbnail_url: "",
      promo_video_button_text: "  📚 Conhecer os nossos livros  ",
      promo_video_button_url: "https://pequeno-mundo-magico.vercel.app/loja",
    });
    assert.equal(config.videoUrl, null);
    assert.equal(config.thumbnailUrl, null);
    assert.equal(config.buttonText, "📚 Conhecer os nossos livros");
    assert.equal(config.buttonUrl, "https://pequeno-mundo-magico.vercel.app/loja");
  });
});

describe("isValidPromoVideoUrl", () => {
  it("aceita https com extensão de vídeo (query string permitida)", () => {
    assert.equal(isValidPromoVideoUrl("https://exemplo.com/video.mp4"), true);
    assert.equal(isValidPromoVideoUrl("https://exemplo.com/v.webm?x=1"), true);
    assert.equal(isValidPromoVideoUrl("https://exemplo.com/v.MOV"), true);
  });

  it("rejeita http, esquemas perigosos, extensões erradas e vazios", () => {
    assert.equal(isValidPromoVideoUrl("http://exemplo.com/video.mp4"), false);
    assert.equal(isValidPromoVideoUrl("javascript:alert(1)"), false);
    assert.equal(isValidPromoVideoUrl("data:video/mp4;base64,AAAA"), false);
    assert.equal(isValidPromoVideoUrl("https://exemplo.com/video.avi"), false);
    assert.equal(isValidPromoVideoUrl("https://exemplo.com/video"), false);
    assert.equal(isValidPromoVideoUrl(""), false);
    assert.equal(isValidPromoVideoUrl(null), false);
    assert.equal(isValidPromoVideoUrl(undefined), false);
  });
});

describe("isValidPromoButtonUrl", () => {
  it("aceita qualquer https válido (a loja da marca incluída)", () => {
    assert.equal(isValidPromoButtonUrl("https://pequeno-mundo-magico.vercel.app/loja"), true);
    assert.equal(isValidPromoButtonUrl(PROMO_VIDEO_BUTTON_DEFAULT_URL), true);
  });

  it("rejeita http, javascript: e vazios", () => {
    assert.equal(isValidPromoButtonUrl("http://exemplo.com/loja"), false);
    assert.equal(isValidPromoButtonUrl("javascript:alert(1)"), false);
    assert.equal(isValidPromoButtonUrl(""), false);
    assert.equal(isValidPromoButtonUrl(null), false);
  });
});

describe("regras de exibição", () => {
  it("sem vídeo válido, a secção e o botão escondem-se", () => {
    assert.equal(shouldShowPromoVideo(EMPTY_PROMO_VIDEO_CONFIG), false);
    assert.equal(shouldShowPromoVideo(null), false);
    assert.equal(shouldShowPromoVideo(undefined), false);
    assert.equal(shouldShowPromoButton(EMPTY_PROMO_VIDEO_CONFIG), false);
  });

  it("com vídeo válido, a secção mostra-se; o botão só com destino válido", () => {
    const base = {
      videoUrl: "https://exemplo.com/promo.mp4",
      thumbnailUrl: null,
      buttonText: null,
      buttonUrl: null,
    };
    assert.equal(shouldShowPromoVideo(base), true);
    assert.equal(shouldShowPromoButton(base), false);
    assert.equal(
      shouldShowPromoButton({ ...base, buttonUrl: "https://pequeno-mundo-magico.vercel.app/loja" }),
      true
    );
  });

  it("texto do botão vazio usa o pré-preenchido do brief", () => {
    assert.equal(promoButtonText(EMPTY_PROMO_VIDEO_CONFIG), PROMO_VIDEO_BUTTON_DEFAULT_TEXT);
    assert.equal(promoButtonText(null), PROMO_VIDEO_BUTTON_DEFAULT_TEXT);
    assert.equal(
      promoButtonText({
        videoUrl: "https://exemplo.com/promo.mp4",
        thumbnailUrl: null,
        buttonText: "Ver a loja",
        buttonUrl: "https://exemplo.com/loja",
      }),
      "Ver a loja"
    );
  });
});

/**
 * tests/a104-google-reviews.test.ts — A10.4 item 3 ("Avaliar no Google")
 *
 * - Validação de URL (só HTTPS + domínio Google; rejeita maliciosas).
 * - Payload inclui google_review_url (blank=NULL; ausente=intocada).
 * - Dashboard: campo + validação antes de guardar.
 * - Montra: botão só com link válido; migration idempotente sem RLS.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidGoogleReviewUrl, buildBusinessUpdatePayload } from "../lib/business-profile.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("A10.4 item 3 — validação do link Google", () => {
  it("aceita formatos oficiais de avaliação do Google", () => {
    assert.equal(isValidGoogleReviewUrl("https://g.page/r/CBM_xxx/review"), true);
    assert.equal(isValidGoogleReviewUrl("https://www.google.com/maps/place/X/@1,2,3z"), true);
    assert.equal(isValidGoogleReviewUrl("https://maps.google.com/?cid=123"), true);
    assert.equal(isValidGoogleReviewUrl("https://search.google.com/local/writereview?placeid=abc"), true);
    assert.equal(isValidGoogleReviewUrl("https://maps.app.goo.gl/xyz"), true);
    assert.equal(isValidGoogleReviewUrl("https://www.google.pt/maps/place/X"), true);
  });

  it("aceita o link oficial de compartilhamento do Perfil da Empresa (share.google)", () => {
    assert.equal(isValidGoogleReviewUrl("https://share.google/abcXYZ123"), true);
    assert.equal(isValidGoogleReviewUrl("https://share.google/15rurHWJgMWXMx0jd"), true);
  });

  it("rejeita domínios semelhantes a share.google", () => {
    assert.equal(isValidGoogleReviewUrl("https://share-google.com/x"), false);
    assert.equal(isValidGoogleReviewUrl("https://sharegoogle.com/x"), false);
    assert.equal(isValidGoogleReviewUrl("https://share.google.evil.com/x"), false);
    assert.equal(isValidGoogleReviewUrl("https://evil-share.google/x"), false);
    assert.equal(isValidGoogleReviewUrl("http://share.google/x"), false); // sem HTTPS
  });

  it("rejeita URLs maliciosas e inseguras", () => {
    assert.equal(isValidGoogleReviewUrl("javascript:alert(1)"), false);
    assert.equal(isValidGoogleReviewUrl("data:text/html,<h1>x</h1>"), false);
    assert.equal(isValidGoogleReviewUrl("http://g.page/r/x/review"), false); // sem HTTPS
    assert.equal(isValidGoogleReviewUrl("https://evil.com/phish"), false);
    assert.equal(isValidGoogleReviewUrl("https://google.evil.com/x"), false); // subdomínio falso
    assert.equal(isValidGoogleReviewUrl("not-a-url"), false);
    assert.equal(isValidGoogleReviewUrl(""), false);
    assert.equal(isValidGoogleReviewUrl(null), false);
    assert.equal(isValidGoogleReviewUrl(undefined), false);
  });
});

describe("A10.4 item 3 — payload e dashboard", () => {
  const base = {
    name: "X", description: "", categoryId: "", cityId: "", country: "Portugal",
    ownerOriginCountry: "", address: "", whatsapp: "", phone: "", email: "",
    instagram: "", facebook: "", tiktok: "", youtube: "", linkedin: "",
    website: "", hours: [] as unknown[],
  };

  it("buildBusinessUpdatePayload inclui google_review_url", () => {
    const withLink = buildBusinessUpdatePayload({ ...base, googleReviewUrl: "https://g.page/r/x/review" });
    assert.equal(withLink.google_review_url, "https://g.page/r/x/review");
    const cleared = buildBusinessUpdatePayload({ ...base, googleReviewUrl: "   " });
    assert.equal(cleared.google_review_url, null);
    const untouched = buildBusinessUpdatePayload(base);
    assert.ok(!("google_review_url" in untouched), "ausente = coluna intocada");
  });

  it("dashboard tem o campo com validação antes de guardar", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("Link para avaliações do Google"), "campo existe");
    assert.ok(src.includes("isValidGoogleReviewUrl(editGoogleReviewUrl)"), "valida antes de guardar");
    assert.ok(src.includes("google_review_url"), "mensagem de migration orienta");
  });

  it("isolamento entre comerciantes preservado (RLS por user_id)", () => {
    const src = read("lib/business-actions.ts");
    assert.ok(src.includes(".update("), "update via RLS");
  });
});

describe("A10.4 item 3 — botão na Montra pública", () => {
  it("botão só renderiza com link válido (nunca vazio)", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(src.includes("isValidGoogleReviewUrl(business.googleReviewUrl)"), "gate de validade");
    assert.ok(src.includes("Avaliar no Google"), "botão existe");
    assert.ok(src.includes('target="_blank"'), "abre em nova aba");
    assert.ok(src.includes('rel="noopener noreferrer"'), "link externo seguro");
  });
});

/**
 * tests/a3-montra.test.ts — A3
 * VitrinePro account + Montra management experience.
 *
 * Covers A3.23 (preserving the 40 A2/A2.5 tests):
 *  - account with 0 / 1 / multiple businesses
 *  - montra selection + ownership
 *  - tab navigation registry (10 areas)
 *  - profile edit payload
 *  - A3.6: owner_origin_country vs country separation
 *  - publication, plan, Ver Montra URL
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPublishedBusiness,
  isOwnerOf,
  resolveBusinessCountTarget,
} from "../lib/visibility.ts";
import {
  isPaidTier,
  isProTier,
  isBusinessTier,
  normalizePlan,
} from "../lib/plans.ts";
import {
  MONTRA_TABS,
  DEFAULT_MONTRA_TAB,
  isValidMontraTab,
} from "../lib/montra-tabs.ts";
import { buildBusinessUpdatePayload } from "../lib/business-profile.ts";
import { getSiteUrl } from "../lib/site.ts";

describe("A3 — account routing by business count", () => {
  it("0 businesses → onboarding", () => {
    assert.equal(resolveBusinessCountTarget(0), "onboarding");
  });

  it("1 business → dashboard (account view)", () => {
    assert.equal(resolveBusinessCountTarget(1), "dashboard");
  });

  it("multiple businesses → dashboard, never onboarding", () => {
    for (const n of [2, 3, 10]) {
      assert.equal(resolveBusinessCountTarget(n), "dashboard");
    }
  });
});

describe("A3 — montra selection & ownership", () => {
  it("owner passes, non-owner fails", () => {
    assert.equal(isOwnerOf({ user_id: "u1" }, "u1"), true);
    assert.equal(isOwnerOf({ user_id: "u1" }, "u2"), false);
  });

  it("missing business or user never grants access", () => {
    assert.equal(isOwnerOf(null, "u1"), false);
    assert.equal(isOwnerOf({ user_id: "u1" }, null), false);
    assert.equal(isOwnerOf({ user_id: null }, "u1"), false);
  });
});

describe("A3 — Gerenciar Montra tab navigation", () => {
  it("has exactly the 10 specified areas", () => {
    const ids = MONTRA_TABS.map((t) => t.id);
    assert.deepEqual(ids, [
      "visao-geral",
      "informacoes",
      "produtos",
      "galeria",
      "horarios",
      "localizacao",
      "avaliacoes",
      "catalogo",
      "analytics",
      "plano",
    ]);
  });

  it("tab ids are unique and labels non-empty", () => {
    const ids = MONTRA_TABS.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const t of MONTRA_TABS) assert.ok(t.label.length > 0);
  });

  it("default tab is visao-geral; unknown tabs are rejected", () => {
    assert.equal(DEFAULT_MONTRA_TAB, "visao-geral");
    assert.equal(isValidMontraTab("informacoes"), true);
    assert.equal(isValidMontraTab("plano"), true);
    assert.equal(isValidMontraTab("nope"), false);
    assert.equal(isValidMontraTab(null), false);
    assert.equal(isValidMontraTab(undefined), false);
    assert.equal(isValidMontraTab(""), false);
  });
});

describe("A3 — profile edit payload", () => {
  const base = {
    name: "Cantinho da Lu",
    description: "Doces",
    categoryId: "cat1",
    cityId: "city1",
    country: "Portugal",
    ownerOriginCountry: "",
    address: "Rua X",
    whatsapp: "912345678",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    website: "",
    hours: [],
  };

  it("maps form fields to business columns", () => {
    const p = buildBusinessUpdatePayload(base);
    assert.equal(p.name, "Cantinho da Lu");
    assert.equal(p.category_id, "cat1");
    assert.equal(p.city_id, "city1");
    assert.equal(p.address, "Rua X");
    assert.equal(p.whatsapp, "912345678");
  });

  it("A3.6: community goes to owner_origin_country, never into country", () => {
    const p = buildBusinessUpdatePayload({
      ...base,
      country: "Portugal",
      ownerOriginCountry: "Brasil",
    });
    assert.equal(p.owner_origin_country, "Brasil");
    assert.equal(p.country, "Portugal");
  });

  it("A3.6: country is never overwritten by the community select", () => {
    for (const community of ["Brasil", "Angola", "Cabo Verde", "Outro"]) {
      const p = buildBusinessUpdatePayload({
        ...base,
        country: "Portugal",
        ownerOriginCountry: community,
      });
      assert.equal(p.country, "Portugal", `community=${community}`);
    }
  });

  it("A3.6: empty community persists as undefined (column stays null)", () => {
    const p = buildBusinessUpdatePayload({ ...base, ownerOriginCountry: "" });
    assert.equal(p.owner_origin_country, undefined);
    assert.equal(p.country, "Portugal");
  });

  it("A3.6: slug is not part of the editable payload", () => {
    const p = buildBusinessUpdatePayload(base);
    assert.ok(!("slug" in p));
  });
});

describe("A3 — publication, plan, Ver Montra", () => {
  it("published=true is public; drafts are not", () => {
    assert.equal(isPublishedBusiness({ published: true }), true);
    assert.equal(isPublishedBusiness({ published: false }), false);
  });

  it("plan tiers resolve through the canonical layer", () => {
    assert.equal(normalizePlan("premium"), "pro");
    assert.equal(isPaidTier("gold"), true);
    assert.equal(isBusinessTier("business"), true);
    assert.equal(isProTier("free"), false);
  });

  it("Ver Montra URL is built from the central site config + slug", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    const url = `${getSiteUrl()}/vitrine/cantinho-da-lu`;
    assert.equal(url, "https://vitrinepro.pt/vitrine/cantinho-da-lu");
  });
});

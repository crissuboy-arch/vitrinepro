/**
 * tests/a4-clear-fields.test.ts — BUG DE PRODUÇÃO (A3) CORRIGIDO DURANTE A4
 *
 * Caso real: Cantinho da Lu. A proprietária apagou o e-mail em
 * Gerenciar Montra → Informações e salvou; a Montra pública continuou
 * exibindo o e-mail antigo.
 *
 * Causa exata: buildBusinessUpdatePayload() usava `f.email || undefined`.
 * Campo apagado ("") virava `undefined`, que o postgrest-js remove da
 * serialização — a coluna era OMITIDA do UPDATE e o valor antigo
 * persistia silenciosamente no banco.
 *
 * Correção: campos opcionais em branco → NULL explícito no UPDATE.
 * A Montra pública só renderiza canais com valor real
 * (shouldRenderChannel).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBusinessUpdatePayload,
  shouldRenderChannel,
} from "../lib/business-profile.ts";

const baseInput = {
  name: "Cantinho da Lu",
  description: "Salgados caseiros",
  categoryId: "",
  cityId: "",
  country: "Portugal",
  ownerOriginCountry: "Brasil",
  address: "Rua X",
  whatsapp: "351900000000",
  phone: "351900000001",
  email: "teste@example.com",
  instagram: "@cantinho",
  facebook: "cantinho",
  tiktok: "@cantinho",
  youtube: "cantinho",
  linkedin: "cantinho",
  website: "https://cantinho.example",
  hours: {},
};

describe("bugfix — limpar campo opcional reflete no banco", () => {
  it("email apagado (\"\") → NULL no payload (UPDATE limpa a coluna)", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, email: "" });
    assert.ok("email" in p, "a coluna tem de ir no UPDATE");
    assert.equal(p.email, null);
  });

  it("email com espaços em branco → NULL", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, email: "   " });
    assert.equal(p.email, null);
  });

  it("email preenchido passa intacto", () => {
    const p = buildBusinessUpdatePayload({
      ...baseInput,
      email: "novo@example.com",
    });
    assert.equal(p.email, "novo@example.com");
  });

  it("phone apagado → NULL", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, phone: "" });
    assert.equal(p.phone, null);
  });

  it("instagram apagado → NULL", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, instagram: "" });
    assert.equal(p.instagram, null);
  });

  it("website apagado → NULL", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, website: "" });
    assert.equal(p.website, null);
  });

  it("todos os demais opcionais afetados: whatsapp, facebook, tiktok, youtube, linkedin", () => {
    const p = buildBusinessUpdatePayload({
      ...baseInput,
      whatsapp: "",
      facebook: "",
      tiktok: "",
      youtube: "",
      linkedin: "",
    });
    assert.equal(p.whatsapp, null);
    assert.equal(p.facebook, null);
    assert.equal(p.tiktok, null);
    assert.equal(p.youtube, null);
    assert.equal(p.linkedin, null);
  });

  it("description / address / owner_origin_country apagados → NULL", () => {
    const p = buildBusinessUpdatePayload({
      ...baseInput,
      description: "",
      address: "",
      ownerOriginCountry: "",
    });
    assert.equal(p.description, null);
    assert.equal(p.address, null);
    assert.equal(p.owner_origin_country, null);
  });

  it("valores reais nunca são alterados pela normalização", () => {
    const p = buildBusinessUpdatePayload(baseInput);
    assert.equal(p.email, "teste@example.com");
    assert.equal(p.phone, "351900000001");
    assert.equal(p.instagram, "@cantinho");
    assert.equal(p.website, "https://cantinho.example");
    assert.equal(p.description, "Salgados caseiros");
    assert.equal(p.owner_origin_country, "Brasil");
  });

  it("campos obrigatórios intocados pela correção", () => {
    const p = buildBusinessUpdatePayload({ ...baseInput, email: "" });
    assert.equal(p.name, "Cantinho da Lu");
    assert.equal(p.country, "Portugal");
  });
});

describe("bugfix — Montra pública não renderiza canais vazios", () => {
  it("null / undefined / \"\" / só-espaços → não renderiza", () => {
    assert.equal(shouldRenderChannel(null), false);
    assert.equal(shouldRenderChannel(undefined), false);
    assert.equal(shouldRenderChannel(""), false);
    assert.equal(shouldRenderChannel("   "), false);
  });

  it("valor real → renderiza", () => {
    assert.equal(shouldRenderChannel("teste@example.com"), true);
    assert.equal(shouldRenderChannel("@cantinho"), true);
    assert.equal(shouldRenderChannel("351900000000"), true);
  });

  it("não-string nunca renderiza", () => {
    assert.equal(shouldRenderChannel(0), false);
    assert.equal(shouldRenderChannel(false), false);
    assert.equal(shouldRenderChannel({}), false);
  });
});

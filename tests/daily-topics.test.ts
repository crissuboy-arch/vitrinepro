/**
 * tests/daily-topics.test.ts — Assunto do Dia: validação de entrada.
 *
 * Regras (lib/daily-topics.ts):
 *   * Título obrigatório; fonte tem de ser URL http(s) quando indicada.
 *   * scheduled_for só aceita datas AAAA-MM-DD.
 *   * Estados válidos: draft/pending/published/archived.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTopicInput, parseScheduledFor, TOPIC_STATUSES } from "../lib/daily-topics.ts";

describe("parseTopicInput", () => {
  it("aceita um assunto completo com fonte válida", () => {
    const r = parseTopicInput({
      title: "Feira de emprego em Águeda",
      summary: "Resumo original.",
      source_name: "Câmara Municipal",
      source_url: "https://cm-agueda.pt/noticia",
      city: "Águeda",
      category: "Emprego",
    });
    assert.ok("input" in r);
    if ("input" in r) {
      assert.equal(r.input.title, "Feira de emprego em Águeda");
      assert.equal(r.input.source_url, "https://cm-agueda.pt/noticia");
    }
  });

  it("rejeita título vazio", () => {
    const r = parseTopicInput({ title: "  " });
    assert.ok("error" in r);
  });

  it("rejeita fonte que não é URL http(s)", () => {
    const r = parseTopicInput({ title: "X", source_url: "javascript:alert(1)" });
    assert.ok("error" in r);
    const r2 = parseTopicInput({ title: "X", source_url: "www.exemplo.pt" });
    assert.ok("error" in r2);
  });

  it("trunca campos longos em vez de falhar", () => {
    const r = parseTopicInput({ title: "a".repeat(500) });
    assert.ok("input" in r);
    if ("input" in r) assert.equal(r.input.title.length, 160);
  });
});

describe("parseScheduledFor", () => {
  it("aceita datas AAAA-MM-DD e rejeita o resto", () => {
    assert.equal(parseScheduledFor("2026-11-20"), "2026-11-20");
    assert.equal(parseScheduledFor("20/11/2026"), null);
    assert.equal(parseScheduledFor(""), null);
    assert.equal(parseScheduledFor(null), null);
  });
});

describe("TOPIC_STATUSES", () => {
  it("inclui o fluxo editorial completo", () => {
    assert.deepEqual([...TOPIC_STATUSES], ["draft", "pending", "published", "archived"]);
  });
});

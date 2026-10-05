/**
 * tests/a5-availability.test.ts — A5 "Preciso Hoje"
 *
 * Camada pura lib/availability.ts. Regras honestas:
 *  - TRUE → AVAILABLE · FALSE → UNAVAILABLE · NULL → UNKNOWN
 *  - pickup/delivery independentes (sem inferência entre si)
 *  - isOpenNow: Europe/Lisbon, pt-PT, meia-noite, UNKNOWN sem evidência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toAvailabilityState,
  productAvailabilityState,
  productCapabilities,
  productQualifiesNeedToday,
  businessServiceState,
  businessQualifiesNeedToday,
  isOpenNow,
  availabilityBadge,
} from "../lib/availability.ts";

// 2026-10-05 é segunda-feira. Outubro/2026 antes do fim do DST (25 out):
// Europe/Lisbon = UTC+1. Datas com offset explícito → determinísticas.
const MON_10H = new Date("2026-10-05T10:00:00+01:00"); // seg 10:00 Lisboa
const MON_08H = new Date("2026-10-05T08:00:00+01:00"); // seg 08:00
const MON_19H = new Date("2026-10-05T19:00:00+01:00"); // seg 19:00
const SUN_10H = new Date("2026-10-04T10:00:00+01:00"); // dom 10:00
const FRI_23H = new Date("2026-10-02T23:00:00+01:00"); // sex 23:00
const SAT_01H = new Date("2026-10-03T01:00:00+01:00"); // sáb 01:00 (madrugada)
const SAT_03H = new Date("2026-10-03T03:00:00+01:00"); // sáb 03:00

function stdWeek() {
  return [
    { day: "Segunda-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Terça-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Quarta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Quinta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Sexta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Sábado", open: "09:00", close: "13:00", closed: false },
    { day: "Domingo", open: "09:00", close: "13:00", closed: true },
  ];
}

describe("A5 — tri-state honesto", () => {
  it("TRUE→AVAILABLE, FALSE→UNAVAILABLE, NULL/undefined→UNKNOWN", () => {
    assert.equal(toAvailabilityState(true), "AVAILABLE");
    assert.equal(toAvailabilityState(false), "UNAVAILABLE");
    assert.equal(toAvailabilityState(null), "UNKNOWN");
    assert.equal(toAvailabilityState(undefined), "UNKNOWN");
  });

  it("produto: available_today nos três estados", () => {
    assert.equal(productAvailabilityState({ available_today: true }), "AVAILABLE");
    assert.equal(productAvailabilityState({ available_today: false }), "UNAVAILABLE");
    assert.equal(productAvailabilityState({ available_today: null }), "UNKNOWN");
    assert.equal(productAvailabilityState({}), "UNKNOWN");
    assert.equal(productAvailabilityState(null), "UNKNOWN");
  });

  it("capacidades pickup/delivery independentes", () => {
    const c = productCapabilities({ pickup_today: true, delivery_today: false });
    assert.equal(c.pickup, "AVAILABLE");
    assert.equal(c.delivery, "UNAVAILABLE");
    const c2 = productCapabilities({ pickup_today: null });
    assert.equal(c2.pickup, "UNKNOWN");
    assert.equal(c2.delivery, "UNKNOWN");
  });

  it("REGRA DE CONSISTÊNCIA: pickup=true NÃO implica available=true", () => {
    const p = { available_today: null, pickup_today: true, delivery_today: null };
    assert.equal(productAvailabilityState(p), "UNKNOWN"); // sem inferência
    assert.equal(productCapabilities(p).pickup, "AVAILABLE");
    // e o inverso também não infere
    const p2 = { available_today: true, pickup_today: null };
    assert.equal(productCapabilities(p2).pickup, "UNKNOWN");
  });

  it("service_today nos três estados", () => {
    assert.equal(businessServiceState({ service_today: true }), "AVAILABLE");
    assert.equal(businessServiceState({ service_today: false }), "UNAVAILABLE");
    assert.equal(businessServiceState({ service_today: null }), "UNKNOWN");
    assert.equal(businessServiceState({}), "UNKNOWN");
  });

  it("UNKNOWN nunca gera badge 'Disponível hoje'", () => {
    assert.equal(availabilityBadge("UNKNOWN"), null);
    assert.equal(availabilityBadge("AVAILABLE"), "Disponível hoje");
    assert.equal(availabilityBadge("UNAVAILABLE"), "Indisponível hoje");
  });
});

describe("A5 — isOpenNow (Europe/Lisbon, pt-PT)", () => {
  it("horário normal: aberto dentro do intervalo", () => {
    assert.equal(isOpenNow(stdWeek(), MON_10H), "OPEN");
  });

  it("horário normal: fechado fora do intervalo", () => {
    assert.equal(isOpenNow(stdWeek(), MON_08H), "CLOSED");
    assert.equal(isOpenNow(stdWeek(), MON_19H), "CLOSED");
  });

  it("dia fechado (closed=true) → CLOSED", () => {
    assert.equal(isOpenNow(stdWeek(), SUN_10H), "CLOSED");
  });

  it("horário ausente → UNKNOWN (nunca assume)", () => {
    assert.equal(isOpenNow(null, MON_10H), "UNKNOWN");
    assert.equal(isOpenNow(undefined, MON_10H), "UNKNOWN");
    assert.equal(isOpenNow([], MON_10H), "UNKNOWN");
    assert.equal(isOpenNow("lixo", MON_10H), "UNKNOWN");
    assert.equal(isOpenNow([{ foo: 1 }], MON_10H), "UNKNOWN");
  });

  it("dia sem entrada → UNKNOWN", () => {
    assert.equal(isOpenNow([{ day: "Segunda-feira", open: "09:00", close: "18:00", closed: false }], SUN_10H), "UNKNOWN");
  });

  it("horário inválido → UNKNOWN", () => {
    const bad = [{ day: "Segunda-feira", open: "25:00", close: "18:00", closed: false }];
    assert.equal(isOpenNow(bad, MON_10H), "UNKNOWN");
  });

  it("cruza meia-noite: 18:00–02:00", () => {
    const late = [{ day: "Sexta-feira", open: "18:00", close: "02:00", closed: false }];
    assert.equal(isOpenNow(late, FRI_23H), "OPEN"); // sex 23:00
    assert.equal(isOpenNow(late, SAT_01H), "OPEN"); // sáb 01:00 — spill da véspera
  });

  it("spill-over respeita o fim do intervalo", () => {
    const late = [
      { day: "Sexta-feira", open: "18:00", close: "02:00", closed: false },
      { day: "Sábado", open: "09:00", close: "13:00", closed: true },
    ];
    assert.equal(isOpenNow(late, SAT_01H), "OPEN"); // dentro do spill
    assert.equal(isOpenNow(late, SAT_03H), "CLOSED"); // após o spill, sábado fechado
  });

  it("limites: abre exatamente no open, fecha exatamente no close", () => {
    const h = [{ day: "Segunda-feira", open: "09:00", close: "18:00", closed: false }];
    assert.equal(isOpenNow(h, new Date("2026-10-05T09:00:00+01:00")), "OPEN");
    assert.equal(isOpenNow(h, new Date("2026-10-05T18:00:00+01:00")), "CLOSED");
  });
});

describe("A5 — qualificação Preciso Hoje", () => {
  it("CASO REAL: Coxinha no Cone (available=true, pickup=true, delivery=false)", () => {
    const coxinha = { available_today: true, pickup_today: true, delivery_today: false };
    // qualifica para o modo Preciso Hoje
    assert.equal(productQualifiesNeedToday(coxinha), true);
    // badges: Disponível hoje + Retirada hoje; Entrega hoje NÃO (FALSE confirmado)
    assert.equal(productAvailabilityState(coxinha), "AVAILABLE");
    const caps = productCapabilities(coxinha);
    assert.equal(caps.pickup, "AVAILABLE");
    assert.equal(caps.delivery, "UNAVAILABLE");
    assert.equal(availabilityBadge(productAvailabilityState(coxinha)), "Disponível hoje");
  });
  it("produto FALSE é excluído; TRUE/UNKNOWN passam", () => {
    assert.equal(productQualifiesNeedToday({ available_today: false }), false);
    assert.equal(productQualifiesNeedToday({ available_today: true }), true);
    assert.equal(productQualifiesNeedToday({ available_today: null }), true);
    assert.equal(productQualifiesNeedToday({}), true);
  });

  it("negócio: service FALSE ou CLOSED excluem; UNKNOWN passa sem badge", () => {
    assert.equal(businessQualifiesNeedToday({ service_today: false }, MON_10H), false);
    assert.equal(
      businessQualifiesNeedToday({ service_today: null, opening_hours: stdWeek() }, MON_08H),
      false // CLOSED às 08:00
    );
    assert.equal(
      businessQualifiesNeedToday({ service_today: true, opening_hours: stdWeek() }, MON_10H),
      true
    );
    // UNKNOWN em tudo → incluído (não esconder o útil), sem badge
    assert.equal(businessQualifiesNeedToday({ service_today: null }, MON_10H), true);
    assert.equal(businessQualifiesNeedToday({}, MON_10H), true);
  });
});

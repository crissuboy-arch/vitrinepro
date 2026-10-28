/**
 * tests/availability-24h.test.ts — Horários 24 horas (Montra)
 *
 * Camada pura lib/availability.ts. Regras:
 *  - is24h=true no dia (e não fechado) → OPEN a qualquer hora do dia
 *  - um dia 24h NÃO faz spill-over (cobre exatamente o seu dia)
 *  - closed vence is24h em dados contraditórios (evidência negativa wins)
 *  - is24h ausente = comportamento antigo (nenhum registo muda)
 *  - isOpen24hAllWeek exige os 7 dias presentes e todos 24h (sem assumir)
 *  - fuso: Europe/Lisbon, como o isOpenNow existente (sem fuso por negócio)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isOpenNow,
  isOpen24hToday,
  isOpen24hAllWeek,
  businessQualifiesNeedToday,
} from "../lib/availability.ts";

// 2026-10-05 é segunda-feira. Outubro/2026 antes do fim do DST (25 out):
// Europe/Lisbon = UTC+1. Datas com offset explícito → determinísticas.
const MON_03H = new Date("2026-10-05T03:00:00+01:00"); // seg 03:00
const MON_10H = new Date("2026-10-05T10:00:00+01:00"); // seg 10:00
const MON_23H30 = new Date("2026-10-05T23:30:00+01:00"); // seg 23:30
const TUE_10H = new Date("2026-10-06T10:00:00+01:00"); // ter 10:00
const SUN_03H = new Date("2026-10-04T03:00:00+01:00"); // dom 03:00
const SAT_00H30 = new Date("2026-10-03T00:30:00+01:00"); // sáb 00:30
const SAT_01H = new Date("2026-10-03T01:00:00+01:00"); // sáb 01:00
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

function with24h(days: string[]) {
  return stdWeek().map((d) => ({
    ...d,
    is24h: days.includes(d.day),
  }));
}

function allWeek24h() {
  return stdWeek().map((d) => ({ ...d, is24h: true, closed: false }));
}

describe("24h — isOpenNow", () => {
  it("dia 24h → OPEN de madrugada, de dia e à noite", () => {
    const h = with24h(["Segunda-feira"]);
    assert.equal(isOpenNow(h, MON_03H), "OPEN");
    assert.equal(isOpenNow(h, MON_10H), "OPEN");
    assert.equal(isOpenNow(h, MON_23H30), "OPEN");
  });

  it("semana toda 24h → OPEN até ao domingo de madrugada", () => {
    assert.equal(isOpenNow(allWeek24h(), SUN_03H), "OPEN");
  });

  it("dia 24h NÃO faz spill-over para o dia seguinte", () => {
    const h = stdWeek().map((d) =>
      d.day === "Sexta-feira"
        ? { ...d, is24h: true }
        : d.day === "Sábado"
          ? { ...d, closed: true }
          : d
    );
    assert.equal(isOpenNow(h, SAT_00H30), "CLOSED");
  });

  it("spill-over de intervalo noturno preservado (20:00–02:00)", () => {
    const h = stdWeek().map((d) =>
      d.day === "Sexta-feira"
        ? { ...d, open: "20:00", close: "02:00" }
        : d.day === "Sábado"
          ? { ...d, closed: true }
          : d
    );
    assert.equal(isOpenNow(h, SAT_01H), "OPEN");
    assert.equal(isOpenNow(h, SAT_03H), "CLOSED");
  });

  it("closed vence is24h em dados contraditórios", () => {
    const h = stdWeek().map((d) =>
      d.day === "Segunda-feira" ? { ...d, closed: true, is24h: true } : d
    );
    assert.equal(isOpenNow(h, MON_10H), "CLOSED");
  });

  it("registos antigos sem flag mantêm o comportamento", () => {
    assert.equal(isOpenNow(stdWeek(), MON_10H), "OPEN");
    assert.equal(isOpenNow(stdWeek(), SUN_03H), "CLOSED");
  });
});

describe("24h — helpers de selo", () => {
  it("isOpen24hToday: só o dia 24h, não os outros", () => {
    const h = with24h(["Segunda-feira"]);
    assert.equal(isOpen24hToday(h, MON_03H), true);
    assert.equal(isOpen24hToday(h, MON_10H), true);
    assert.equal(isOpen24hToday(h, TUE_10H), false);
    assert.equal(isOpen24hToday(stdWeek(), MON_10H), false);
    assert.equal(isOpen24hToday(null, MON_10H), false);
  });

  it("isOpen24hToday: fechado vence 24h", () => {
    const h = stdWeek().map((d) =>
      d.day === "Segunda-feira" ? { ...d, closed: true, is24h: true } : d
    );
    assert.equal(isOpen24hToday(h, MON_10H), false);
  });

  it("isOpen24hAllWeek: exige os 7 dias, todos 24h", () => {
    assert.equal(isOpen24hAllWeek(allWeek24h()), true);
    const partial = with24h([
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ]);
    assert.equal(isOpen24hAllWeek(partial), false);
    const missing = allWeek24h().slice(0, 6);
    assert.equal(isOpen24hAllWeek(missing), false);
    assert.equal(isOpen24hAllWeek(stdWeek()), false);
    assert.equal(isOpen24hAllWeek([]), false);
    assert.equal(isOpen24hAllWeek(null), false);
  });
});

describe("24h — qualificação Preciso Hoje", () => {
  it("24h de madrugada qualifica (não é CLOSED)", () => {
    const b = { service_today: null, opening_hours: with24h(["Segunda-feira"]) };
    assert.equal(businessQualifiesNeedToday(b, MON_03H), true);
  });

  it("service_today=false exclui mesmo com 24h (explícito vence)", () => {
    const b = { service_today: false, opening_hours: allWeek24h() };
    assert.equal(businessQualifiesNeedToday(b, MON_03H), false);
  });
});

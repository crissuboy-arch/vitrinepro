/**
 * tests/stripe-lifecycle.test.ts — A10.6 FASE 2 (testes seguros)
 *
 * Simula o ciclo de vida da assinatura contra o handler REAL do webhook
 * (app/api/stripe/webhook/route.ts), sem tocar na Stripe nem no Supabase
 * de produção:
 *  - Supabase substituído por um mock PostgREST local (127.0.0.1) que
 *    regista todos os UPDATE/INSERT recebidos.
 *  - Eventos Stripe assinados localmente com um segredo de teste
 *    (HMAC v1, o mesmo esquema que constructEvent verifica).
 *  - Chaves Stripe falsas: nenhuma cobrança é possível.
 *
 * Cenários:
 *  A. checkout.session.completed  → plano ativo (pro via alias "premium"
 *     e business), ids Stripe guardados, evento marcado processado.
 *  B. invoice.payment_failed      → estado past_due, plano MANTIDO.
 *  C. subscription.updated (cancel_at_period_end) → acesso mantido
 *     (plano intacto, cancel_at registado); subscription.deleted →
 *     plano free, SEM tocar em `published` (Montra continua publicada).
 *  Negativos: assinatura inválida/ausente → 400; evento duplicado →
 *  ignorado (idempotência, sem updates repetidos).
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createHmac } from "node:crypto";

const WEBHOOK_SECRET = "whsec_fase2_local_test";
const BUSINESS_ID = "biz-fase2-1";

type Recorded = { method: string; table: string; body: Record<string, unknown> | null; query: string };
let recorded: Recorded[] = [];
const processedEvents = new Set<string>();
let lastEventAt: string | null = null;

let server: Server;
let POST: (req: Request) => Promise<Response>;

function resetRecorder() {
  recorded = [];
}

function businessPatches(): Record<string, unknown>[] {
  return recorded
    .filter((r) => r.method === "PATCH" && r.table === "businesses" && r.body)
    .map((r) => r.body as Record<string, unknown>);
}

function sign(payload: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

async function sendEvent(event: Record<string, unknown>): Promise<{ status: number; json: Record<string, unknown> }> {
  const payload = JSON.stringify(event);
  const req = new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": sign(payload) },
    body: payload,
  });
  const res = await POST(req);
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

const NOW = Math.floor(Date.now() / 1000);

before(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const table = url.pathname.split("/").pop() || "";
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body: Record<string, unknown> | null = null;
      try { body = raw ? (JSON.parse(raw) as Record<string, unknown>) : null; } catch { body = null; }
      recorded.push({ method: req.method || "", table, body, query: url.search });

      const wantsObject = (req.headers.accept || "").includes("pgrst.object");
      if (req.method === "GET" && table === "stripe_events") {
        const eq = url.searchParams.get("event_id") || "";
        const id = eq.replace(/^eq\./, "");
        if (processedEvents.has(id)) {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ event_id: id }));
        } else if (wantsObject) {
          // PostgREST: 0 linhas com Accept object → 406 (maybeSingle → null)
          res.writeHead(406, { "content-type": "application/json" });
          res.end(JSON.stringify({ code: "PGRST116", message: "no rows" }));
        } else {
          res.writeHead(200, { "content-type": "application/json" });
          res.end("[]");
        }
        return;
      }
      if (req.method === "GET" && table === "businesses") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ stripe_last_event_at: lastEventAt }));
        return;
      }
      if (req.method === "PATCH") {
        if (body && typeof body.stripe_last_event_at === "string") {
          lastEventAt = body.stripe_last_event_at;
        }
        res.writeHead(204);
        res.end();
        return;
      }
      if (req.method === "POST" && table === "stripe_events") {
        if (body && typeof body.event_id === "string") processedEvents.add(body.event_id);
        res.writeHead(201, { "content-type": "application/json" });
        res.end("{}");
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;

  process.env.STRIPE_SECRET_KEY = "sk_test_fase2_fake";
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-fase2";

  ({ POST } = await import("../app/api/stripe/webhook/route"));
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("FASE 2 — assinatura e ciclo de vida (simulado, sem cobranças)", () => {
  it("A1: checkout.session.completed (alias premium) → plano pro ativo", async () => {
    resetRecorder();
    const { status, json } = await sendEvent({
      id: "evt_fase2_a1",
      type: "checkout.session.completed",
      created: NOW - 100,
      data: {
        object: {
          id: "cs_test_fake",
          client_reference_id: BUSINESS_ID,
          metadata: { planId: "premium" },
          subscription: "sub_fase2_1",
          customer: "cus_fase2_1",
        },
      },
    });
    assert.equal(status, 200);
    assert.equal(json.received, true);
    const patches = businessPatches();
    const planPatch = patches.find((p) => p.plan === "pro");
    assert.ok(planPatch, "update com plan=pro (alias premium normalizado)");
    assert.equal(planPatch?.stripe_subscription_id, "sub_fase2_1");
    assert.equal(planPatch?.stripe_customer_id, "cus_fase2_1");
    assert.equal(planPatch?.stripe_subscription_status, "active");
    assert.equal(planPatch?.subscription_cancel_at, null);
    assert.ok(processedEvents.has("evt_fase2_a1"), "evento marcado processado (depois do efeito)");
  });

  it("A2: checkout.session.completed (business) → plano business ativo", async () => {
    resetRecorder();
    const { status } = await sendEvent({
      id: "evt_fase2_a2",
      type: "checkout.session.completed",
      created: NOW - 90,
      data: {
        object: {
          id: "cs_test_fake2",
          client_reference_id: "biz-fase2-2",
          metadata: { planId: "business" },
          subscription: "sub_fase2_2",
          customer: "cus_fase2_2",
        },
      },
    });
    assert.equal(status, 200);
    const planPatch = businessPatches().find((p) => p.plan === "business");
    assert.ok(planPatch, "update com plan=business");
    assert.equal(planPatch?.stripe_subscription_id, "sub_fase2_2");
  });

  it("B: invoice.payment_failed → past_due e plano MANTIDO", async () => {
    resetRecorder();
    const { status } = await sendEvent({
      id: "evt_fase2_b",
      type: "invoice.payment_failed",
      created: NOW - 80,
      data: { object: { id: "in_fake", subscription: "sub_fase2_1" } },
    });
    assert.equal(status, 200);
    const patches = businessPatches();
    assert.ok(patches.some((p) => p.stripe_subscription_status === "past_due"), "marca past_due");
    assert.ok(!patches.some((p) => "plan" in p), "nunca altera o plano num pagamento falhado");
  });

  it("C1: subscription.updated cancel_at_period_end → acesso mantido até ao fim do período", async () => {
    resetRecorder();
    const cancelAtEpoch = NOW + 30 * 24 * 3600;
    const { status } = await sendEvent({
      id: "evt_fase2_c1",
      type: "customer.subscription.updated",
      created: NOW - 50,
      data: {
        object: {
          id: "sub_fase2_1",
          status: "active",
          cancel_at_period_end: true,
          cancel_at: cancelAtEpoch,
          metadata: { businessId: BUSINESS_ID, planId: "business" },
        },
      },
    });
    assert.equal(status, 200);
    const patches = businessPatches();
    const cancelPatch = patches.find((p) => typeof p.subscription_cancel_at === "string");
    assert.ok(cancelPatch, "regista subscription_cancel_at");
    assert.equal(cancelPatch?.subscription_cancel_at, new Date(cancelAtEpoch * 1000).toISOString());
    assert.ok(!patches.some((p) => p.plan === "free"), "plano NÃO cai para free antes do fim do período");
  });

  it("C2: subscription.deleted (fim do período) → plano free, Montra continua publicada", async () => {
    resetRecorder();
    const { status } = await sendEvent({
      id: "evt_fase2_c2",
      type: "customer.subscription.deleted",
      created: NOW - 10,
      data: { object: { id: "sub_fase2_1", metadata: { businessId: BUSINESS_ID } } },
    });
    assert.equal(status, 200);
    const patches = businessPatches();
    const freePatch = patches.find((p) => p.plan === "free");
    assert.ok(freePatch, "downgrade para free no fim do período");
    assert.equal(freePatch?.stripe_subscription_id, null);
    assert.equal(freePatch?.stripe_subscription_status, "canceled");
    assert.ok(
      !patches.some((p) => "published" in p),
      "nenhum update toca em `published` — a Montra permanece publicada"
    );
  });

  it("Negativo: evento duplicado é ignorado (sem updates repetidos)", async () => {
    resetRecorder();
    const { status, json } = await sendEvent({
      id: "evt_fase2_a1",
      type: "checkout.session.completed",
      created: NOW - 100,
      data: {
        object: {
          id: "cs_test_fake",
          client_reference_id: BUSINESS_ID,
          metadata: { planId: "premium" },
          subscription: "sub_fase2_1",
          customer: "cus_fase2_1",
        },
      },
    });
    assert.equal(status, 200);
    assert.equal(json.duplicate, true);
    assert.equal(businessPatches().length, 0, "duplicado não reaplica efeitos");
  });

  it("Negativo: assinatura inválida → 400; header ausente → 400", async () => {
    const payload = JSON.stringify({ id: "evt_bad", type: "checkout.session.completed", data: { object: {} } });
    const bad = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=assinatura-falsa" },
        body: payload,
      })
    );
    assert.equal(bad.status, 400);
    const missing = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
      })
    );
    assert.equal(missing.status, 400);
  });
});

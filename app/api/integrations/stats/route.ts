import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  PLATFORM_NAME,
  INTEGRATION_CONTRACT_VERSION,
  requireIntegrationKey,
} from "@/lib/integrations/athena";

export const runtime = "nodejs";

/**
 * GET /api/integrations/stats
 *
 * Estatísticas agregadas da plataforma para a Athena Control.
 *
 * SEGURANÇA:
 * - Exige a chave de integração (`Authorization: Bearer <ATHENA_API_KEY>`);
 *   401 sem chave ou com chave inválida.
 * - SOMENTE LEITURA: nenhum método de escrita existe nesta rota.
 * - Retorna APENAS agregados (contagens). Nenhum dado individual de
 *   loja, produto ou cliente é exposto — isolamento entre clientes
 *   garantido por construção.
 * - Usa o service_role existente, só no servidor (padrão de /api/admin/stats).
 * - Rate limit: 60 pedidos/min por IP.
 * - Não altera autenticação de clientes, Supabase, RLS ou lojas.
 */
const STATS_LIMIT = 60;
const STATS_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const auth = requireIntegrationKey(request);
  if (!auth.ok) return auth.response!;

  const rl = rateLimit(`integrations:stats:${getClientIp(request)}`, STATS_LIMIT, STATS_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Limite excedido" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  const svc = getServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });
  }

  try {
    const [bizRes, prodRes] = await Promise.all([
      svc.from("businesses").select("id, published, plan"),
      svc.from("products").select("id", { count: "exact", head: true }),
    ]);
    if (bizRes.error) throw bizRes.error;
    if (prodRes.error) throw prodRes.error;

    const bizs = bizRes.data || [];
    // "Ativa" = montra publicada (mesmo critério do painel admin).
    let active = 0;
    const plans: Record<string, number> = { free: 0, pro: 0, business: 0, other: 0 };
    for (const b of bizs) {
      if (b.published) active++;
      const p = String(b.plan || "free").toLowerCase();
      if (p in plans) plans[p]++;
      else plans.other++;
    }

    return NextResponse.json(
      {
        platform: PLATFORM_NAME,
        contract: INTEGRATION_CONTRACT_VERSION,
        stores: {
          total: bizs.length,
          active,
          inactive: bizs.length - active,
        },
        products: {
          total: prodRes.count ?? 0,
        },
        plans,
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    // Mensagem genérica: detalhes do banco nunca vazam para o chamador.
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

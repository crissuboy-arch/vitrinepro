/**
 * app/api/portal/sync/route.ts — estado e sincronização manual.
 *
 * GET  — última sincronização registada + contagens atuais do feed.
 * POST — "Atualizar agora": lê o feed do Portal, valida e regista a
 *        corrida em portal_sync_runs (sucesso ou erro, sempre).
 * Acesso: admin ou proprietária da montra Portal.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAuthenticatedUserId } from "@/lib/quotes-server";
import { fetchPortalFeed } from "@/lib/portal";
import { getLatestSyncRun, getPortalBusiness, runPortalSync } from "@/lib/portal-server";

export const runtime = "nodejs";

async function canManage(request: Request): Promise<boolean> {
  const admin = await requireAdmin();
  if (admin.ok) return true;
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return false;
  const business = await getPortalBusiness();
  return !!business && business.userId === userId;
}

export async function GET(request: Request) {
  if (!(await canManage(request))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const [lastRun, feed] = await Promise.all([getLatestSyncRun(), fetchPortalFeed()]);
  return NextResponse.json({
    ready: true,
    lastRun,
    feed: { ok: !feed.error, error: feed.error, total: feed.products.length, fetchedAt: feed.fetchedAt },
  });
}

export async function POST(request: Request) {
  if (!(await canManage(request))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { run, feed } = await runPortalSync();
  return NextResponse.json({
    ready: true,
    run,
    feed: { ok: !feed.error, error: feed.error, total: feed.products.length },
  });
}

/**
 * app/api/admin/businesses/[id]/route.ts — ADMIN-1
 *
 * GET   → detalhes de uma Montra (inclui owner email quando possível)
 * PATCH → edita campos permitidos (inclui `published` canónico)
 *
 * Auth: requireAdmin() (401/403). Service_role SÓ no servidor.
 * DELETE: fora do MVP (sem fluxo seguro documentado).
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { togglePublishPatch } from "@/lib/published-at";
import { resolveAdminProPatch } from "@/lib/admin-pro";

export const runtime = "nodejs";

// Campos editáveis via admin (whitelist — nunca user_id por aqui).
const EDITABLE = [
  "name",
  "slug",
  "description",
  "city",
  "category",
  "category_id",
  "city_id",
  "address",
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "website",
  "published",
  "show_in_explore",
  "admin_pro_grant",
  "is_featured",
  "plan",
  "logo_url",
  "cover_url",
  "opening_hours",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const { data: biz, error } = await svc.from("businesses").select("*").eq("id", id).single();
    if (error) throw error;
    if (!biz) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    // Owner email (server-side, nunca exposto publicamente).
    let owner_email: string | null = null;
    try {
      const { data: u } = await svc.auth.admin.getUserById(biz.user_id);
      owner_email = u?.user?.email ?? null;
    } catch {
      /* ignora */
    }

    adminLog("businesses.get", { admin: auth.email, business_id: id });
    return NextResponse.json({ business: biz, owner_email });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    for (const k of EDITABLE) {
      if (k in body) patch[k] = body[k];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
    }
    // Nunca permitir troca de slug para vazio.
    if ("slug" in patch && !String(patch.slug).trim()) {
      return NextResponse.json({ error: "Slug não pode ser vazio" }, { status: 400 });
    }

    // Pro administrativo (correção Cantinho da Lu, 2026-10-28): resolve a
    // semântica da concessão com a linha atual (conceder sem plan → pro;
    // rebaixar para free com concessão ativa → rejeitado sem revogar).
    // Pré-migration a leitura da flag falha e a regra degrada-se para o
    // comportamento antigo (sem concessão); o update da coluna falharia
    // nesse caso, pelo que a concessão só é aceite pós-migration.
    const updateFields: Record<string, unknown> = {
      ...patch,
      updated_at: new Date().toISOString(),
    };
    if ("admin_pro_grant" in patch || ("plan" in patch && patch.plan === "free")) {
      try {
        const { data: current } = await svc
          .from("businesses")
          .select("plan, admin_pro_grant")
          .eq("id", id)
          .single();
        if (current) {
          const resolved = resolveAdminProPatch(
            { plan: current.plan, admin_pro_grant: current.admin_pro_grant },
            {
              admin_pro_grant:
                "admin_pro_grant" in patch ? (patch.admin_pro_grant as boolean) : undefined,
              plan: "plan" in patch ? String(patch.plan) : undefined,
            },
            new Date().toISOString()
          );
          if (resolved.error) {
            return NextResponse.json({ error: resolved.error }, { status: 400 });
          }
          Object.assign(updateFields, resolved.apply);
        }
      } catch {
        // Sem leitura da concessão (ex.: pré-migration) — prossegue com o
        // patch pedido; a escrita da coluna falhará com erro explícito se
        // a coluna não existir, em vez de fingir sucesso.
      }
    }
    if (patch.published === true) {
      try {
        const { data: current } = await svc
          .from("businesses")
          .select("published, published_at")
          .eq("id", id)
          .single();
        if (current) {
          const stamp = togglePublishPatch(
            { published: current.published, published_at: current.published_at },
            true,
            new Date().toISOString()
          );
          if (stamp.published_at) updateFields.published_at = stamp.published_at;
        }
      } catch {
        // Sem carimbo (ver comentário acima) — a publicação prossegue.
      }
    }

    // O select de retorno só inclui admin_pro_grant quando o PATCH a toca:
    // pré-migration, incluí-la em qualquer PATCH quebraria todas as edições
    // admin (a coluna ainda não existe). O PATCH de concessão pré-migration
    // falha no próprio update, com erro explícito, em vez de fingir sucesso.
    const returning =
      "admin_pro_grant" in patch
        ? "id, slug, published, plan, admin_pro_grant"
        : "id, slug, published";
    const { data, error } = await svc
      .from("businesses")
      .update(updateFields)
      .eq("id", id)
      .select(returning)
      .single();
    if (error) throw error;

    adminLog("businesses.patch", {
      admin: auth.email,
      business_id: id,
      fields: Object.keys(patch),
    });
    return NextResponse.json({ business: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

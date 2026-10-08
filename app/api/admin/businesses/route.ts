/**
 * app/api/admin/businesses/route.ts — ADMIN-1
 *
 * GET  → lista TODAS as Montras (paginado + busca)
 * POST → cria Montra administrativamente
 *
 * Auth: requireAdmin() (401/403). Service_role SÓ no servidor.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/utils";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

/** GET /api/admin/businesses?q=&page= — lista todas as Montras. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    let query = svc
      .from("businesses")
      .select("id, user_id, name, slug, city, category, published, plan, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) {
      // Busca por nome, slug, cidade ou user_id/owner.
      // I4-A (A10.2): user_id.eq só com UUID válido — texto livre em
      // coluna UUID quebra o PostgREST ("invalid input syntax for type uuid").
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      const orFilter = isUuid
        ? `name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%,user_id.eq.${q}`
        : `name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%`;
      query = query.or(orFilter);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    adminLog("businesses.list", { admin: auth.email, q: q || null, page, count });
    return NextResponse.json({ businesses: data, page, pageSize: PAGE_SIZE, total: count });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao listar" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/businesses — cria Montra administrativamente.
 *
 * Ownership: se `owner_email` corresponder a um usuário existente no Auth,
 * a Montra é criada para esse user_id. Caso contrário, SEM inventar usuário:
 * cria com o user_id da própria admin e documenta como "sob operação
 * administrativa aguardando transferência" (campo `notes` interno, se existir,
 * senão apenas no audit log).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

    let ownerId: string | null = null;
    let ownerNote: string | null = null;

    if (body.owner_email) {
      // Procura usuário existente pelo email (service_role pode listar).
      const { data: users } = await svc.auth.admin.listUsers();
      const found = (users?.users || []).find(
        (u) => u.email?.toLowerCase() === String(body.owner_email).toLowerCase()
      );
      if (found) {
        ownerId = found.id;
      } else {
        // NÃO inventa usuário. Documenta como aguardando transferência.
        ownerNote = `aguardando transferência para ${body.owner_email} (usuário ainda não cadastrado)`;
      }
    }
    // Fallback: ownership da própria admin (operação administrativa).
    if (!ownerId) ownerId = auth.userId!;

    const slug = body.slug?.trim() || (await generateSlug(name));

    const { data, error } = await svc
      .from("businesses")
      .insert({
        user_id: ownerId,
        name,
        slug,
        city: body.city || null,
        category: body.category || null,
        description: body.description || null,
        published: body.published === true,
      })
      .select("id, slug")
      .single();
    if (error) throw error;

    adminLog("businesses.create", {
      admin: auth.email,
      business_id: data.id,
      slug: data.slug,
      owner_id: ownerId,
      owner_note: ownerNote,
    });
    return NextResponse.json({ business: data, owner_note: ownerNote }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao criar" },
      { status: 500 }
    );
  }
}

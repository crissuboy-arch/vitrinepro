/**
 * /api/admin/communities — gestão de comunidades pelo admin.
 * GET: todas (incl. inativas) com contagens.
 * POST: criar comunidade nova sem tocar em código.
 * PATCH: editar nome/descrição/ícone/cor ou ativar/desativar.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { communityCounts, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const client = getServiceClient();
  if (!client) return communitiesNotReadyResponse();
  try {
    const { data, error } = await client
      .from("social_communities")
      .select("id, slug, name, icon, color, description, is_active, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const communities = await Promise.all(
      (data ?? []).map(async (c) => ({ ...c, counts: await communityCounts(client, c.id as string) }))
    );
    return NextResponse.json({ communities });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar as comunidades." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const client = getServiceClient();
  if (!client) return communitiesNotReadyResponse();
  let body: { name?: unknown; slug?: unknown; icon?: unknown; color?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
  const slug = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug : name);
  if (!slug) return NextResponse.json({ error: "Slug inválido." }, { status: 400 });
  try {
    const { data, error } = await client
      .from("social_communities")
      .insert({
        slug,
        name,
        icon: typeof body.icon === "string" ? body.icon.slice(0, 8) : null,
        color: typeof body.color === "string" ? body.color.slice(0, 16) : null,
        description: typeof body.description === "string" ? body.description.trim().slice(0, 300) || null : null,
        created_by: auth.email,
      })
      .select("id, slug, name, icon, color, description, is_active, created_at")
      .single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Já existe uma comunidade com este slug." }, { status: 409 });
      }
      throw error;
    }
    adminLog("community.create", { by: auth.email, slug });
    return NextResponse.json({ community: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível criar a comunidade." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const client = getServiceClient();
  if (!client) return communitiesNotReadyResponse();
  let body: { id?: unknown; name?: unknown; description?: unknown; icon?: unknown; color?: unknown; is_active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Comunidade em falta." }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 80);
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 300) || null;
  if (typeof body.icon === "string") patch.icon = body.icon.slice(0, 8) || null;
  if (typeof body.color === "string") patch.color = body.color.slice(0, 16) || null;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  try {
    const { data, error } = await client
      .from("social_communities")
      .update(patch)
      .eq("id", body.id)
      .select("id, slug, name, is_active")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Comunidade não encontrada." }, { status: 404 });
    adminLog("community.update", { by: auth.email, communityId: body.id, fields: Object.keys(patch) });
    return NextResponse.json({ community: data });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }
}

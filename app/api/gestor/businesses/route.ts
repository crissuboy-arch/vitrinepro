/**
 * /api/gestor/businesses — montras geridas pela gestora.
 * GET: lista (só as atribuídas). POST: criar montra nova em RASCUNHO
 * (published=false), com atribuição automática à criadora.
 *
 * Dono técnico da montra criada: a conta da própria gestora, quando
 * vinculada; senão a conta proprietária da plataforma (a gestão fica
 * delegada e a transferência para o cliente usa o handover existente).
 */
import { NextResponse } from "next/server";
import { requireGestor, gestorAudit, getPlatformOwnerUserId } from "@/lib/gestor-auth";
import { getAdminEmails } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/utils";

const BUSINESS_FIELDS =
  "id, name, slug, description, category, city, country, address, phone, whatsapp, email, website, instagram, logo_url, cover_url, published, published_at, plan, created_at";

export async function GET(req: Request) {
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc, gestor } = auth;
  const { data: grants, error } = await svc!
    .from("business_managers")
    .select("business_id")
    .eq("manager_id", gestor!.managerId);
  if (error) return NextResponse.json({ error: "Não foi possível carregar as montras." }, { status: 500 });
  const ids = (grants ?? []).map((g) => g.business_id as string);
  if (ids.length === 0) return NextResponse.json({ businesses: [] });
  const { data, error: bErr } = await svc!
    .from("businesses")
    .select(BUSINESS_FIELDS)
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (bErr) return NextResponse.json({ error: "Não foi possível carregar as montras." }, { status: 500 });
  return NextResponse.json({ businesses: data ?? [] });
}

interface CreateBody {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  city?: unknown;
  address?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  website?: unknown;
  instagram?: unknown;
  logo_url?: unknown;
  cover_url?: unknown;
}

function str(v: unknown, max = 300): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function POST(req: Request) {
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc, gestor } = auth;
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const name = str(body.name, 120);
  if (!name) return NextResponse.json({ error: "O nome da montra é obrigatório." }, { status: 400 });

  // Dono técnico: conta da gestora se vinculada; senão a proprietária.
  let ownerUserId = gestor!.userId;
  if (!ownerUserId) {
    ownerUserId = await getPlatformOwnerUserId(svc!, getAdminEmails()[0]);
  }
  if (!ownerUserId) {
    return NextResponse.json(
      { error: "Não foi possível determinar a conta dona da montra. Vincula primeiro a conta da gestora (aceitar o convite com sessão iniciada)." },
      { status: 409 }
    );
  }

  // Slug único (generateSlug já inclui sufixo; confirmamos mesmo assim).
  let slug = await generateSlug(name);
  const { data: clash } = await svc!.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await svc!
    .from("businesses")
    .insert({
      user_id: ownerUserId,
      name,
      slug,
      description: str(body.description, 2000),
      category: str(body.category, 80),
      city: str(body.city, 80),
      country: "Portugal",
      address: str(body.address, 300),
      phone: str(body.phone, 40),
      whatsapp: str(body.whatsapp, 40),
      email: str(body.email, 160),
      website: str(body.website, 300),
      instagram: str(body.instagram, 160),
      logo_url: str(body.logo_url, 600),
      cover_url: str(body.cover_url, 600),
      published: false,
    })
    .select(BUSINESS_FIELDS)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Não foi possível criar a montra." }, { status: 500 });
  }
  const { error: gErr } = await svc!
    .from("business_managers")
    .insert({ business_id: data.id, manager_id: gestor!.managerId, granted_by: gestor!.email });
  if (gErr) {
    return NextResponse.json({ error: "Montra criada, mas a atribuição à gestora falhou — pede à proprietária para atribuir manualmente." }, { status: 500 });
  }
  await gestorAudit(svc!, {
    managerId: gestor!.managerId,
    email: gestor!.email,
    action: "business.create",
    businessId: data.id,
    details: { name, via: gestor!.via },
  });
  return NextResponse.json({ business: data }, { status: 201 });
}

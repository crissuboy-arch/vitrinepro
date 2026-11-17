/**
 * /api/communities/profile — perfil público do membro (o próprio).
 * GET: perfil atual (ou null se ainda não o configurou).
 * PUT: guardar nome público, fotografia (URL do bucket community-media),
 *      biografia e cidade. Emails/contactos nunca passam por aqui.
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, getProfile, validateProfileInput, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export const runtime = "nodejs";

export async function GET() {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    const profile = await getProfile(client, user.id);
    return NextResponse.json({
      profile: profile ?? { userId: user.id, displayName: user.displayName, avatarUrl: null, bio: null, city: null },
      isNew: !profile,
    });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar o perfil." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    const validated = validateProfileInput(body, user.displayName);
    if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
    const { error } = await client.from("community_profiles").upsert(
      {
        user_id: user.id,
        display_name: validated.value.displayName,
        avatar_url: validated.value.avatarUrl,
        bio: validated.value.bio,
        city: validated.value.city,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    const profile = await getProfile(client, user.id);
    return NextResponse.json({ profile });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível guardar o perfil." }, { status: 500 });
  }
}

/**
 * app/api/promo-video/upload-url/route.ts — URL assinada p/ upload do vídeo
 * promocional da Montra.
 *
 * Porquê esta rota: o upload direto do browser p/ o Storage é rejeitado
 * pela RLS (vp_storage_owner_insert) mesmo p/ a dona da Montra, com bucket
 * e política confirmados no projeto de produção — a avaliação da RLS no
 * INSERT direto falha por um motivo não observável do browser. Em vez de
 * enfraquecer a RLS, o upload passa por aqui:
 * - o servidor valida a sessão (cookies) e a propriedade da Montra
 *   (businesses.user_id === user.id, só leitura, via service_role);
 * - emite um token de uso único p/ UM caminho exato
 *   {businessId}/{timestamp}-{rand}.{ext} no bucket vitrine-videos;
 * - o browser envia o ficheiro DIRETO p/ o Supabase (sem passar pelo
 *   Vercel, logo sem o limite de 4,5 MB das functions).
 * Segurança preservada: RLS do Storage intocada; service_role NUNCA vai
 * ao browser (só aqui, no servidor, como nas restantes rotas); sem token
 * não há upload; o caminho é sempre da própria Montra; a secção só
 * aparece na Montra depois do "Guardar vídeo promocional" (que continua
 * gated pela RLS de businesses + verificação do painel). O limite de
 * 50 MB e os tipos permitidos continuam a ser impostos pelo bucket.
 */
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET = "vitrine-videos";
const ALLOWED_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    // 1. Utilizador autenticado (JWT validado no servidor).
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || "");
    const fileType = String(body.fileType || "");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        businessId
      )
    ) {
      return NextResponse.json(
        { error: "Montra inválida." },
        { status: 400 }
      );
    }
    const ext = ALLOWED_EXT[fileType];
    if (!ext) {
      return NextResponse.json(
        { error: "Tipo de ficheiro não permitido. Usa MP4, WEBM ou MOV." },
        { status: 400 }
      );
    }

    // 2. Propriedade da Montra (nunca por parâmetro do cliente: o user vem
    // da sessão; o businessId só diz QUAL a Montra).
    const admin = adminClient();
    const { data: biz, error: bizErr } = await admin
      .from("businesses")
      .select("id, user_id")
      .eq("id", businessId)
      .maybeSingle();
    if (bizErr || !biz || biz.user_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão sobre esta Montra." },
        { status: 403 }
      );
    }

    // 3. Token de uso único p/ um caminho exato da própria Montra.
    const path = `${businessId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${ext}`;
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json(
        {
          error: `Não foi possível preparar o upload: ${
            error?.message || "erro desconhecido"
          }`,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ path: data.path, token: data.token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erro interno: ${msg}` },
      { status: 500 }
    );
  }
}

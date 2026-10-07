/**
 * app/api/account/delete/route.ts — Exclusão de conta (server-side, segura).
 *
 * Estratégia (auditoria prévia, sem migration):
 * - Só o próprio utilizador autenticado pode excluir a própria conta
 *   (user.id do JWT server-side === alvo; nunca por parâmetro).
 * - Confirmação forte: o corpo precisa trazer o e-mail exato da conta.
 * - Só contas com 0 businesses. Comerciante (≥1) recebe 403 com orientação
 *   — sem destruição comercial automática.
 * - service_role NUNCA vai ao browser: só aqui, no servidor.
 * - Dados dependentes: profiles, collections, collection_items e favorites
 *   têm ON DELETE CASCADE a partir de auth.users → nenhum órfão, sem
 *   migration adicional.
 */
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

    // 2. Confirmação forte: e-mail exato.
    const body = await req.json().catch(() => ({}));
    const confirmEmail = String(body.confirmEmail || "").trim().toLowerCase();
    if (!confirmEmail || confirmEmail !== (user.email || "").toLowerCase()) {
      return NextResponse.json(
        { error: "Confirmação inválida. Escreve o teu e-mail exatamente." },
        { status: 400 }
      );
    }

    const admin = adminClient();

    // 3. Bloqueia comerciante (≥1 business) — sem destruição automática.
    const { count: bizCount, error: bizErr } = await admin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (bizErr) {
      return NextResponse.json(
        { error: "Não foi possível verificar a conta. Tenta novamente." },
        { status: 500 }
      );
    }
    if ((bizCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "A tua conta tem Montras ativas. Remove ou transfere as tuas Montras antes de excluir a conta.",
        },
        { status: 403 }
      );
    }

    // 4. Exclui o utilizador auth → CASCADE apaga profiles, collections,
    //    collection_items e favorites. Sem órfãos, sem migration.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return NextResponse.json(
        { error: "Não foi possível excluir a conta. Tenta novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível excluir a conta. Tenta novamente." },
      { status: 500 }
    );
  }
}

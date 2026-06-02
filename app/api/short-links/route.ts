import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Nenhum negócio associado a este utilizador." },
        { status: 404 }
      );
    }

    // Fetch short link
    const { data: link, error: linkError } = await supabase
      .from("short_links")
      .select("id, short_code, clicks")
      .eq("business_id", business.id)
      .maybeSingle();

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    return NextResponse.json(link);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Nenhum negócio associado a este utilizador." },
        { status: 404 }
      );
    }

    // Verify plan is 'business'
    if (business.plan !== "business") {
      return NextResponse.json(
        { error: "Funcionalidade disponível apenas no plano Business." },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const { short_code } = body;

    if (!short_code) {
      return NextResponse.json(
        { error: "O código do link curto é obrigatório." },
        { status: 400 }
      );
    }

    // Regex validation: only lowercase letters, numbers, and hyphens (3 to 20 characters)
    const codeRegex = /^[a-z0-9-]{3,20}$/;
    if (!codeRegex.test(short_code)) {
      return NextResponse.json(
        {
          error:
            "Código inválido. Deve conter apenas letras minúsculas, números e hífens, e ter entre 3 e 20 caracteres.",
        },
        { status: 400 }
      );
    }

    // Verify if short_code is already in use by another business
    const { data: existingLink, error: checkError } = await supabase
      .from("short_links")
      .select("id, business_id")
      .eq("short_code", short_code)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingLink && existingLink.business_id !== business.id) {
      return NextResponse.json(
        { error: "Este código de link curto já está em uso por outro negócio." },
        { status: 409 }
      );
    }

    // Check if the current business already has a short link (to update or insert)
    const { data: currentLink } = await supabase
      .from("short_links")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();

    if (currentLink) {
      // Update existing
      const { error: updateError } = await supabase
        .from("short_links")
        .update({ short_code })
        .eq("business_id", business.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("short_links")
        .insert({ business_id: business.id, short_code });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, short_code });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

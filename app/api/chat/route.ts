/**
 * app/api/chat/route.ts — A2.1 (hardened)
 *
 * BEFORE: open paid Anthropic proxy — no auth, no rate limit, no payload
 * validation, and the business context (name, whatsapp, products, prices)
 * came from the CLIENT, so anyone could forge it and burn API budget.
 *
 * AFTER:
 *  - Server-side sliding-window rate limit (per IP).
 *  - Strict payload validation + size caps.
 *  - Business context resolved SERVER-SIDE from Supabase (published only).
 *    Client-sent business data is NEVER trusted.
 *  - Chatbot entitlement validated server-side against the business plan
 *    (Pro/Business). Anonymous visitors keep working — no login required —
 *    but only within the business's quota/entitlement and the rate limit.
 *  - Anthropic errors never leak stack traces or secrets to the client.
 *  - Anthropic stays the provider (no OpenAI migration here).
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, __resetRateLimitsForTests } from "@/lib/rate-limit";
import { PLANS, planHasChatbot } from "@/lib/plans";
import {
  isValidMessage,
  sanitizeHistory,
  isValidBusinessRef,
  type ChatMessage,
} from "@/lib/chat-validation";

export const runtime = "nodejs";

// Abuse brakes (per IP, per single instance — see lib/rate-limit.ts)
const CHAT_LIMIT = 20; // messages
const CHAT_WINDOW_MS = 60_000;

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface ProductRow {
  name: string;
  price?: number | null;
  description?: string | null;
}

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  opening_hours?: OpeningHour[] | null;
  plan?: string | null;
  published?: boolean | null;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function platformSystemPrompt(): string {
  const free = PLANS.free;
  const pro = PLANS.pro;
  const business = PLANS.business;
  return `Você é o assistente virtual inteligente e atencioso da plataforma "VitrinePro".
A sua principal tarefa é responder a dúvidas de visitantes sobre como o VitrinePro funciona.

Aqui estão os detalhes do VitrinePro para basear as suas respostas:
- O que é: Uma plataforma e diretório de mini-sites profissionais para negócios locais em Portugal, criada para que profissionais e empresas sejam encontrados por novos clientes sem precisarem de programadores ou orçamentos caros de marketing.
- Planos e Preços:
  1. Plano ${free.name}: ${free.priceLabel}/mês. Inclui vitrine básica online, 3 produtos no catálogo, links de WhatsApp/redes sociais, inclusão no diretório e link curto partilhável.
  2. Plano ${pro.name}: ${pro.priceLabel}/mês. Inclui produtos ilimitados, assistente virtual (Chatbot IA) 24h por dia, destaque no diretório de buscas, analytics de visitas, otimização de SEO para o Google, domínio próprio personalizado, remoção do logo VitrinePro e suporte prioritário.
  3. Plano ${business.name}: ${business.priceLabel}/mês. Inclui loja online completa com pagamentos integrados, chatbot de IA avançado, 1º lugar garantido nas pesquisas do diretório, relatórios mensais e multi-idioma.
- Como cadastrar o negócio: Clicar em "Criar minha vitrine grátis" no topo, preencher os dados (nome, fotos, contactos, WhatsApp) e publicar. Fica online em menos de 5 minutos!
- WhatsApp: Clientes navegam no catálogo e contactam diretamente pelo WhatsApp do dono. A VitrinePro não cobra quaisquer comissões sobre as vendas!
- Site próprio: Não é necessário ter site próprio ou alojamento, pois a VitrinePro fornece o mini-site pronto e alojado.
- Para quem serve: Cafés, manicures, esteticistas, restaurantes, tatuadores, pintores, eletricistas, lojas e infoprodutores.
- Como fazer upgrade: No Dashboard do utilizador, clicar no botão "Upgrade".
- Cancelamento: Sem contratos. Cancelamento ou mudança de plano a qualquer momento no painel.

Regras de conduta:
1. Responda em Português de Portugal de forma natural, amigável e profissional.
2. Seja conciso e direto nas respostas.
3. Se o utilizador perguntar algo que não saiba, responda educadamente e convide a falar no WhatsApp.
4. Incentive o utilizador a criar a sua conta grátis.`;
}

function businessSystemPrompt(b: BusinessRow, products: ProductRow[]): string {
  const businessName = b.name || "o negócio";
  const whatsapp = b.whatsapp || "não disponível";
  const phone = b.phone || "não disponível";
  const email = b.email || "não disponível";
  const address = b.address || "não disponível";
  const openingHours = b.opening_hours || [];
  return `Você é o assistente virtual inteligente e atencioso do negócio "${businessName}".
A sua principal tarefa é responder a perguntas de potenciais clientes sobre este negócio, de forma profissional, simpática e objetiva.

Aqui está o contexto atualizado do negócio para basear as suas respostas:
- Nome Comercial: ${businessName}
- WhatsApp de Contacto: ${whatsapp}
- Telefone Comercial: ${phone}
- Morada/Endereço físico: ${address}
- E-mail: ${email}
- Horários de Funcionamento: ${JSON.stringify(openingHours)}
- Catálogo de Produtos e Serviços: ${JSON.stringify(products)}

Regras de conduta:
1. Responda em Português de Portugal de forma amigável, clara e objetiva.
2. Seja conciso e direto. Não invente detalhes que não constam no contexto.
3. Se o utilizador perguntar por preços ou comprar algo, apresente os produtos com preços do catálogo e incentive o contacto direto pelo WhatsApp (${whatsapp}) para fechar o pedido.
4. Se a pergunta for sobre algo que não consta no contexto ou que você não saiba: responda de forma útil e convide a falar no WhatsApp.
5. Mantenha um tom acolhedor de quem deseja ajudar o cliente.`;
}

/** Offline fallback when ANTHROPIC_API_KEY is not configured. */
function ruleBasedReply(
  message: string,
  business: BusinessRow | null,
  products: ProductRow[]
): string {
  const cleanMsg = message.toLowerCase();
  if (!business) {
    const pro = PLANS.pro;
    const biz = PLANS.business;
    if (cleanMsg.includes("quanto custa") || cleanMsg.includes("preço") || cleanMsg.includes("plano")) {
      return `Temos três planos:\n\n1. **Grátis**: ${PLANS.free.priceLabel}/mês\n2. **${pro.name}**: ${pro.priceLabel}/mês - Chatbot IA 24h, produtos ilimitados, domínio próprio e SEO.\n3. **${biz.name}**: ${biz.priceLabel}/mês - Loja online com pagamentos integrados.\n\nPode começar grátis e fazer upgrade quando quiser!`;
    }
    if (cleanMsg.includes("como funciona") || cleanMsg.includes("o que é")) {
      return "A VitrinePro é uma plataforma e diretório que permite a negócios locais em Portugal criarem um mini-site profissional em menos de 5 minutos.";
    }
    return "Posso ajudar com dúvidas sobre a plataforma VitrinePro: planos, como criar a sua vitrine ou como funciona o diretório.";
  }

  const whatsapp = business.whatsapp || "";
  const waDigits = whatsapp.replace(/\D/g, "");
  const openingHours = business.opening_hours || [];

  if (cleanMsg.includes("horário") || cleanMsg.includes("aberto") || cleanMsg.includes("funcionamento")) {
    if (openingHours.length > 0) {
      const hoursText = openingHours
        .map((h) => `${h.day}: ${h.closed ? "Fechado" : `${h.open} - ${h.close}`}`)
        .join("\n");
      return `O nosso horário de funcionamento:\n${hoursText}`;
    }
    return `De momento não temos os horários registados. Confirme connosco via WhatsApp: ${whatsapp}.`;
  }
  if (cleanMsg.includes("produto") || cleanMsg.includes("preço") || cleanMsg.includes("serviço") || cleanMsg.includes("vende")) {
    if (products.length > 0) {
      const productsText = products
        .map((p) => `- ${p.name}${p.price ? ` (€${Number(p.price).toFixed(2)})` : ""}${p.description ? `: ${p.description}` : ""}`)
        .join("\n");
      return `Os nossos produtos e serviços:\n${productsText}${waDigits ? `\n\nPara pedir, fale connosco no WhatsApp: https://wa.me/${waDigits}` : ""}`;
    }
    return "Pode consultar os nossos produtos diretamente na nossa página.";
  }
  if (cleanMsg.includes("morada") || cleanMsg.includes("onde") || cleanMsg.includes("endereço") || cleanMsg.includes("local")) {
    return `Estamos em: ${business.address || "consulte a nossa página"}.`;
  }
  return "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?";
}

async function callAnthropic(system: string, history: ChatMessage[], message: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system,
        messages: [...history, { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      // Log status only — never the body (may contain keyed error detail).
      console.error(`[CHAT API] Anthropic respondeu com status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" && text.length > 0 ? text : null;
  } catch (err) {
    console.error("[CHAT API] Falha ao contactar Anthropic:", err instanceof Error ? err.message : "desconhecido");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  // 1. Rate limit — paid endpoint, anonymous visitors allowed.
  const ip = getClientIp(request);
  const rl = rateLimit(`chat:${ip}`, CHAT_LIMIT, CHAT_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { reply: "Estou a receber muitas mensagens de momento. Tente novamente dentro de um minuto." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // 2. Parse + validate payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ reply: "Pedido inválido." }, { status: 400 });
  }
  const { message, history, businessId, businessSlug, context } = body as Record<string, unknown>;

  if (!isValidMessage(message)) {
    return NextResponse.json({ reply: "Mensagem inválida." }, { status: 400 });
  }
  const cleanHistory = sanitizeHistory(history);
  if (cleanHistory === null) {
    return NextResponse.json({ reply: "Histórico inválido." }, { status: 400 });
  }

  const isPlatform = context === "platform";
  const hasBusinessRef =
    isValidBusinessRef(businessId, 80) || isValidBusinessRef(businessSlug, 120);

  if (!isPlatform && !hasBusinessRef) {
    // NOTE: legacy clients that sent the full `business` object are no longer
    // accepted — context must be resolved server-side.
    return NextResponse.json(
      { reply: "Sessão de chat expirada. Por favor, recarregue a página." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error("[CHAT API] Supabase não configurado");
    return NextResponse.json(
      { reply: "Assistente temporariamente indisponível." },
      { status: 503 }
    );
  }

  // 3. Resolve context server-side. NEVER trust client-sent business data.
  let business: BusinessRow | null = null;
  let products: ProductRow[] = [];

  if (!isPlatform) {
    let query = supabase
      .from("businesses")
      .select("id, name, slug, whatsapp, phone, email, address, opening_hours, plan, published")
      .eq("published", true)
      .limit(1);
    if (typeof businessId === "string" && businessId) query = query.eq("id", businessId);
    else query = query.eq("slug", businessSlug as string);

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return NextResponse.json({ reply: "Negócio não encontrado." }, { status: 404 });
    }
    business = data as BusinessRow;

    // 4. Entitlement validated server-side: chatbot is a Pro/Business benefit.
    if (!planHasChatbot(business.plan)) {
      return NextResponse.json(
        {
          reply:
            "O assistente virtual está disponível nos planos Pro e Business. " +
            "Fale connosco pelo WhatsApp para saber mais!",
        },
        { status: 403 }
      );
    }

    const { data: prodData } = await supabase
      .from("products")
      .select("name, price, description")
      .eq("business_id", business.id)
      .limit(50);
    products = (prodData || []) as ProductRow[];
  }

  const system = isPlatform ? platformSystemPrompt() : businessSystemPrompt(business as BusinessRow, products);

  // 5. Provider call (Anthropic stays; safe errors only).
  const reply = await callAnthropic(system, cleanHistory, (message as string).trim());
  if (reply) {
    return NextResponse.json({ reply });
  }

  // 6. Graceful degradation: rule-based fallback or polite error.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: ruleBasedReply((message as string).trim(), business, products) });
  }
  return NextResponse.json(
    { reply: "Não consegui responder agora. Tente novamente dentro de instantes." },
    { status: 502 }
  );
}

// Test-only hook (not part of the public API surface).
export function __resetChatRateLimitsForTests() {
  __resetRateLimitsForTests();
}

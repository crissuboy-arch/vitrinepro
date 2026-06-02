import { NextResponse } from "next/server";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Product {
  name: string;
  price?: number;
  description?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  // Guard: Anthropic not configured → graceful response, no 500
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: "Assistente temporariamente indisponível." });
  }

  try {
    const { message, history, business } = await request.json();

    if (!message || !business) {
      return NextResponse.json(
        { error: "Mensagem e dados do negócio são obrigatórios." },
        { status: 400 }
      );
    }

    const businessName = business.name || "o negócio";
    const whatsapp = business.whatsApp || business.whatsapp || "não disponível";
    const phone = business.phone || "não disponível";
    const email = business.email || "não disponível";
    const address = business.address || "não disponível";
    const openingHours = (business.opening_hours || []) as OpeningHour[];
    const products = (business.products || []) as Product[];

    let systemPrompt = "";
    if (businessName.toLowerCase().includes("vitrinepro")) {
      systemPrompt = `Você é o assistente virtual inteligente e atencioso da plataforma "VitrinePro".
A sua principal tarefa é responder a dúvidas de visitantes sobre como o VitrinePro funciona.

Aqui estão os detalhes do VitrinePro para basear as suas respostas:
- O que é: Uma plataforma e diretório de mini-sites profissionais para negócios locais em Portugal, criada para que profissionais e empresas sejam encontrados por novos clientes sem precisarem de programadores ou orçamentos caros de marketing.
- Planos e Preços:
  1. Plano Grátis: €0/mês. Inclui vitrine básica online, 3 produtos no catálogo, links de WhatsApp/redes sociais, inclusão no diretório e link curto partilhável.
  2. Plano Pro: €12/mês. Inclui produtos ilimitados, assistente virtual (Chatbot IA) 24h por dia, destaque no diretório de buscas, analytics de visitas, otimização de SEO para o Google, domínio próprio personalizado, remoção do logo VitrinePro e suporte prioritário.
  3. Plano Business: €29/mês. Inclui loja online completa com pagamentos integrados, chatbot de IA avançado, 1º lugar garantido nas pesquisas do diretório, relatórios mensais e multi-idioma.
- Como cadastrar o negócio: Clicar em "Criar minha vitrine grátis" no topo, preencher os dados (nome, fotos, contactos, WhatsApp) e publicar. Fica online em menos de 5 minutos!
- WhatsApp: Clientes navegam no catálogo e contactam diretamente pelo WhatsApp do dono. A VitrinePro não cobra quaisquer comissões sobre as vendas!
- Site próprio: Não é necessário ter site próprio ou alojamento, pois a VitrinePro fornece o mini-site pronto e alojado.
- Para quem serve: Cafés, manicures, esteticistas, restaurantes, tatuadores, pintores, eletricistas, lojas e infoprodutores.
- Como fazer upgrade: No Dashboard do utilizador, clicar no botão "Upgrade".
- Cancelamento: Sem contratos. Cancelamento ou mudança de plano a qualquer momento no painel.

Regras de conduta:
1. Responda em Português de Portugal de forma natural, amigável e profissional.
2. Seja conciso e direto nas respostas.
3. Se o utilizador perguntar algo que não saiba, responda educadamente e convide a falar no WhatsApp: "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?".
4. Incentive o utilizador a criar a sua conta grátis.`;
    } else {
      systemPrompt = `Você é o assistente virtual inteligente e atencioso do negócio "${businessName}".
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
4. Se a pergunta for sobre algo que não consta no contexto ou que você não saiba: responda de forma útil e convide a falar no WhatsApp: "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?".
5. Mantenha um tom acolhedor de quem deseja ajudar o cliente.`;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn("[CHAT API] ANTHROPIC_API_KEY não configurada. A usar resposta de fallback estruturada.");

      const cleanMsg = message.toLowerCase();
      let reply = "";

      if (businessName.toLowerCase().includes("vitrinepro")) {
        // Fallback rule-based matching for VitrinePro general assistant
        if (cleanMsg.includes("como funciona") || cleanMsg.includes("o que é") || cleanMsg.includes("plataforma")) {
          reply = "A VitrinePro é uma plataforma e diretório que permite a negócios e profissionais locais em Portugal criarem um mini-site profissional em menos de 5 minutos, ajudando-os a atrair mais clientes sem complicações técnicas.";
        } else if (cleanMsg.includes("quanto custa") || cleanMsg.includes("preço") || cleanMsg.includes("valor") || cleanMsg.includes("plano") || cleanMsg.includes("custo")) {
          reply = "Temos três planos disponíveis:\n\n1. **Grátis**: €0/mês - Vitrine básica, até 3 produtos, links e presença no diretório.\n2. **Pro**: €12/mês - Produtos ilimitados, Chatbot IA 24h, domínio próprio e otimização SEO.\n3. **Business**: €29/mês - Loja online com pagamentos integrados.\n\nPode começar grátis e fazer upgrade quando quiser!";
        } else if (cleanMsg.includes("diferença") || cleanMsg.includes("diferenca") || cleanMsg.includes("comparar")) {
          reply = "O plano Grátis (€0) oferece o básico com 3 produtos. O plano Pro (€12) traz produtos ilimitados, Chatbot IA 24h, domínio próprio e destaque nas buscas. O plano Business (€29) adiciona loja online com pagamentos e destaque máximo no topo.";
        } else if (cleanMsg.includes("cadastrar") || cleanMsg.includes("criar") || cleanMsg.includes("começar") || cleanMsg.includes("registo") || cleanMsg.includes("registrar")) {
          reply = "Para começar, basta clicar no botão 'Criar minha vitrine grátis' no topo da página. O processo leva menos de 5 minutos: preencha as informações básicas do seu negócio, faça upload de fotos e publique!";
        } else if (cleanMsg.includes("diretório") || cleanMsg.includes("diretorio") || cleanMsg.includes("explorar") || cleanMsg.includes("aparecer")) {
          reply = "Ao publicar o seu negócio na VitrinePro, ele é incluído automaticamente no nosso diretório público de buscas. Clientes na sua região podem encontrá-lo por categoria, cidade ou palavra-chave.";
        } else if (cleanMsg.includes("whatsapp") || cleanMsg.includes("receber clientes") || cleanMsg.includes("contacto")) {
          reply = "Os clientes navegam pelo seu catálogo na VitrinePro e entram em contacto direto com o seu negócio pelo WhatsApp para fechar pedidos ou marcar horários. Não cobramos nenhuma taxa ou comissão sobre as suas vendas!";
        } else if (cleanMsg.includes("site") || cleanMsg.includes("alojamento") || cleanMsg.includes("hospedagem")) {
          reply = "Não precisa de ter site próprio ou alojamento! A VitrinePro fornece o mini-site pronto e alojado de forma segura nos nossos servidores.";
        } else if (cleanMsg.includes("serve") || cleanMsg.includes("café") || cleanMsg.includes("manicure") || cleanMsg.includes("restaurante") || cleanMsg.includes("tatuador") || cleanMsg.includes("loja") || cleanMsg.includes("serviço") || cleanMsg.includes("infoproduto")) {
          reply = "Sim! A VitrinePro serve perfeitamente para cafés, manicures, esteticistas, restaurantes, tatuadores, eletricistas, prestadores de serviço em geral, lojas físicas/online e infoprodutores.";
        } else if (cleanMsg.includes("gratuito") || cleanMsg.includes("plano grátis")) {
          reply = "O plano Grátis custa €0/mês e é grátis para sempre! Permite expor até 3 produtos no catálogo, incluir botões de contacto (WhatsApp/Telefone) e aparecer nas pesquisas do nosso diretório.";
        } else if (cleanMsg.includes("upgrade") || cleanMsg.includes("mudar de plano")) {
          reply = "Pode fazer upgrade a qualquer momento a partir das configurações do seu Dashboard no painel de utilizador. Basta clicar no botão 'Upgrade para Pro' ou escolher o plano ideal para si.";
        } else {
          reply = "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?";
        }
      } else {
        // Fallback rule-based matching for normal businesses
        if (cleanMsg.includes("horário") || cleanMsg.includes("hora") || cleanMsg.includes("aberto") || cleanMsg.includes("fecha") || cleanMsg.includes("funcionamento")) {
          if (openingHours && openingHours.length > 0) {
            const hoursText = openingHours
              .map((h: OpeningHour) => `${h.day}: ${h.closed ? "Fechado" : `${h.open} - ${h.close}`}`)
              .join("\n");
            reply = `O nosso horário de funcionamento é o seguinte:\n${hoursText}`;
          } else {
            reply = `Infelizmente não temos os horários registados no momento. Por favor, confirme connosco via WhatsApp no número ${whatsapp}.`;
          }
        } else if (cleanMsg.includes("produto") || cleanMsg.includes("preço") || cleanMsg.includes("custo") || cleanMsg.includes("serviço") || cleanMsg.includes("catálogo") || cleanMsg.includes("vende")) {
          if (products && products.length > 0) {
            const productsText = products
              .map((p: Product) => `- ${p.name}${p.price ? ` (€${Number(p.price).toFixed(2)})` : ""}${p.description ? `: ${p.description}` : ""}`)
              .join("\n");
            reply = `Aqui estão os nossos produtos e serviços:\n${productsText}\n\nPara fazer um pedido, contacte-nos pelo WhatsApp: https://wa.me/${whatsapp.replace(/\D/g, "")}`;
          } else {
            reply = `Pode consultar os nossos produtos diretamente na nossa página ou perguntar-nos via WhatsApp: https://wa.me/${whatsapp.replace(/\D/g, "")}`;
          }
        } else if (cleanMsg.includes("morada") || cleanMsg.includes("local") || cleanMsg.includes("onde") || cleanMsg.includes("endereço") || cleanMsg.includes("fica") || cleanMsg.includes("mapa")) {
          reply = `Estamos localizados em: ${address}.\n\nPode ver a nossa localização no Google Maps diretamente na nossa página!`;
        } else if (cleanMsg.includes("contacto") || cleanMsg.includes("telefone") || cleanMsg.includes("whatsapp") || cleanMsg.includes("email") || cleanMsg.includes("falar")) {
          reply = `Pode contactar-nos pelos seguintes meios:\n- WhatsApp: ${whatsapp}\n${phone !== "não disponível" ? `- Telefone: ${phone}\n` : ""}${email !== "não disponível" ? `- E-mail: ${email}\n` : ""}`;
        } else {
          reply = `Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?`;
        }
      }

      return NextResponse.json({ reply });
    }

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...((history || []) as ChatMessage[]).map((msg: ChatMessage) => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content,
          })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CHAT API] Erro ao chamar Anthropic API:", errorText);
      throw new Error(`Anthropic API respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.content?.[0]?.text || "Desculpe, não consegui processar a resposta.";

    return NextResponse.json({ reply: replyText });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[CHAT API] Exception:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor de chat.", details: errorMsg },
      { status: 500 }
    );
  }
}

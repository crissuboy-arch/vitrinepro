import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 60;

interface CatalogSettings {
  corCapa: string;
  corDestaque: string;
  corTexto: string;
  corFundo: string;
  fonteTitulo: string;
  fonteCorpo: string;
  incluirProdutos: boolean;
  incluirServicos: boolean;
  incluirHorarios: boolean;
  fraseRodape: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

function buildHtml(biz: any, products: any[], settings: CatalogSettings): string {
  const {
    corCapa, corDestaque, corTexto, corFundo,
    fonteTitulo, fonteCorpo,
    incluirProdutos, incluirServicos, incluirHorarios,
    fraseRodape,
  } = settings;

  const anoAtual = new Date().getFullYear();
  const slug = biz.slug || "";
  const nome = biz.name || "Negócio";
  const categoria = biz.category || "";
  const cidade = biz.city || "";
  const telefone = biz.phone || biz.whatsapp || "";
  const endereco = biz.address || "";

  // Services: from biz.services JSONB if present (array of {nome,descricao,preco})
  const servicos: any[] = Array.isArray(biz.services) ? biz.services : [];

  // Opening hours
  const horas: any[] = Array.isArray(biz.opening_hours) ? biz.opening_hours : [];
  const horasAbertas = horas.filter((h) => !h.closed && h.open && h.close);

  // Encode font names for Google Fonts URL
  const gfTitle = fonteTitulo.replace(/ /g, "+");
  const gfBody = fonteCorpo.replace(/ /g, "+");

  const produtosFeatured = products[0];
  const produtosRest = products.slice(1);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${gfTitle}:wght@400;700&family=${gfBody}:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: '${fonteCorpo}', sans-serif; background: #fff; width: 794px; }

  /* CAPA */
  .capa { background: ${corCapa}; color: ${corTexto}; padding: 60px 48px 48px; display: flex; justify-content: space-between; align-items: flex-end; min-height: 220px; }
  .capa-label { font-size: 10px; letter-spacing: 0.2em; color: ${corDestaque}; text-transform: uppercase; margin-bottom: 12px; }
  .capa-nome { font-family: '${fonteTitulo}', serif; font-size: 42px; font-weight: 700; line-height: 1.1; margin-bottom: 8px; }
  .capa-tag { font-size: 13px; color: ${corDestaque}; font-weight: 300; }
  .capa-meta { text-align: right; font-size: 11px; color: #888; line-height: 2; }
  .capa-meta strong { display: block; font-size: 9px; letter-spacing: 0.1em; color: ${corDestaque}; text-transform: uppercase; margin-bottom: 4px; }

  /* DIVISOR */
  .divisor { height: 3px; background: ${corDestaque}; }
  .divisor-bar { background: ${corCapa}; padding: 8px 48px; display: flex; justify-content: space-between; }
  .divisor-bar span { font-size: 10px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
  .divisor-bar a { font-size: 10px; color: ${corDestaque}; }

  /* SECÇÕES */
  .section-header { background: ${corFundo}; padding: 16px 48px; display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.5px solid #e0e0e0; }
  .section-title { font-family: '${fonteTitulo}', serif; font-size: 22px; font-weight: 700; color: #0a0d14; }
  .section-count { font-size: 11px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; }

  /* PRODUTO DESTAQUE */
  .featured { display: flex; height: 200px; }
  .featured-img { flex: 1.6; background: #1a1a2e; display: flex; align-items: center; justify-content: center; font-size: 80px; position: relative; overflow: hidden; }
  .featured-img img { width: 100%; height: 100%; object-fit: cover; }
  .featured-label { position: absolute; bottom: 12px; left: 12px; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: ${corDestaque}; background: rgba(10,13,20,0.8); padding: 4px 10px; }
  .featured-content { flex: 1; background: ${corCapa}; color: ${corTexto}; padding: 28px 24px; display: flex; flex-direction: column; justify-content: space-between; }
  .featured-eyebrow { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: ${corDestaque}; margin-bottom: 8px; }
  .featured-nome { font-family: '${fonteTitulo}', serif; font-size: 20px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
  .featured-desc { font-size: 11px; color: #aaa; line-height: 1.6; flex: 1; }
  .featured-preco { font-family: '${fonteTitulo}', serif; font-size: 26px; color: ${corDestaque}; font-weight: 700; margin-top: 12px; }

  /* GRID PRODUTOS */
  .produtos-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 0.5px solid #e0e0e0; }
  .produto { border-right: 0.5px solid #e0e0e0; border-bottom: 0.5px solid #e0e0e0; }
  .produto:nth-child(3n) { border-right: none; }
  .produto-img { height: 110px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; font-size: 40px; border-bottom: 0.5px solid #e0e0e0; overflow: hidden; }
  .produto-img img { width: 100%; height: 100%; object-fit: cover; }
  .produto-body { padding: 12px 16px; }
  .produto-nome { font-weight: 500; font-size: 13px; color: #0a0d14; margin-bottom: 4px; line-height: 1.3; }
  .produto-desc { font-size: 11px; color: #888; margin-bottom: 10px; line-height: 1.5; }
  .produto-preco { font-family: '${fonteTitulo}', serif; font-size: 16px; font-weight: 700; color: #0a0d14; }
  .produto-preco span { font-family: sans-serif; font-size: 10px; font-weight: 400; color: #aaa; }

  /* SERVIÇOS */
  .servicos { border: 0.5px solid #e0e0e0; }
  .servico-row { display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 0.5px solid #e0e0e0; }
  .servico-row:last-child { border-bottom: none; }
  .servico-num { font-family: '${fonteTitulo}', serif; font-size: 22px; font-weight: 700; color: ${corDestaque}; }
  .servico-nome { font-weight: 500; font-size: 13px; color: #0a0d14; margin-bottom: 2px; }
  .servico-detalhe { font-size: 11px; color: #888; }
  .servico-preco { font-weight: 500; font-size: 14px; color: #0a0d14; white-space: nowrap; }

  /* HORÁRIOS */
  .horarios-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 24px 48px; background: #fff; }
  .hora-row { display: flex; justify-content: space-between; padding: 10px 16px; background: ${corFundo}; border-radius: 6px; font-size: 12px; }
  .hora-dia { font-weight: 600; color: #333; text-transform: capitalize; }
  .hora-time { color: ${corDestaque}; font-weight: 600; }

  /* RODAPÉ */
  .rodape { background: ${corCapa}; color: #888; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; }
  .rodape-brand { font-family: '${fonteTitulo}', serif; font-size: 16px; color: ${corTexto}; }
  .rodape-url { font-size: 10px; color: ${corDestaque}; margin-top: 2px; }
  .rodape-info { text-align: right; font-size: 10px; line-height: 1.8; }

  .spacer { height: 8px; background: ${corFundo}; }
</style>
</head>
<body>

  <!-- CAPA -->
  <div class="capa">
    <div>
      <div class="capa-label">Catálogo Oficial · ${anoAtual}</div>
      <div class="capa-nome">${nome}</div>
      <div class="capa-tag">${categoria}${cidade ? " · " + cidade : ""}</div>
    </div>
    <div class="capa-meta">
      <strong>Contacto</strong>
      ${telefone || ""}${endereco ? "<br>" + endereco : ""}
    </div>
  </div>
  <div class="divisor"></div>
  <div class="divisor-bar">
    <span>Produtos · Serviços · Portfólio</span>
    <a>vitrinepro.pt/${slug}</a>
  </div>

  ${incluirProdutos && products.length > 0 ? `
  <div class="spacer"></div>

  ${produtosFeatured ? `
  <!-- PRODUTO DESTAQUE -->
  <div class="featured">
    <div class="featured-img">
      ${produtosFeatured.image_url
        ? `<img src="${produtosFeatured.image_url}" alt="${produtosFeatured.name}">`
        : "🎨"}
      <div class="featured-label">Destaque</div>
    </div>
    <div class="featured-content">
      <div>
        <div class="featured-eyebrow">Produto em Destaque</div>
        <div class="featured-nome">${produtosFeatured.name}</div>
        <div class="featured-desc">${(produtosFeatured.description || "").slice(0, 160)}</div>
      </div>
      <div class="featured-preco">${produtosFeatured.price != null ? Number(produtosFeatured.price).toFixed(2) + "€" : ""}</div>
    </div>
  </div>` : ""}

  <div class="spacer"></div>
  <div class="section-header">
    <div class="section-title">Produtos</div>
    <div class="section-count">${products.length} produto${products.length !== 1 ? "s" : ""}</div>
  </div>
  ${produtosRest.length > 0 ? `
  <div class="produtos-grid">
    ${produtosRest.slice(0, 9).map((p: any) => `
    <div class="produto">
      <div class="produto-img">
        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : "📦"}
      </div>
      <div class="produto-body">
        <div class="produto-nome">${p.name}</div>
        <div class="produto-desc">${(p.description || "").slice(0, 80)}</div>
        <div class="produto-preco">${p.price != null ? Number(p.price).toFixed(2) + "€" : ""} <span>unidade</span></div>
      </div>
    </div>`).join("")}
  </div>` : ""}
  ` : ""}

  ${incluirServicos && servicos.length > 0 ? `
  <div class="spacer"></div>
  <div class="section-header">
    <div class="section-title">Serviços</div>
    <div class="section-count">${servicos.length} serviço${servicos.length !== 1 ? "s" : ""}</div>
  </div>
  <div class="servicos">
    ${servicos.map((s: any, i: number) => `
    <div class="servico-row">
      <div class="servico-num">${String(i + 1).padStart(2, "0")}</div>
      <div>
        <div class="servico-nome">${s.nome || s.name || ""}</div>
        <div class="servico-detalhe">${s.descricao || s.description || ""}</div>
      </div>
      <div class="servico-preco">${s.preco || s.price ? (s.preco || s.price) + "€" : ""}</div>
    </div>`).join("")}
  </div>` : ""}

  ${incluirHorarios && horasAbertas.length > 0 ? `
  <div class="spacer"></div>
  <div class="section-header">
    <div class="section-title">Horários</div>
    <div class="section-count">Quando estamos abertos</div>
  </div>
  <div class="horarios-grid">
    ${horasAbertas.map((h: any) => `
    <div class="hora-row">
      <span class="hora-dia">${h.day}</span>
      <span class="hora-time">${h.open} – ${h.close}</span>
    </div>`).join("")}
  </div>` : ""}

  <div class="spacer"></div>
  <!-- RODAPÉ -->
  <div class="rodape">
    <div>
      <div class="rodape-brand">${nome}</div>
      <div class="rodape-url">vitrinepro.pt/${slug}</div>
    </div>
    <div class="rodape-info">
      ${fraseRodape || "Contacte-nos para mais informações"}<br>
      <span style="color:#555;">Gerado pela VitrinePro · ${anoAtual}</span>
    </div>
  </div>

</body>
</html>`;
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Token inválido." }), { status: 401 });
  }

  let businessId: string;
  let settings: CatalogSettings;
  try {
    ({ businessId, settings } = await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido." }), { status: 400 });
  }

  // Fetch business and verify ownership + plan
  const { data: biz, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bizError || !biz) {
    return new Response(JSON.stringify({ error: "Negócio não encontrado." }), { status: 404 });
  }

  const plan = biz.plan || "free";
  if (plan !== "premium" && plan !== "business") {
    return new Response(JSON.stringify({ error: "Funcionalidade exclusiva para planos Premium e Business." }), { status: 403 });
  }

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("order_index", { ascending: true });

  // Persist settings for next time
  await supabase
    .from("businesses")
    .update({ catalog_settings: settings })
    .eq("id", businessId);

  const htmlContent = buildHtml(biz, products || [], settings);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new" as any,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });
    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const filename = `${(biz.name || "catalogo").toLowerCase().replace(/\s+/g, "-")}_catalogo.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    if (browser) await browser.close();
  }
}

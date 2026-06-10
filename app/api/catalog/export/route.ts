import { createClient } from "@supabase/supabase-js"
import chromium from "@sparticuz/chromium-min"
import puppeteer from "puppeteer-core"
import type { Catalog } from "@/types/catalog"

export const runtime = "nodejs"
export const maxDuration = 60

const CHROMIUM_REMOTE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase admin credentials not configured")
  return createClient(url, key, { auth: { persistSession: false } })
}

function escapeHtml(text?: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildHtml(catalog: Catalog): string {
  const { cores, capa, paginas, slug, modelo } = catalog
  const isSerifModel = modelo === "elegante" || modelo === "luxo"
  const bodyFont = isSerifModel ? "Georgia, 'Times New Roman', serif" : "system-ui, -apple-system, Arial, sans-serif"
  const titleFont = "Georgia, 'Times New Roman', serif"

  const pageRows = paginas
    .map(
      (p, i) => `
  <div class="page" style="background:${escapeHtml(cores.fundo)};">
    ${p.imagem ? `<img src="${p.imagem}" style="width:100%;height:380px;object-fit:cover;" />` : ""}
    <div style="padding:48px 56px;">
      ${p.destaque ? `<div style="font-size:10px;letter-spacing:0.2em;color:${escapeHtml(cores.principal)};text-transform:uppercase;margin-bottom:12px;">&#9733; Destaque</div>` : ""}
      <h2 style="font-family:${titleFont};font-size:36px;font-weight:700;color:${escapeHtml(cores.titulos)};margin-bottom:16px;">${escapeHtml(p.titulo)}</h2>
      ${p.descricao ? `<p style="font-size:15px;color:#333;opacity:0.75;line-height:1.7;margin-bottom:24px;">${escapeHtml(p.descricao)}</p>` : ""}
      ${p.preco ? `<div style="font-family:${titleFont};font-size:42px;font-weight:700;color:${escapeHtml(cores.precos)};">${escapeHtml(p.preco)}</div>` : ""}
    </div>
    <div style="position:absolute;bottom:24px;left:56px;right:56px;display:flex;justify-content:space-between;font-size:11px;color:#aaa;">
      <span>${escapeHtml(capa.nome)}</span>
      <span>${i + 2}</span>
    </div>
  </div>`,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 794px; font-family: ${bodyFont}; background: white; }
  .page { width: 794px; min-height: 1123px; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
</style>
</head>
<body>

  <!-- CAPA -->
  <div class="page" style="background:${escapeHtml(cores.secundaria)};">
    ${capa.imagem ? `<img src="${capa.imagem}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />` : ""}
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
    <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;">
      ${capa.logo ? `<img src="${capa.logo}" style="width:100px;height:100px;border-radius:50%;object-fit:contain;margin-bottom:32px;border:2px solid ${escapeHtml(cores.principal)};" />` : ""}
      <div style="font-size:11px;letter-spacing:0.3em;color:${escapeHtml(cores.principal)};text-transform:uppercase;margin-bottom:16px;">Cat&aacute;logo Oficial &middot; 2026</div>
      <h1 style="font-family:${titleFont};font-size:56px;font-weight:700;color:${escapeHtml(cores.titulos)};line-height:1.1;margin-bottom:16px;">${escapeHtml(capa.nome)}</h1>
      <div style="font-size:16px;color:${escapeHtml(cores.principal)};margin-bottom:12px;">${escapeHtml(capa.categoria)}${capa.cidade ? ` &middot; ${escapeHtml(capa.cidade)}` : ""}</div>
      ${capa.slogan ? `<div style="font-size:14px;color:rgba(255,255,255,0.65);font-style:italic;">${escapeHtml(capa.slogan)}</div>` : ""}
    </div>
  </div>

  ${pageRows}

  <!-- CONTRACAPA -->
  <div class="page" style="background:${escapeHtml(cores.secundaria)};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;">
    <div style="font-family:${titleFont};font-size:32px;font-weight:700;color:${escapeHtml(cores.titulos)};margin-bottom:12px;">${escapeHtml(capa.nome)}</div>
    <div style="font-size:14px;color:${escapeHtml(cores.principal)};margin-bottom:40px;">vitrinepro.com/catalogo/${escapeHtml(slug || "o-seu-negocio")}</div>
    <div style="height:1px;width:80px;background:${escapeHtml(cores.principal)};margin:0 auto 40px;"></div>
    <div style="font-size:12px;color:rgba(255,255,255,0.3);">Gerado pela VitrinePro &middot; vitrinepro.com</div>
  </div>

</body>
</html>`
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()

  let catalogId: string
  try {
    ;({ catalogId } = await request.json())
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 })
  }

  if (!catalogId) {
    return Response.json({ error: "catalogId obrigatório." }, { status: 400 })
  }

  const { data: catalog, error: catError } = await supabase
    .from("catalogs")
    .select("*")
    .eq("id", catalogId)
    .maybeSingle()

  if (catError || !catalog) {
    return Response.json({ error: "Catálogo não encontrado." }, { status: 404 })
  }

  // Auth: if Bearer token present, check ownership; otherwise catalog must be public
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()

  if (token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.id !== catalog.user_id) {
      return Response.json({ error: "Não autorizado." }, { status: 403 })
    }
  } else if (!catalog.publico) {
    return Response.json({ error: "Catálogo não público." }, { status: 403 })
  }

  const html = buildHtml(catalog as Catalog)

  let browser
  try {
    const executablePath =
      process.env.CHROMIUM_EXECUTABLE_PATH ||
      (await chromium.executablePath(CHROMIUM_REMOTE_URL))

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load", timeout: 30000 })
    await page.emulateMediaType("print")

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })

    const safeName = (catalog.capa?.nome || "catalogo")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_catalogo.pdf"`,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[catalog/export] PDF generation failed:", msg)
    return Response.json({ error: "Erro ao gerar PDF.", detail: msg }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}

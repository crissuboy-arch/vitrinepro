import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

// M12: step tracers only run outside production so we don't flood Vercel logs
// (and leak catalog IDs/names) on every export. Real failures still use console.error.
const isProd = process.env.NODE_ENV === 'production'
const log = (...args: unknown[]) => {
  if (!isProd) console.log(...args)
}

// Pick a readable text colour for the internal pages from the background
// luminance, so the text never ends up the same colour as the background.
function isLightColor(hex: string): boolean {
  const c = (hex || '').replace('#', '')
  if (c.length < 6) return true
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

export async function POST(req: NextRequest) {
  log('=== CATALOG EXPORT STARTED ===')

  try {
    // STEP 1 - Parse body
    log('Step 1: Parsing body...')
    const body = await req.json()
    const { catalogId } = body
    log('catalogId:', catalogId)

    if (!catalogId) {
      return NextResponse.json({ error: 'catalogId missing' }, { status: 400 })
    }

    // STEP 2 - Supabase
    log('Step 2: Connecting Supabase...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // STEP 3 - Fetch catalog
    log('Step 3: Fetching catalog...')
    const { data: catalog, error: dbError } = await supabase
      .from('catalogs')
      .select('*')
      .eq('id', catalogId)
      .single()

    if (dbError) {
      console.error('[CATALOG EXPORT] DB error:', dbError.message)
      return NextResponse.json({ error: 'Erro ao carregar o catálogo.' }, { status: 500 })
    }

    if (!catalog) {
      log('Catalog not found')
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    log('Catalog found:', catalog.nome)

    // Authorization: public catalogs (publico=true) are already viewable at
    // /catalogo/[slug], so anyone may export them. Private/draft catalogs require
    // a valid token AND ownership — this blocks exporting a catalog by id alone.
    if (catalog.publico !== true) {
      const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
      if (!token) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user || user.id !== catalog.user_id) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
      }
    }

    // STEP 4 - Load Chromium
    log('Step 4: Loading Chromium...')
    let chromium: any
    let puppeteer: any

    try {
      // .default: with CJS require, the @sparticuz/chromium-min class lives on
      // `.default` (without it, chromium.executablePath/args are undefined → 500).
      chromium = require('@sparticuz/chromium-min').default
      puppeteer = require('puppeteer-core')
      log('Chromium loaded OK')
    } catch (e: any) {
      console.error('[CATALOG EXPORT] Chromium load error:', e.message)
      return NextResponse.json({ error: 'Falha ao gerar o PDF.' }, { status: 500 })
    }

    // STEP 5 - Get executable path
    log('Step 5: Getting executable path...')
    let executablePath: string
    try {
      executablePath = await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar'
      )
      log('Executable path:', executablePath)
    } catch (e: any) {
      console.error('[CATALOG EXPORT] executablePath error:', e.message)
      return NextResponse.json({ error: 'Falha ao gerar o PDF.' }, { status: 500 })
    }

    // STEP 6 - Launch browser
    log('Step 6: Launching browser...')
    let browser: any
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 794, height: 1123 },
        executablePath,
        headless: 'shell',
      })
      log('Browser launched OK')
    } catch (e: any) {
      console.error('[CATALOG EXPORT] Browser launch error:', e.message)
      return NextResponse.json({ error: 'Falha ao gerar o PDF.' }, { status: 500 })
    }

    // STEP 7 - Generate HTML
    log('Step 7: Generating HTML...')

    // Fetch business contact + hours for the back cover (best-effort)
    const { data: business } = await supabase
      .from('businesses')
      .select('phone, whatsapp, address, opening_hours, schedule')
      .eq('id', catalog.business_id)
      .single()

    const cores = catalog.cores || {}
    const capa = catalog.capa || {}
    const paginas = catalog.paginas || []
    const capaImagem = capa.imagem || null
    const capaLogo = capa.logo || null
    const corPrincipal = cores.principal || '#c9a96e'
    const logoPosition = capa.logoPosition || 'center'
    const fundoClaro = isLightColor(cores.fundo || '#ffffff')
    const textoTitulo = fundoClaro ? '#0a0d14' : '#f5f0e8'
    const textoCorpo = fundoClaro ? 'rgba(10,13,20,0.72)' : 'rgba(245,240,232,0.72)'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vitrinepro.com'
    const telefone = capa.telefone || business?.phone || business?.whatsapp || ''
    const morada = capa.morada || business?.address || ''
    const horarios = business?.opening_hours || business?.schedule || []

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* CAPA */
  .cover {
    width: 210mm;
    height: 297mm;
    background: ${cores.secundaria || '#0a0d14'};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    page-break-inside: avoid;
  }
  .cover-bg {
    position: absolute; top: 0; left: 0;
    width: 210mm; height: 297mm;
    object-fit: cover; object-position: center center; display: block;
  }
  .cover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); }
  .cover-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
  .cover-logo {
    width: 100px; height: 100px; border-radius: 50%; object-fit: contain;
    border: 2px solid ${cores.principal || '#c9a96e'}; margin-bottom: 32px;
  }
  .cover-label {
    font-size: 10px; letter-spacing: 0.35em; color: ${cores.principal || '#c9a96e'};
    text-transform: uppercase; margin-bottom: 20px;
    font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 300;
  }
  .cover-title {
    font-size: 56px; font-weight: 700; color: ${cores.titulos || '#f5f0e8'};
    line-height: 1.1; margin-bottom: 16px; font-family: Georgia, serif;
  }
  .cover-subtitle {
    font-size: 16px; color: ${cores.principal || '#c9a96e'}; margin-bottom: 12px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .cover-slogan {
    font-size: 14px; color: rgba(255,255,255,0.55); font-style: italic;
    max-width: 320px; line-height: 1.6;
  }
  .cover-divider { width: 60px; height: 2px; background: ${cores.principal || '#c9a96e'}; margin: 24px auto; }
  .cover-footer {
    position: absolute; bottom: 32px; font-size: 10px; letter-spacing: 0.25em;
    color: rgba(255,255,255,0.35); font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  /* PÁGINAS PRODUTO — coluna única, imagem ACIMA do título (igual à pré-visualização) */
  .product-page { width: 100%; height: 100%; display: flex; flex-direction: column; background: ${cores.fundo || '#ffffff'}; position: relative; }
  .product-photo { width: 100%; height: 48%; position: relative; overflow: hidden; background: #f5f0e8; flex-shrink: 0; }
  .product-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .product-no-img {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #f5f0e8 0%, #ede8dd 100%);
  }
  .product-no-img-emoji { font-size: 96px; opacity: 0.35; }
  .product-number {
    position: absolute; top: 18px; left: 28px; font-size: 60px; font-weight: 700; color: #ffffff;
    opacity: 0.9; line-height: 1; font-family: Georgia, serif; text-shadow: 0 2px 10px rgba(0,0,0,0.45);
  }
  .product-body { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 44px 56px; }
  .product-badge {
    display: inline-block; font-size: 10px; letter-spacing: 0.2em; color: ${cores.principal || '#c9a96e'};
    border: 1px solid ${cores.principal || '#c9a96e'}; padding: 4px 12px; border-radius: 2px;
    text-transform: uppercase; margin-bottom: 20px; font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .product-name {
    font-size: 38px; font-weight: 700; color: ${textoTitulo};
    line-height: 1.15; margin-bottom: 18px; font-family: Georgia, serif;
  }
  .product-line { width: 56px; height: 3px; background: ${cores.principal || '#c9a96e'}; margin-bottom: 22px; }
  .product-desc {
    font-size: 15px; color: ${textoCorpo}; opacity: 1; line-height: 1.8; margin-bottom: 28px;
    font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 300; max-width: 92%;
  }
  .product-price {
    font-size: 46px; font-weight: 700; color: ${cores.precos || cores.principal || '#c9a96e'};
    line-height: 1; font-family: Georgia, serif;
  }
  .product-price-section {
    display: flex; align-items: flex-end; justify-content: space-between;
    width: 100%; margin-top: 10px;
  }
  .product-price-label {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: ${corPrincipal}; margin-bottom: 10px; font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .product-price-currency {
    font-size: 26px; font-weight: 700; color: ${cores.precos || cores.principal || '#c9a96e'};
    font-family: Georgia, serif; line-height: 1; margin-top: 6px;
  }
  .product-number-watermark {
    font-size: 76px; font-weight: 700; color: ${cores.titulos || '#0a0d14'};
    opacity: 0.07; line-height: 1; font-family: Georgia, serif;
  }

  /* RODAPÉ DE PÁGINA */
  .page-footer {
    position: absolute; bottom: 0; left: 0; right: 0; height: 36px;
    display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
    background: rgba(0,0,0,0.3); font-size: 9px; color: rgba(255,255,255,0.35);
    letter-spacing: 0.1em; font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  /* CONTRACAPA */
  .backcover {
    width: 100%; height: 100%; background: ${cores.secundaria || '#0a0d14'};
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 56px 64px; position: relative;
  }
  .backcover-title { font-size: 30px; font-weight: 700; color: ${cores.titulos || '#f5f0e8'}; margin-bottom: 10px; font-family: Georgia, serif; }
  .backcover-name { font-size: 18px; color: ${cores.principal || '#c9a96e'}; margin-bottom: 32px; }
  .backcover-divider { width: 60px; height: 1px; background: ${cores.principal || '#c9a96e'}; margin: 0 auto 32px; }
  .contact-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; text-align: left; }
  .contact-item {
    font-size: 13px; color: rgba(255,255,255,0.65); display: flex; align-items: center; gap: 10px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .contact-icon { font-size: 14px; width: 20px; text-align: center; }
  .hours-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 32px; text-align: left; }
  .hours-item { font-size: 11px; color: rgba(255,255,255,0.5); font-family: 'Helvetica Neue', Arial, sans-serif; }
  .hours-day { font-weight: 600; color: rgba(255,255,255,0.7); }
  .backcover-footer {
    position: absolute; bottom: 24px; font-size: 10px; color: rgba(255,255,255,0.25);
    font-family: 'Helvetica Neue', Arial, sans-serif; display: flex; align-items: center; gap: 6px;
  }
  .vitrinepro-badge { color: ${cores.principal || '#c9a96e'}; font-weight: 600; }
</style>
</head>
<body>

<!-- CAPA -->
<div class="page">
  <div class="cover">
    ${capaImagem ? `<img class="cover-bg" src="${capaImagem}" alt="capa" /><div class="cover-overlay"></div>` : ''}
    ${capaLogo && logoPosition !== 'center' ? `<img src="${capaLogo}" alt="logo" style="position:absolute; top:24px; ${logoPosition === 'top-right' ? 'right:24px' : 'left:24px'}; width:64px; height:64px; border-radius:50%; border:2px solid ${corPrincipal}; object-fit:cover; z-index:3;" />` : ''}
    <div class="cover-content">
      ${capaLogo && logoPosition === 'center' ? `<img src="${capaLogo}" alt="logo" style="width:100px; height:100px; border-radius:50%; border:3px solid ${corPrincipal}; object-fit:cover; margin-bottom:32px; display:block;" />` : ''}
      <div class="cover-label">Catálogo Oficial · 2026</div>
      ${capa.mostrarNome !== false ? `
      <h1 class="cover-title">${capa.nome || 'O Meu Negócio'}</h1>
      <div class="cover-divider"></div>
      <div class="cover-subtitle">${capa.categoria || ''} · ${capa.cidade || ''}</div>
      ${capa.slogan ? `<div class="cover-slogan">"${capa.slogan}"</div>` : ''}
      ` : `
      <div class="cover-divider"></div>
      ${capa.slogan ? `<div class="cover-slogan">"${capa.slogan}"</div>` : ''}
      `}
    </div>
    <div class="cover-footer">MENU 2026</div>
  </div>
</div>

<!-- PÁGINAS DE PRODUTOS -->
${paginas.map((p: { titulo?: string; descricao?: string; preco?: string; imagem?: string; destaque?: boolean }, i: number) => `
<div class="page">
  <div class="product-page">
    <div class="product-photo">
      ${p.imagem
        ? `<img class="product-img" src="${p.imagem}" alt="${p.titulo || ''}" />`
        : `<div class="product-no-img"><div class="product-no-img-emoji">🍽️</div></div>`
      }
    </div>
    <div class="product-body">
      ${p.destaque ? '<div class="product-badge">⭐ Destaque</div>' : ''}
      <div class="product-name">${p.titulo || 'Produto'}</div>
      <div class="product-line"></div>
      ${p.descricao ? `<div class="product-desc">${p.descricao}</div>` : ''}
      ${p.preco ? `
      <div class="product-price-section">
        <div>
          <div class="product-price-label">Preço</div>
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span class="product-price-currency">€</span>
            <span class="product-price">${String(p.preco).replace(/€/g, '').replace(/EUR/gi, '').trim()}</span>
          </div>
        </div>
        <div class="product-number-watermark">${String(i + 1).padStart(2, '0')}</div>
      </div>` : ''}
    </div>
    <div class="page-footer">
      <span>${capa.nome || ''}</span>
      <span>${i + 2}</span>
    </div>
  </div>
</div>`).join('')}

<!-- CONTRACAPA -->
<div class="page">
  <div class="backcover">
    ${capaImagem ? `<img class="cover-bg" src="${capaImagem}" alt="capa" /><div class="cover-overlay" style="background:rgba(0,0,0,0.7);"></div>` : ''}
    <div class="cover-content">
      ${capaLogo ? `<img class="cover-logo" src="${capaLogo}" alt="logo" />` : ''}
      <div class="backcover-title">Obrigado pela sua visita</div>
      <div class="backcover-name">${capa.nome || ''}</div>
      <div class="backcover-divider"></div>

      <div class="contact-grid">
        ${telefone ? `<div class="contact-item"><span class="contact-icon">📞</span>${telefone}</div>` : ''}
        ${morada ? `<div class="contact-item"><span class="contact-icon">📍</span>${morada}</div>` : ''}
        <div class="contact-item"><span class="contact-icon">🌐</span>${appUrl}/catalogo/${catalog.slug || ''}</div>
      </div>

      ${horarios && horarios.length > 0 ? `
      <div class="backcover-divider"></div>
      <div class="hours-grid">
        ${horarios.map((h: { dia?: string; day?: string; abertura?: string; open?: string; fecho?: string; close?: string }) => `
        <div class="hours-item">
          <span class="hours-day">${h.dia || h.day || ''}</span><br/>
          ${h.abertura || h.open || ''} – ${h.fecho || h.close || ''}
        </div>`).join('')}
      </div>` : ''}
    </div>

    <div class="backcover-footer">
      <span>Feito com ♥ pela</span>
      <span class="vitrinepro-badge">VitrinePro</span>
    </div>
  </div>
</div>

</body>
</html>`

    // STEP 8 - Render PDF
    log('Step 8: Rendering PDF...')
    let pdf: Buffer
    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 794, height: 1123 })
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 })

      // Wait until every image is fully DECODED (not just "complete") before the PDF
      // snapshot. Large base64 data: URLs report complete=true before they are decoded,
      // so page.pdf() was capturing them un-painted → blank product images.
      await page.evaluate(async () => {
        const imgs = Array.from(document.images)
        const settle = (img: HTMLImageElement) =>
          new Promise<void>((res) => {
            const finish = () => {
              if (img.decode) img.decode().then(() => res()).catch(() => res())
              else res()
            }
            if (img.complete && img.naturalWidth > 0) { finish(); return }
            img.addEventListener('load', finish)
            img.addEventListener('error', () => res())
          })
        await Promise.race([
          Promise.all(imgs.map(settle)),
          new Promise<void>((res) => setTimeout(res, 8000)),
        ])
      })
      // Extra settle so decoded images are committed to the next paint.
      await new Promise((r) => setTimeout(r, 250))

      pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: false,
      })
      await browser.close()
      log('PDF generated, size:', pdf.length, 'bytes')
    } catch (e: any) {
      console.error('[CATALOG EXPORT] PDF render error:', e.message)
      await browser.close().catch(() => {})
      return NextResponse.json({ error: 'Falha ao gerar o PDF.' }, { status: 500 })
    }

    // STEP 9 - Return PDF
    log('Step 9: Returning PDF...')
    const nomeFicheiro = (capa.nome || 'catalogo').toLowerCase().replace(/\s+/g, '-')

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeFicheiro}_catalogo.pdf"`,
      }
    })

  } catch (e: any) {
    console.error('[CATALOG EXPORT] Unhandled error:', e.message)
    return NextResponse.json({ error: 'Erro inesperado.' }, { status: 500 })
  }
}

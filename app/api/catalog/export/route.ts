import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  console.log('=== CATALOG EXPORT STARTED ===')

  try {
    // STEP 1 - Parse body
    console.log('Step 1: Parsing body...')
    const body = await req.json()
    const { catalogId } = body
    console.log('catalogId:', catalogId)

    if (!catalogId) {
      return NextResponse.json({ error: 'catalogId missing' }, { status: 400 })
    }

    // STEP 2 - Supabase
    console.log('Step 2: Connecting Supabase...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // STEP 3 - Fetch catalog
    console.log('Step 3: Fetching catalog...')
    const { data: catalog, error: dbError } = await supabase
      .from('catalogs')
      .select('*')
      .eq('id', catalogId)
      .single()

    if (dbError) {
      console.log('DB Error:', dbError)
      return NextResponse.json({ error: 'DB error', detail: dbError.message }, { status: 500 })
    }

    if (!catalog) {
      console.log('Catalog not found')
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    console.log('Catalog found:', catalog.nome)

    // STEP 4 - Load Chromium
    console.log('Step 4: Loading Chromium...')
    let chromium: any
    let puppeteer: any

    try {
      chromium = require('@sparticuz/chromium-min')
      puppeteer = require('puppeteer-core')
      console.log('Chromium loaded OK')
    } catch (e: any) {
      console.log('Chromium load error:', e.message)
      return NextResponse.json({ error: 'Chromium load failed', detail: e.message }, { status: 500 })
    }

    // STEP 5 - Get executable path
    console.log('Step 5: Getting executable path...')
    let executablePath: string
    try {
      executablePath = await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      )
      console.log('Executable path:', executablePath)
    } catch (e: any) {
      console.log('executablePath error:', e.message)
      return NextResponse.json({ error: 'executablePath failed', detail: e.message }, { status: 500 })
    }

    // STEP 6 - Launch browser
    console.log('Step 6: Launching browser...')
    let browser: any
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 794, height: 1123 },
        executablePath,
        headless: true,
      })
      console.log('Browser launched OK')
    } catch (e: any) {
      console.log('Browser launch error:', e.message)
      return NextResponse.json({ error: 'Browser launch failed', detail: e.message }, { status: 500 })
    }

    // STEP 7 - Generate HTML
    console.log('Step 7: Generating HTML...')
    const cores = catalog.cores || {}
    const capa = catalog.capa || {}
    const paginas = catalog.paginas || []

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 794px; font-family: Georgia, serif; background: white; }
.page { width: 794px; min-height: 1123px; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
</style>
</head>
<body>
<div class="page" style="background:${cores.secundaria || '#0a0d14'};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;">
  <div style="font-size:12px;letter-spacing:0.3em;color:${cores.principal || '#c9a96e'};text-transform:uppercase;margin-bottom:16px;">Catálogo Oficial · 2026</div>
  <h1 style="font-size:52px;font-weight:700;color:${cores.titulos || '#f5f0e8'};margin-bottom:16px;">${capa.nome || 'O Meu Negócio'}</h1>
  <div style="font-size:16px;color:${cores.principal || '#c9a96e'};">${capa.categoria || ''} · ${capa.cidade || ''}</div>
  ${capa.slogan ? `<div style="font-size:14px;color:rgba(255,255,255,0.6);font-style:italic;margin-top:12px;">${capa.slogan}</div>` : ''}
</div>
${paginas.map((p: any, i: number) => `
<div class="page" style="background:${cores.fundo || '#ffffff'};padding:48px 56px;">
  <h2 style="font-size:36px;font-weight:700;color:${cores.titulos || '#0a0d14'};margin-bottom:16px;">${p.titulo || ''}</h2>
  ${p.descricao ? `<p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:24px;">${p.descricao}</p>` : ''}
  ${p.preco ? `<div style="font-size:42px;font-weight:700;color:${cores.precos || '#c9a96e'};">${p.preco}</div>` : ''}
  <div style="position:absolute;bottom:24px;right:56px;font-size:11px;color:#aaa;">${i + 2}</div>
</div>`).join('')}
<div class="page" style="background:${cores.secundaria || '#0a0d14'};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;">
  <div style="font-size:28px;font-weight:700;color:${cores.titulos || '#f5f0e8'};margin-bottom:12px;">${capa.nome || ''}</div>
  <div style="font-size:14px;color:${cores.principal || '#c9a96e'};">vitrinepro.com/catalogo/${catalog.slug || ''}</div>
  <div style="margin-top:40px;font-size:12px;color:rgba(255,255,255,0.3);">Gerado pela VitrinePro</div>
</div>
</body>
</html>`

    // STEP 8 - Render PDF
    console.log('Step 8: Rendering PDF...')
    let pdf: Buffer
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 25000 })
      pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      })
      await browser.close()
      console.log('PDF generated, size:', pdf.length, 'bytes')
    } catch (e: any) {
      console.log('PDF render error:', e.message)
      await browser.close().catch(() => {})
      return NextResponse.json({ error: 'PDF render failed', detail: e.message }, { status: 500 })
    }

    // STEP 9 - Return PDF
    console.log('Step 9: Returning PDF...')
    const nomeFicheiro = (capa.nome || 'catalogo').toLowerCase().replace(/\s+/g, '-')

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeFicheiro}_catalogo.pdf"`,
      }
    })

  } catch (e: any) {
    console.log('=== UNHANDLED ERROR ===', e.message, e.stack)
    return NextResponse.json({
      error: 'Unhandled error',
      detail: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}

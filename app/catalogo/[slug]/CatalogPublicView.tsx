"use client"
import { FlipbookPreview } from "@/components/catalog/FlipbookPreview"
import type { Catalog } from "@/types/catalog"

export default function CatalogPublicView({ catalog }: { catalog: Catalog }) {
  const corPrincipal = catalog.cores?.principal || '#c9a96e'

  return (
    <div style={{ minHeight: '100vh', background: '#080b12', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* HEADER */}
      <header style={{
        width: '100%', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
        background: 'rgba(10,13,20,0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <a href="https://vitrinepro.com" style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#c9a96e', textDecoration: 'none' }}>
          VitrinePro
        </a>
        <a href="https://vitrinepro.com/register" style={{
          background: '#c9a96e', color: '#0a0d14',
          padding: '8px 20px', borderRadius: '6px',
          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        }}>
          Criar a minha vitrine grátis →
        </a>
      </header>

      {/* DESCRIÇÃO DA CAPA */}
      <div style={{ width: '100%', maxWidth: '800px', padding: '48px 24px 32px', textAlign: 'center' }}>

        {catalog.capa?.logo && (
          <img src={catalog.capa.logo} alt={catalog.capa?.nome}
            style={{
              width: '90px', height: '90px', borderRadius: '50%',
              objectFit: 'cover', border: `3px solid ${corPrincipal}`,
              marginBottom: '20px', display: 'block', margin: '0 auto 20px',
            }}
          />
        )}

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 700, color: '#f5f0e8',
          marginBottom: '10px', lineHeight: 1.2,
        }}>
          {catalog.capa?.nome || 'Catálogo'}
        </h1>

        <div style={{ fontSize: '15px', color: corPrincipal, marginBottom: '14px', letterSpacing: '0.05em' }}>
          {catalog.capa?.categoria} · {catalog.capa?.cidade}
        </div>

        {catalog.capa?.slogan && (
          <div style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.5)',
            fontStyle: 'italic', maxWidth: '480px',
            margin: '0 auto 16px', lineHeight: 1.7,
          }}>
            &quot;{catalog.capa.slogan}&quot;
          </div>
        )}

        <div style={{ width: '48px', height: '2px', background: corPrincipal, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          <span>📄 {catalog.paginas?.length || 0} produtos</span>
          <span>📅 Catálogo 2026</span>
          <span>🌐 vitrinepro.com</span>
        </div>
      </div>

      {/* FLIPBOOK */}
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 16px 32px' }}>
        <FlipbookPreview catalog={catalog} fullscreen={false} />
      </div>

      {/* BOTÃO EXPORTAR PDF */}
      <div style={{ padding: '0 16px 56px', textAlign: 'center' }}>
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/catalog/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ catalogId: catalog.id }),
              })
              if (res.ok) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${catalog.capa?.nome || 'catalogo'}_catalogo.pdf`
                a.click()
                URL.revokeObjectURL(url)
              }
            } catch (e) {
              console.error('Erro ao exportar PDF:', e)
            }
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(201,169,110,0.1)',
            border: '1px solid rgba(201,169,110,0.3)',
            color: '#c9a96e', padding: '14px 32px',
            borderRadius: '8px', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* FOOTER */}
      <footer style={{
        padding: '24px', textAlign: 'center',
        fontSize: '11px', color: 'rgba(255,255,255,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%',
      }}>
        Feito com ♥ pela{' '}
        <a href="https://vitrinepro.com" style={{ color: '#c9a96e', textDecoration: 'none', fontWeight: 600 }}>
          VitrinePro
        </a>
      </footer>
    </div>
  )
}

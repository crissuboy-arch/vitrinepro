"use client"
import { useState } from "react"
import Link from "next/link"
import { FlipbookPreview } from "@/components/catalog/FlipbookPreview"
import type { Catalog } from "@/types/catalog"

export default function CatalogPublicView({ catalog }: { catalog: Catalog }) {
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleExport = async () => {
    if (exporting || !catalog.id) return
    setExporting(true)
    try {
      const res = await fetch("/api/catalog/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogId: catalog.id }),
      })
      if (!res.ok) { showToast("Erro ao exportar PDF."); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${catalog.capa.nome || "catalogo"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast("Erro ao exportar PDF.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", color: "#f5f0e8", fontFamily: "Inter, system-ui, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#ef4444", color: "#fff", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, zIndex: 9999, fontSize: "13px", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#ffffff" }}>Vitrine</span>
            <span style={{ color: "#c9a96e" }}>Pro</span>
          </span>
        </Link>
        <Link
          href="/?utm_source=catalogo_publico"
          style={{ padding: "8px 18px", background: "#c9a96e", color: "#0a0d14", borderRadius: "8px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}
        >
          Criar o meu catálogo grátis →
        </Link>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#f5f0e8", marginBottom: "8px", lineHeight: 1.2 }}>
            {catalog.capa.nome}
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            {catalog.capa.categoria}{catalog.capa.cidade ? ` · ${catalog.capa.cidade}` : ""}
          </p>
        </div>

        <FlipbookPreview catalog={catalog} />

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: "13px 32px",
              background: exporting ? "rgba(201,169,110,0.4)" : "#c9a96e",
              color: "#0a0d14",
              border: "none",
              borderRadius: "10px",
              cursor: exporting ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 700,
              transition: "all 0.2s",
            }}
          >
            {exporting ? "A preparar PDF..." : "📄 Exportar PDF"}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 24px", textAlign: "center", fontSize: "12px", color: "#333" }}>
        Criado com{" "}
        <Link href="/" style={{ color: "#c9a96e", textDecoration: "none" }}>VitrinePro</Link>
        {" "}· vitrinepro.com
      </footer>
    </div>
  )
}

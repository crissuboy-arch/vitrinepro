"use client"
import { useState, useEffect } from "react"
import { Catalog, CatalogPagina } from "@/types/catalog"

const modeloStyles = {
  elegante:    { fundo: "#ffffff", texto: "#0a0d14", destaque: "#c9a96e", fonte: "'Georgia', serif" },
  luxo:        { fundo: "#0a0d14", texto: "#f5f0e8", destaque: "#c9a96e", fonte: "'Georgia', serif" },
  moderno:     { fundo: "#1a1a2e", texto: "#ffffff",  destaque: "#4f46e5", fonte: "Inter, sans-serif" },
  minimalista: { fundo: "#f8f8f8", texto: "#111111",  destaque: "#333333", fonte: "Inter, sans-serif" },
}

type PageEntry =
  | { type: "capa" }
  | { type: "pagina"; data: CatalogPagina }
  | { type: "contracapa" }

export function FlipbookPreview({
  catalog,
  fullscreen = false,
}: {
  catalog: Catalog
  fullscreen?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [animating, setAnimating] = useState(false)
  const style = modeloStyles[catalog.modelo]
  const cores = catalog.cores

  const pages: PageEntry[] = [
    { type: "capa" },
    ...catalog.paginas.map((p): PageEntry => ({ type: "pagina", data: p })),
    { type: "contracapa" },
  ]

  const totalPages = pages.length
  const currentData = pages[currentPage]

  const goTo = (dir: "prev" | "next") => {
    if (animating) return
    if (dir === "prev" && currentPage === 0) return
    if (dir === "next" && currentPage === totalPages - 1) return
    setAnimating(true)
    setTimeout(() => {
      setCurrentPage(prev => (dir === "next" ? prev + 1 : prev - 1))
      setAnimating(false)
    }, 350)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo("prev")
      if (e.key === "ArrowRight") goTo("next")
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentPage, animating])

  const pageH = fullscreen ? "560px" : "400px"

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: fullscreen ? "900px" : "600px",
    margin: "0 auto",
    fontFamily: style.fonte,
  }

  const pageStyle: React.CSSProperties = {
    background: cores.fundo || style.fundo,
    borderRadius: "8px",
    overflow: "hidden",
    minHeight: pageH,
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: animating ? 0 : 1,
    transform: animating ? "scale(0.98)" : "scale(1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    position: "relative",
  }

  return (
    <div style={containerStyle}>
      {/* Page */}
      <div style={pageStyle}>

        {/* CAPA */}
        {currentData.type === "capa" && (
          <div style={{ height: pageH, position: "relative", background: cores.secundaria || style.fundo }}>
            {catalog.capa.imagem && (
              <img
                src={catalog.capa.imagem}
                alt="capa"
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
              {catalog.capa.logo && (
                <img src={catalog.capa.logo} alt="logo" style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "50%", marginBottom: "24px", border: `2px solid ${cores.principal}` }} />
              )}
              <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: cores.principal, textTransform: "uppercase", marginBottom: "12px" }}>
                Catálogo Oficial · 2026
              </div>
              <h1 style={{ fontFamily: style.fonte, fontSize: fullscreen ? "42px" : "30px", fontWeight: 700, color: cores.titulos || "#f5f0e8", lineHeight: 1.1, marginBottom: "12px" }}>
                {catalog.capa.nome || "Nome do Negócio"}
              </h1>
              <div style={{ fontSize: "13px", color: cores.principal, marginBottom: "8px" }}>
                {catalog.capa.categoria}{catalog.capa.cidade ? ` · ${catalog.capa.cidade}` : ""}
              </div>
              {catalog.capa.slogan && (
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                  {catalog.capa.slogan}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PÁGINA INTERNA */}
        {currentData.type === "pagina" && (
          <div style={{ minHeight: pageH, display: "flex", flexDirection: "column" }}>
            {currentData.data.imagem && (
              <div style={{ height: "200px", overflow: "hidden" }}>
                <img src={currentData.data.imagem} alt={currentData.data.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ padding: "28px 32px", flex: 1 }}>
              {currentData.data.destaque && (
                <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: cores.principal, textTransform: "uppercase", marginBottom: "8px" }}>
                  ⭐ Destaque
                </div>
              )}
              <h2 style={{ fontFamily: style.fonte, fontSize: "24px", fontWeight: 700, color: cores.titulos || style.texto, marginBottom: "10px" }}>
                {currentData.data.titulo}
              </h2>
              {currentData.data.descricao && (
                <p style={{ fontSize: "13px", color: style.texto, opacity: 0.7, lineHeight: 1.6, marginBottom: "16px" }}>
                  {currentData.data.descricao}
                </p>
              )}
              {currentData.data.preco && (
                <div style={{ fontFamily: style.fonte, fontSize: "28px", fontWeight: 700, color: cores.precos || cores.principal }}>
                  {currentData.data.preco}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTRACAPA */}
        {currentData.type === "contracapa" && (
          <div style={{ minHeight: pageH, background: cores.secundaria || style.fundo, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
            <div style={{ fontFamily: style.fonte, fontSize: "22px", fontWeight: 700, color: cores.titulos || "#f5f0e8", marginBottom: "8px" }}>
              {catalog.capa.nome}
            </div>
            <div style={{ fontSize: "12px", color: cores.principal, marginBottom: "24px" }}>
              vitrinepro.com/catalogo/{catalog.slug || "o-seu-negocio"}
            </div>
            <div style={{ height: "1px", width: "60px", background: cores.principal, margin: "0 auto 24px" }} />
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Gerado pela VitrinePro</div>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", padding: "0 8px" }}>
        <button
          onClick={() => goTo("prev")}
          disabled={currentPage === 0}
          style={{
            background: currentPage === 0 ? "rgba(201,169,110,0.1)" : "#c9a96e",
            color: currentPage === 0 ? "#555" : "#0a0d14",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: currentPage === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "16px",
            transition: "all 0.2s",
          }}
        >←</button>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {pages.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                if (animating || i === currentPage) return
                setAnimating(true)
                setTimeout(() => { setCurrentPage(i); setAnimating(false) }, 350)
              }}
              style={{
                width: i === currentPage ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === currentPage ? "#c9a96e" : "rgba(201,169,110,0.3)",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo("next")}
          disabled={currentPage === totalPages - 1}
          style={{
            background: currentPage === totalPages - 1 ? "rgba(201,169,110,0.1)" : "#c9a96e",
            color: currentPage === totalPages - 1 ? "#555" : "#0a0d14",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "16px",
            transition: "all 0.2s",
          }}
        >→</button>
      </div>

      <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px", color: "#666", letterSpacing: "0.1em" }}>
        PÁGINA {currentPage + 1} DE {totalPages}
      </div>
    </div>
  )
}

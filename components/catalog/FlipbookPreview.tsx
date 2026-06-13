"use client"
import { useState, useEffect } from "react"
import { Catalog, CatalogPagina } from "@/types/catalog"

type PageEntry =
  | { type: "capa" }
  | { type: "pagina"; data: CatalogPagina }
  | { type: "contracapa" }

// Pick a readable text colour for the internal pages from the background luminance.
function isLightColor(hex: string): boolean {
  const c = (hex || "").replace("#", "")
  if (c.length < 6) return true
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

export function FlipbookPreview({
  catalog,
  fullscreen = false,
}: {
  catalog: Catalog
  fullscreen?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [animating, setAnimating] = useState(false)
  const cores = catalog.cores
  const logoPosition = ((catalog.capa as { logoPosition?: "center" | "top-right" | "top-left" }).logoPosition) || "center"
  const mostrarNome = (catalog.capa as { mostrarNome?: boolean }).mostrarNome !== false
  const fundoClaro = isLightColor(cores.fundo || "#ffffff")
  const textoTitulo = fundoClaro ? "#0a0d14" : "#f5f0e8"
  const textoCorpo = fundoClaro ? "rgba(10,13,20,0.72)" : "rgba(245,240,232,0.72)"

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

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: fullscreen ? "520px" : "420px",
    margin: "0 auto",
    fontFamily: "Georgia, serif",
  }

  const pageStyle: React.CSSProperties = {
    background: cores.fundo || "#ffffff",
    borderRadius: "4px",
    overflow: "hidden",
    minHeight: fullscreen ? "735px" : "594px", // proporção A4: largura x 1.414
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: animating ? 0 : 1,
    transform: animating ? "scale(0.98)" : "scale(1)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 4px 0 12px rgba(0,0,0,0.15)",
    position: "relative",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  return (
    <div style={containerStyle}>
      {/* Page */}
      <div style={pageStyle}>

        {/* CAPA */}
        {currentData.type === "capa" && (
          <div style={{
            height: fullscreen ? "735px" : "594px",
            position: "relative",
            background: cores.secundaria || "#0a0d14",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {catalog.capa?.imagem && (
              <img
                src={catalog.capa.imagem}
                alt="capa"
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
            {catalog.capa?.logo && logoPosition !== "center" && (
              <img
                src={catalog.capa.logo}
                alt="logo"
                style={{
                  position: "absolute",
                  top: "20px",
                  ...(logoPosition === "top-right" ? { right: "20px" } : { left: "20px" }),
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${cores.principal || "#c9a96e"}`,
                  zIndex: 2,
                }}
              />
            )}
            <div style={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              textAlign: "center"
            }}>
              {catalog.capa?.logo && logoPosition === "center" && (
                <img
                  src={catalog.capa.logo}
                  alt="logo"
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                    borderRadius: "50%",
                    marginBottom: "28px",
                    border: `2px solid ${cores.principal || "#c9a96e"}`
                  }}
                />
              )}
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.3em",
                color: cores.principal || "#c9a96e",
                textTransform: "uppercase",
                marginBottom: "16px"
              }}>
                Catálogo Oficial · 2026
              </div>
              {mostrarNome && (
                <>
                  <h1 style={{
                    fontFamily: "Georgia, serif",
                    fontSize: fullscreen ? "48px" : "36px",
                    fontWeight: 700,
                    color: cores.titulos || "#f5f0e8",
                    lineHeight: 1.1,
                    marginBottom: "14px"
                  }}>
                    {catalog.capa?.nome || "Nome do Negócio"}
                  </h1>
                  <div style={{
                    fontSize: "14px",
                    color: cores.principal || "#c9a96e",
                    marginBottom: "10px"
                  }}>
                    {catalog.capa?.categoria} · {catalog.capa?.cidade}
                  </div>
                </>
              )}
              {catalog.capa?.slogan && (
                <div style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.6)",
                  fontStyle: "italic",
                  maxWidth: "300px"
                }}>
                  {catalog.capa.slogan}
                </div>
              )}
              <div style={{
                position: "absolute",
                bottom: "24px",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.4)"
              }}>
                MENU 2026
              </div>
            </div>
          </div>
        )}

        {/* PÁGINA INTERNA */}
        {currentData.type === "pagina" && (
          <div style={{
            minHeight: fullscreen ? "600px" : "480px",
            display: "flex",
            flexDirection: "column",
            background: cores.fundo || "#ffffff"
          }}>
            {/* Imagem se existir */}
            {currentData.data.imagem && (
              <div style={{ height: "240px", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src={currentData.data.imagem}
                  alt={currentData.data.titulo || ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Conteúdo */}
            <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

              {/* Badge destaque */}
              {currentData.data.destaque && (
                <div style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: cores.principal || "#c9a96e",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  fontWeight: 600
                }}>
                  ⭐ DESTAQUE
                </div>
              )}

              {/* Título */}
              <h2 style={{
                fontFamily: "Georgia, serif",
                fontSize: fullscreen ? "32px" : "26px",
                fontWeight: 700,
                color: textoTitulo,
                marginBottom: "14px",
                lineHeight: 1.2
              }}>
                {currentData.data.titulo || "Sem título"}
              </h2>

              {/* Linha decorativa */}
              <div style={{
                width: "48px",
                height: "2px",
                background: cores.principal || "#c9a96e",
                marginBottom: "16px"
              }} />

              {/* Descrição */}
              {currentData.data.descricao && (
                <p style={{
                  fontSize: "14px",
                  color: textoCorpo,
                  opacity: 1,
                  lineHeight: 1.7,
                  marginBottom: "24px"
                }}>
                  {currentData.data.descricao}
                </p>
              )}

              {/* Preço */}
              {currentData.data.preco && (
                <div style={{
                  fontFamily: "Georgia, serif",
                  fontSize: fullscreen ? "42px" : "34px",
                  fontWeight: 700,
                  color: cores.precos || cores.principal || "#c9a96e",
                  marginTop: "auto"
                }}>
                  {currentData.data.preco}
                </div>
              )}
            </div>

            {/* Rodapé da página */}
            <div style={{
              padding: "12px 40px",
              borderTop: `1px solid ${cores.principal || "#c9a96e"}22`,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#aaa"
            }}>
              <span>{catalog.capa?.nome || ""}</span>
              <span>{currentPage + 1}</span>
            </div>
          </div>
        )}

        {/* CONTRACAPA */}
        {currentData.type === "contracapa" && (
          <div style={{
            height: fullscreen ? "735px" : "594px",
            background: cores.secundaria || "#0a0d14",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px",
            textAlign: "center"
          }}>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: "26px",
              fontWeight: 700,
              color: cores.titulos || "#f5f0e8",
              marginBottom: "10px"
            }}>
              {catalog.capa?.nome}
            </div>
            <div style={{
              fontSize: "13px",
              color: cores.principal || "#c9a96e",
              marginBottom: "32px"
            }}>
              {`${process.env.NEXT_PUBLIC_APP_URL || 'https://vitrinepro.com'}/catalogo/${catalog.slug || "o-seu-negocio"}`}
            </div>
            <div style={{
              height: "1px",
              width: "60px",
              background: cores.principal || "#c9a96e",
              margin: "0 auto 32px"
            }} />
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
              Gerado pela VitrinePro
            </div>
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

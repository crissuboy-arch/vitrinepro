"use client"
import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react"

const vitrines = [
  {
    nome: "Tasca do Zé",
    tipo: "Restaurante · Lisboa",
    emoji: "🍽️",
    rating: "4.9",
    badge: "Pro",
    imagem: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    items: [
      { nome: "Bacalhau à Brás", preco: "€12.90" },
      { nome: "Prego no Pão", preco: "€8.50" },
      { nome: "Arroz de Marisco", preco: "€18.00" },
    ],
    visitas: "1.2k", curtidas: "84", favoritos: "37", partilhas: "12",
  },
  {
    nome: "Corte Fino Barber",
    tipo: "Barbearia · Porto",
    emoji: "💈",
    rating: "4.9",
    badge: "Pro",
    imagem: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    items: [
      { nome: "Corte Clássico", preco: "€12.00" },
      { nome: "Corte + Barba", preco: "€18.00" },
    ],
    visitas: "843", curtidas: "56", favoritos: "23", partilhas: "8",
  },
  {
    nome: "Skin Glow Studio",
    tipo: "Estética · Cascais",
    emoji: "💆",
    rating: "5.0",
    badge: "Business",
    imagem: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    items: [
      { nome: "Limpeza de Pele", preco: "€45.00" },
      { nome: "Massagem Facial", preco: "€35.00" },
      { nome: "Peeling", preco: "€55.00" },
    ],
    visitas: "2.1k", curtidas: "142", favoritos: "89", partilhas: "31",
  },
  {
    nome: "Pastelaria Doce Lisboa",
    tipo: "Pastelaria · Sintra",
    emoji: "🎂",
    rating: "4.8",
    badge: "Pro",
    imagem: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80",
    items: [
      { nome: "Pastel de Nata", preco: "€1.20" },
      { nome: "Bolo de Aniversário", preco: "€35.00" },
      { nome: "Croissant", preco: "€1.80" },
    ],
    visitas: "976", curtidas: "201", favoritos: "67", partilhas: "44",
  },
]

const controlBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#c9a96e",
  fontSize: "20px",
  lineHeight: 1,
  padding: "2px 8px",
  borderRadius: "6px",
}

export function HeroCarrossel() {
  const [atual, setAtual] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  // Cross-fade then swap the active slide.
  const change = useCallback((next: (prev: number) => number) => {
    setAnimating(true)
    setTimeout(() => {
      setAtual(next)
      setAnimating(false)
    }, 400)
  }, [])

  const goNext = useCallback(() => change((p) => (p + 1) % vitrines.length), [change])
  const goPrev = useCallback(() => change((p) => (p - 1 + vitrines.length) % vitrines.length), [change])
  const goTo = useCallback((i: number) => change(() => i), [change])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(goNext, 3500)
    return () => clearInterval(timer)
  }, [paused, goNext])

  const v = vitrines[atual]

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Vitrines em destaque"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 40) { if (dx < 0) goNext(); else goPrev() }
        touchStartX.current = null
      }}
      style={{
        width: "100%",
        maxWidth: "580px",
        margin: "0 auto",
      }}
    >
      <div style={{ transition: "opacity 0.4s ease", opacity: animating ? 0 : 1 }}>
      {/* Browser top bar */}
      <div style={{
        background: "#1e2433",
        borderRadius: "12px 12px 0 0",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <div style={{ display: "flex", gap: "5px" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1,
          background: "#2a3347",
          borderRadius: "6px",
          padding: "3px 10px",
          fontSize: "11px",
          color: "#888",
          textAlign: "center",
        }}>
          vitrinepro.com/vitrine/{v.nome.toLowerCase().replace(/\s+/g, "-")}
        </div>
      </div>

      {/* Vitrine card */}
      <div style={{
        background: "#1a2235",
        borderRadius: "0 0 12px 12px",
        overflow: "hidden",
        border: "1px solid rgba(201,169,110,0.15)",
        borderTop: "none",
      }}>
        {/* Cover image */}
        <div style={{ height: "140px", position: "relative", overflow: "hidden" }}>
          <img
            src={v.imagem}
            alt={v.nome}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(26,34,53,0.8) 100%)",
          }} />
          <div style={{
            position: "absolute", bottom: 10, left: 12,
            background: "rgba(26,34,53,0.9)",
            border: "1px solid rgba(201,169,110,0.3)",
            borderRadius: "6px",
            padding: "3px 10px",
            fontSize: "11px",
            color: "#c9a96e",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            📄 Catálogo PDF
          </div>
          <div style={{
            position: "absolute", bottom: 10, right: 12,
            fontSize: "12px", color: "#f5f0e8", fontWeight: 600,
          }}>
            ★ {v.rating}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>{v.emoji}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f5f0e8" }}>{v.nome}</span>
                <span style={{
                  background: "rgba(201,169,110,0.2)",
                  color: "#c9a96e",
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}>✦ {v.badge}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>📍 {v.tipo}</div>
            </div>
            <div style={{
              marginLeft: "auto",
              background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.2)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "10px",
              color: "#c9a96e",
            }}>
              📍 Google Maps
            </div>
          </div>

          {/* Items */}
          <div style={{
            display: "grid",
            gridTemplateColumns: v.items.length === 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(72px, 1fr))",
            gap: "6px",
            margin: "12px 0",
          }}>
            {v.items.map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "8px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                minWidth: 0,
              }}>
                <div style={{ fontSize: "11px", color: "#ccc", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nome}</div>
                <div style={{ fontSize: "13px", color: "#c9a96e", fontWeight: 700, marginTop: "2px" }}>{item.preco}</div>
              </div>
            ))}
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <div style={{
              flex: 1, background: "#25d366", borderRadius: "8px",
              padding: "8px", textAlign: "center",
              fontSize: "12px", fontWeight: 600, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            }}>
              💬 WhatsApp
            </div>
            <div style={{
              flex: 1, background: "rgba(201,169,110,0.1)", borderRadius: "8px",
              padding: "8px", textAlign: "center",
              fontSize: "12px", fontWeight: 500, color: "#c9a96e",
              border: "1px solid rgba(201,169,110,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            }}>
              📄 Catálogo PDF
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: "11px", color: "#666" }}>
            <span>👁 {v.visitas}</span>
            <span>❤️ {v.curtidas}</span>
            <span>⭐ {v.favoritos}</span>
            <span>↗ {v.partilhas}</span>
          </div>
        </div>
      </div>
      </div>

      {/* Controls: prev · dots · next */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "12px" }}>
        <button
          type="button"
          onClick={goPrev}
          aria-label="Vitrine anterior"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a96e]"
          style={controlBtn}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
          {vitrines.map((vit, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Mostrar ${vit.nome}`}
              aria-current={i === atual ? "true" : undefined}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a96e]"
              style={{
                width: i === atual ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === atual ? "#c9a96e" : "rgba(201,169,110,0.3)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Próxima vitrine"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a96e]"
          style={controlBtn}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/app/lib/supabase"
import { FlipbookPreview } from "@/components/catalog/FlipbookPreview"
import type { Catalog, CatalogModelo, CatalogCores, CatalogPagina } from "@/types/catalog"

// ── Constants ──────────────────────────────────────────────────────────────────

const MODELOS: { id: CatalogModelo; label: string; desc: string; bg: string; accent: string; textColor: string }[] = [
  { id: "elegante",    label: "Elegante",    desc: "Clássico e refinado", bg: "#ffffff", accent: "#c9a96e", textColor: "#0a0d14" },
  { id: "luxo",        label: "Luxo",        desc: "Escuro e premium",    bg: "#0a0d14", accent: "#c9a96e", textColor: "#f5f0e8" },
  { id: "moderno",     label: "Moderno",     desc: "Tecnológico",         bg: "#1a1a2e", accent: "#4f46e5", textColor: "#ffffff" },
  { id: "minimalista", label: "Minimalista", desc: "Limpo e simples",     bg: "#f8f8f8", accent: "#333333", textColor: "#111111" },
]

const COLOR_FIELDS: { key: keyof CatalogCores; label: string }[] = [
  { key: "principal",  label: "Cor Principal" },
  { key: "secundaria", label: "Cor Secundária" },
  { key: "titulos",    label: "Cor dos Títulos" },
  { key: "precos",     label: "Cor dos Preços" },
  { key: "fundo",      label: "Cor do Fundo" },
]

const INITIAL_CATALOG: Catalog = {
  business_id: "",
  nome: "O Meu Catálogo",
  modelo: "elegante",
  cores: { principal: "#c9a96e", secundaria: "#0a0d14", titulos: "#f5f0e8", precos: "#c9a96e", fundo: "#ffffff" },
  capa: { nome: "", categoria: "", cidade: "", slogan: "" },
  paginas: [],
  publico: false,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// Compress/resize before base64 so the data URL stays small (~150-250KB). Fixes
// blank product images in the exported PDF (huge full-res base64 didn't decode in
// time for puppeteer's page.pdf) and keeps the catalog row light.
const compressImage = (file: File, maxDim = 1280, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim }
          else { width = Math.round((width * maxDim) / height); height = maxDim }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })

type LogoPosition = 'center' | 'top-right' | 'top-left'

const toSlug = (text: string, id: string): string =>
  (text || "catalogo").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + id.slice(0, 6)

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0d14",
  border: "1px solid rgba(201,169,110,0.2)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#f5f0e8",
  fontSize: "13px",
  outline: "none",
}

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "6px",
  display: "block",
}

const cardStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
}

// ── Component ──────────────────────────────────────────────────────────────────

type Tab = "design" | "content" | "preview"

export default function CatalogEditorPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("design")
  const [catalog, setCatalog] = useState<Catalog>(INITIAL_CATALOG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Load on mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { router.push("/login"); return }

        const { data: biz } = await supabase
          .from("businesses")
          .select("id, name, category, city")
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (!biz) { setLoading(false); return }

        const base: Catalog = {
          ...INITIAL_CATALOG,
          business_id: biz.id,
          capa: { ...INITIAL_CATALOG.capa, nome: biz.name || "", categoria: biz.category || "", cidade: biz.city || "" },
        }

        const { data: existing } = await supabase
          .from("catalogs")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        setCatalog(existing ? { ...base, ...existing } : base)
      } catch (err) {
        console.error("[CatalogEditor] load error", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { showToast("Sessão expirada", false); return }

      const slug = catalog.slug || toSlug(catalog.capa.nome || catalog.nome, catalog.business_id)
      const payload = { ...catalog, slug, user_id: session.user.id, updated_at: new Date().toISOString() }

      if (catalog.id) {
        const { error } = await supabase.from("catalogs").update(payload).eq("id", catalog.id)
        if (error) throw error
        showToast("Catálogo guardado!")
      } else {
        const { data, error } = await supabase.from("catalogs").insert(payload).select().single()
        if (error) throw error
        if (data) setCatalog(prev => ({ ...prev, id: data.id, slug: data.slug }))
        showToast("Catálogo criado!")
      }
    } catch (err: any) {
      showToast(err?.message || "Erro ao guardar", false)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    if (!catalog.id && !catalog.slug) { showToast("Guarda o catálogo primeiro", false); return }
    setSharing(true)
    const slug = catalog.slug || catalog.id || ""
    try {
      await navigator.clipboard.writeText(`https://vitrinepro.com/catalogo/${slug}`)
      showToast("Link copiado!")
    } catch {
      showToast("Erro ao copiar link", false)
    } finally {
      setSharing(false)
    }
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { showToast("Sessão expirada", false); return }

      const res = await fetch("/api/catalog/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ catalogId: catalog.id, businessId: catalog.business_id }),
      })

      if (!res.ok) { showToast("Erro ao exportar PDF.", false); return }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${catalog.nome || "catalogo"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast("Erro ao exportar PDF.", false)
    } finally {
      setExporting(false)
    }
  }

  // ── Public toggle ─────────────────────────────────────────────────────────────

  const handleTogglePublic = async () => {
    if (!catalog.id) { showToast("Guarda o catálogo primeiro.", false); return }
    const newPublico = !catalog.publico
    let newSlug = catalog.slug
    if (newPublico && !newSlug) {
      const rand = Math.random().toString(36).substring(2, 6)
      newSlug = (catalog.capa.nome || catalog.nome)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + rand
    }
    setCatalog(prev => ({ ...prev, publico: newPublico, slug: newSlug }))
    const { error } = await supabase
      .from("catalogs")
      .update({ publico: newPublico, slug: newSlug })
      .eq("id", catalog.id)
    if (error) {
      showToast("Erro ao actualizar.", false)
      setCatalog(prev => ({ ...prev, publico: !newPublico }))
    } else {
      showToast(newPublico ? "Catálogo tornado público!" : "Catálogo definido como privado.")
    }
  }

  // ── Page mutations ────────────────────────────────────────────────────────────

  const addPage = () => {
    const newPage: CatalogPagina = { id: crypto.randomUUID(), titulo: "", descricao: "", preco: "", destaque: false }
    setCatalog(prev => ({ ...prev, paginas: [...prev.paginas, newPage] }))
  }

  const updatePage = (id: string, patch: Partial<CatalogPagina>) =>
    setCatalog(prev => ({ ...prev, paginas: prev.paginas.map(p => p.id === id ? { ...p, ...patch } : p) }))

  const removePage = (id: string) =>
    setCatalog(prev => ({ ...prev, paginas: prev.paginas.filter(p => p.id !== id) }))

  const handleFileUpload = async (file: File, target: "logo" | "imagem" | string) => {
    let b64: string
    try { b64 = await compressImage(file) }
    catch { b64 = await fileToBase64(file) }
    if (target === "logo" || target === "imagem") {
      setCatalog(prev => ({ ...prev, capa: { ...prev.capa, [target]: b64 } }))
    } else {
      updatePage(target, { imagem: b64 })
    }
  }

  const logoPosition: LogoPosition =
    ((catalog.capa as { logoPosition?: LogoPosition }).logoPosition) || "center"

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#c9a96e", fontSize: "14px", letterSpacing: "0.05em" }}>A carregar editor...</div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14", color: "#f5f0e8", fontFamily: "Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#c9a96e" : "#ef4444", color: toast.ok ? "#0a0d14" : "#fff",
          padding: "12px 28px", borderRadius: "8px", fontWeight: 700, fontSize: "13px",
          zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
          <button
            onClick={() => setFullscreen(false)}
            style={{ position: "fixed", top: "20px", right: "24px", background: "none", border: "1px solid rgba(201,169,110,0.3)", color: "#c9a96e", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "13px", fontWeight: 600, zIndex: 1001 }}
          >
            ✕ Fechar
          </button>
          <FlipbookPreview catalog={catalog} fullscreen />
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0a0d14", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link href="/dashboard" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>← Dashboard</Link>
          <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
          <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f5f0e8" }}>Editor de Catálogo</h1>
          {catalog.nome && (
            <span style={{ fontSize: "12px", color: "#555", fontWeight: 400 }}>· {catalog.nome}</span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(201,169,110,0.3)", color: "#c9a96e", borderRadius: "8px", cursor: exporting ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 600, opacity: exporting ? 0.5 : 1, transition: "all 0.2s" }}
          >
            {exporting ? "A exportar..." : "Exportar PDF"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#a9b1c3", borderRadius: "8px", cursor: sharing ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 600, opacity: sharing ? 0.5 : 1, transition: "all 0.2s" }}
          >
            {sharing ? "A copiar..." : "Partilhar"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "8px 22px", background: saving ? "rgba(201,169,110,0.4)" : "#c9a96e", color: "#0a0d14", borderRadius: "8px", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s" }}
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", display: "flex" }}>
        {([ ["design", "Desenho"], ["content", "Conteúdo"], ["preview", "Pré-visualizar"] ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "14px 20px", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid #c9a96e" : "2px solid transparent",
              color: tab === t ? "#c9a96e" : "#666",
              cursor: "pointer", fontSize: "13px", fontWeight: tab === t ? 700 : 400,
              transition: "all 0.2s", marginBottom: "-1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Public toggle bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 24px", background: catalog.publico ? "rgba(34,197,94,0.04)" : "transparent", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={handleTogglePublic}>
          <div style={{ width: "44px", height: "24px", background: catalog.publico ? "#22c55e" : "rgba(255,255,255,0.1)", borderRadius: "12px", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: "3px", left: catalog.publico ? "23px" : "3px", width: "18px", height: "18px", background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: "13px", color: catalog.publico ? "#22c55e" : "#666", fontWeight: 600, transition: "color 0.2s" }}>
            {catalog.publico ? "Catálogo público" : "Tornar público"}
          </span>
        </div>

        {catalog.publico && catalog.slug && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
            <span style={{ fontSize: "12px", color: "#555", fontFamily: "monospace" }}>
              vitrinepro.com/catalogo/{catalog.slug}
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://vitrinepro.com/catalogo/${catalog.slug}`)
                  showToast("Link copiado!")
                } catch {
                  showToast("Erro ao copiar", false)
                }
              }}
              style={{ padding: "5px 12px", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.3)", color: "#c9a96e", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
            >
              Copiar link
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div style={{ padding: "32px 24px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* ══ TAB DESENHO ══════════════════════════════════════════════════════ */}
        {tab === "design" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "40px" }}>

            {/* Left panel */}
            <div>
              {/* Modelo */}
              <div style={{ marginBottom: "32px" }}>
                <p style={labelStyle}>Modelo</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {MODELOS.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setCatalog(prev => ({ ...prev, modelo: m.id }))}
                      style={{
                        background: m.bg,
                        border: `2px solid ${catalog.modelo === m.id ? "#c9a96e" : "transparent"}`,
                        outline: catalog.modelo === m.id ? "1px solid rgba(201,169,110,0.4)" : "none",
                        borderRadius: "10px",
                        padding: "16px 14px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ height: "20px", background: m.accent, borderRadius: "4px", marginBottom: "10px", opacity: 0.85 }} />
                      <div style={{ fontSize: "12px", fontWeight: 700, color: m.textColor }}>{m.label}</div>
                      <div style={{ fontSize: "10px", color: m.textColor, opacity: 0.5, marginTop: "2px" }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div>
                <p style={labelStyle}>Cores</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#d0d8e8", fontWeight: 500 }}>{label}</div>
                        <div style={{ fontSize: "10px", color: "#555", marginTop: "2px", fontFamily: "monospace" }}>{catalog.cores[key]}</div>
                      </div>
                      <input
                        type="color"
                        value={catalog.cores[key]}
                        onChange={e => setCatalog(prev => ({ ...prev, cores: { ...prev.cores, [key]: e.target.value } }))}
                        style={{ width: "42px", height: "32px", borderRadius: "6px", border: "2px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: "2px", background: "transparent" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: live preview */}
            <div style={{ position: "sticky", top: "80px", alignSelf: "start" }}>
              <p style={labelStyle}>Pré-visualização ao vivo</p>
              <FlipbookPreview catalog={catalog} />
            </div>
          </div>
        )}

        {/* ══ TAB CONTEÚDO ═════════════════════════════════════════════════════ */}
        {tab === "content" && (
          <div style={{ maxWidth: "720px" }}>

            {/* CAPA */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c9a96e", margin: "0 0 22px" }}>Capa</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Logo */}
                <div>
                  <label style={labelStyle}>Logo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {catalog.capa.logo && (
                      <img src={catalog.capa.logo} alt="logo" style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.3)", flexShrink: 0 }} />
                    )}
                    <label style={{ padding: "8px 16px", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", color: "#c9a96e", fontWeight: 600 }}>
                      Escolher logo
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { if (e.target.files?.[0]) await handleFileUpload(e.target.files[0], "logo") }} />
                    </label>
                    {catalog.capa.logo && (
                      <button onClick={() => setCatalog(prev => ({ ...prev, capa: { ...prev.capa, logo: undefined } }))} style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remover</button>
                    )}
                  </div>
                </div>

                {/* Text fields */}
                {([["Nome do negócio", "nome"], ["Categoria", "categoria"], ["Cidade", "cidade"], ["Slogan (opcional)", "slogan"]] as [string, keyof typeof catalog.capa][]).map(([lbl, field]) => (
                  <div key={String(field)}>
                    <label style={labelStyle}>{lbl}</label>
                    <input
                      type="text"
                      value={(catalog.capa[field] as string) || ""}
                      onChange={e => setCatalog(prev => ({ ...prev, capa: { ...prev.capa, [field]: e.target.value } }))}
                      style={inputStyle}
                      placeholder={lbl}
                    />
                  </div>
                ))}

                {/* Cover image */}
                <div>
                  <label style={labelStyle}>Imagem de Capa</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {catalog.capa.imagem && (
                      <img src={catalog.capa.imagem} alt="capa" style={{ width: "88px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                    )}
                    <label style={{ padding: "8px 16px", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", color: "#c9a96e", fontWeight: 600 }}>
                      Escolher imagem
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { if (e.target.files?.[0]) await handleFileUpload(e.target.files[0], "imagem") }} />
                    </label>
                    {catalog.capa.imagem && (
                      <button onClick={() => setCatalog(prev => ({ ...prev, capa: { ...prev.capa, imagem: undefined } }))} style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remover</button>
                    )}
                  </div>
                </div>

                {/* Logo position */}
                <div>
                  <label style={labelStyle}>Posição do Logo</label>
                  <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                    {([["center", "Centrado"], ["top-right", "Canto sup. direito"], ["top-left", "Canto sup. esquerdo"]] as [LogoPosition, string][]).map(([val, lbl]) => (
                      <label key={val} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#ccc", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="logoPosition"
                          checked={logoPosition === val}
                          onChange={() => setCatalog(prev => ({ ...prev, capa: { ...prev.capa, logoPosition: val } as typeof prev.capa }))}
                          style={{ accentColor: "#c9a96e" }}
                        />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* PÁGINAS */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c9a96e", margin: 0 }}>
                  Páginas <span style={{ color: "#555", fontSize: "12px", fontWeight: 400 }}>({catalog.paginas.length})</span>
                </h3>
                <button
                  onClick={addPage}
                  style={{ padding: "8px 18px", background: "#c9a96e", color: "#0a0d14", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                >
                  + Adicionar Página
                </button>
              </div>

              {catalog.paginas.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#444", fontSize: "13px" }}>
                  Nenhuma página ainda.<br />Clica em "+ Adicionar Página" para começar.
                </div>
              )}

              {catalog.paginas.map((page, index) => (
                <div key={page.id} style={{ background: "#0a0d14", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "18px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>Página {index + 1}</span>
                    <button
                      onClick={() => removePage(page.id)}
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontSize: "12px" }}
                    >
                      ✕ Remover
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Image */}
                    <div>
                      <label style={labelStyle}>Imagem</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {page.imagem && (
                          <img src={page.imagem} alt="" style={{ width: "72px", height: "48px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                        )}
                        <label style={{ padding: "6px 14px", background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "6px", cursor: "pointer", fontSize: "11px", color: "#c9a96e" }}>
                          {page.imagem ? "Alterar" : "Escolher imagem"}
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { if (e.target.files?.[0]) await handleFileUpload(e.target.files[0], page.id) }} />
                        </label>
                        {page.imagem && (
                          <button onClick={() => updatePage(page.id, { imagem: undefined })} style={{ fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕</button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label style={labelStyle}>Título *</label>
                      <input type="text" value={page.titulo} onChange={e => updatePage(page.id, { titulo: e.target.value })} style={inputStyle} placeholder="Nome do produto ou serviço" />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={labelStyle}>Descrição</label>
                      <textarea
                        value={page.descricao || ""}
                        onChange={e => updatePage(page.id, { descricao: e.target.value })}
                        rows={2}
                        style={{ ...inputStyle, resize: "vertical" as const }}
                        placeholder="Descrição opcional..."
                      />
                    </div>

                    {/* Price + Highlight */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "14px", alignItems: "end" }}>
                      <div>
                        <label style={labelStyle}>Preço</label>
                        <input type="text" value={page.preco || ""} onChange={e => updatePage(page.id, { preco: e.target.value })} style={inputStyle} placeholder="ex: €25.00" />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px" }}>
                        <input
                          type="checkbox"
                          id={`destaque-${page.id}`}
                          checked={page.destaque}
                          onChange={e => updatePage(page.id, { destaque: e.target.checked })}
                          style={{ accentColor: "#c9a96e", width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <label htmlFor={`destaque-${page.id}`} style={{ fontSize: "12px", color: "#c9a96e", cursor: "pointer", userSelect: "none" }}>
                          Destaque ⭐
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ══ TAB PRÉ-VISUALIZAR ═══════════════════════════════════════════════ */}
        {tab === "preview" && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button
                onClick={() => setFullscreen(true)}
                style={{ padding: "10px 20px", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.3)", color: "#c9a96e", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
              >
                Ver em fullscreen ↗
              </button>
            </div>
            <FlipbookPreview catalog={catalog} />
          </div>
        )}

      </div>
    </div>
  )
}

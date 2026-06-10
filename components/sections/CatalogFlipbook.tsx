"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

// Photo constants
const COVER      = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
const FRIES_PH   = "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80";
const BRUSCHETTA = "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80";
const CALAMARI   = "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80";
const SHRIMP     = "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&q=80";
const SALMON     = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80";
const BEEF       = "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80";
const PASTA      = "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80";
const PIZZA      = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80";
const RESTO      = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";

// Each page in react-pageflip must be a forwardRef component
const Page = React.forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {children}
    </div>
  )
);
Page.displayName = "Page";

interface Props {
  onCadastrar: (e: React.MouseEvent) => void;
}

// 8 pages: ghost(0) + cover(1) + appL(2) + appR(3) + mainL(4) + mainR(5) + backCover(6) + ghost(7)
// ghost pages at positions 0 and 7 fill the empty side when covers are displayed
const TOTAL_PAGES = 8;

export default function CatalogFlipbook({ onCadastrar }: Props) {
  const bookRef = useRef<any>(null);
  const [FlipBook, setFlipBook] = useState<React.ComponentType<any> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load react-pageflip on client only (avoids SSR document/window errors)
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    import("react-pageflip").then((mod) => {
      // mod.default is the HTMLFlipBook class – wrap in arrow to avoid
      // React treating it as a functional-state updater
      setFlipBook(() => (mod as any).default);
    });
    return () => window.removeEventListener("resize", check);
  }, []);

  const onFlip = useCallback((e: { data: number }) => setCurrentPage(e.data), []);
  const prevPage = () => bookRef.current?.pageFlip?.()?.flipPrev?.();
  const nextPage = () => bookRef.current?.pageFlip?.()?.flipNext?.();

  // On mobile: arrows go below the book, so pageW uses full available width (minus 48px side padding)
  // On desktop: arrows are beside the book, so keep 450px per page
  const containerW = typeof window !== "undefined" ? window.innerWidth : 768;
  const pageW = isMobile
    ? Math.max(Math.floor((containerW - 48) / 2), 130)
    : 450;
  const pageH = isMobile ? Math.max(Math.round(pageW * 1.45), 280) : 580;
  // Spread label: ghost+cover=1, appL+appR=2, mainL+mainR=3, backCover+ghost=4
  const displayPage = Math.floor(currentPage / 2) + 1;
  const displayTotal = TOTAL_PAGES / 2; // 4 spreads

  // ─── Page content ────────────────────────────────────────────────────────

  // Ghost page: matches section background so the empty book side is invisible
  const ghostPage = (
    <Page>
      <div style={{ width: "100%", height: "100%", background: "#080b12" }} />
    </Page>
  );

  const coverPage = (
    <Page>
      <div style={{ position: "relative", width: "100%", height: "100%", background: "#120803" }}>
        <img src={COVER} alt="cover" loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 4,
          background: "linear-gradient(to bottom, #c9a96e, #a07840, #c9a96e)" }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 36px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%",
            border: "1.5px solid rgba(201,169,110,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, fontSize: 22 }}>🍔</div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 700,
            letterSpacing: "0.06em", lineHeight: 1.1 }}>Burger House</div>
          <div style={{ color: "#c9a96e", fontStyle: "italic", fontSize: 13,
            marginTop: 8, letterSpacing: "0.08em" }}>Fresh · Simple · Modern</div>
          <div style={{ width: 36, height: 1, background: "#c9a96e", opacity: 0.5, margin: "20px auto" }} />
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9,
            letterSpacing: "0.2em", textTransform: "uppercase" }}>Good Taste · Modern Spirit</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 10,
            maxWidth: 180, lineHeight: 1.7 }}>
            Every page reflects balance, style, and the joy of good food.
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "8px 0", background: "rgba(0,0,0,0.45)", textAlign: "center" }}>
          <span style={{ color: "#c9a96e", fontSize: 9,
            letterSpacing: "0.2em", textTransform: "uppercase" }}>Menu 2026</span>
        </div>
      </div>
    </Page>
  );

  const appetizersLeft = (
    <Page>
      <div style={{ width: "100%", height: "100%", background: "#faf8f4",
        padding: "28px 22px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ height: 3, background: "linear-gradient(to right, #7b2d1e, transparent)",
          marginBottom: 18 }} />
        <div style={{ fontSize: 21, fontWeight: 700, color: "#7b2d1e",
          fontFamily: "Georgia, serif", marginBottom: 4 }}>Appetizers</div>
        <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em",
          textTransform: "uppercase", marginBottom: 18 }}>Starters & Small Plates</div>
        {[
          { name: "Stuffed Mushrooms",     price: "$9.00",  desc: "Button mushrooms filled with garlic herb cream cheese" },
          { name: "Mini Caprese Skewers",  price: "$7.50",  desc: "Cherry tomatoes, fresh mozzarella, and basil with balsamic glaze" },
          { name: "Spicy Chicken Wings",   price: "$11.00", desc: "Crispy wings in buffalo sauce, served with ranch dip" },
          { name: "Garlic Parmesan Fries", price: "$6.50",  desc: "Golden fries with Parmesan and fresh herbs" },
        ].map((item, i) => (
          <div key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.07)",
            paddingBottom: 11, marginBottom: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a0a05" }}>{item.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7b2d1e", flexShrink: 0 }}>{item.price}</span>
            </div>
            <p style={{ fontSize: 9.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
        <div style={{ position: "absolute", bottom: 22, right: 18 }}>
          <img src={FRIES_PH} alt="Fries" loading="lazy"
            style={{ width: 88, height: 66, objectFit: "cover", borderRadius: 7,
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }} />
          <div style={{ fontSize: 8, color: "#bbb", textAlign: "center", marginTop: 3 }}>
            Garlic Parmesan Fries
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 22, fontSize: 9, color: "#ddd" }}>1</div>
      </div>
    </Page>
  );

  const appetizersRight = (
    <Page>
      <div style={{ width: "100%", height: "100%", background: "#faf8f4",
        padding: "20px 14px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ height: 3, background: "linear-gradient(to right, #7b2d1e, transparent)",
          marginBottom: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 88px",
          gap: 8, height: "calc(100% - 40px)" }}>
          {/* Left: 2 large photos stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Bruschetta Trio", price: "$8.50",  src: BRUSCHETTA },
              { name: "Crispy Calamari", price: "$12.00", src: CALAMARI },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1 }}>
                <img src={item.src} alt={item.name} loading="lazy"
                  style={{ width: "100%", height: "calc(100% - 28px)",
                    objectFit: "cover", borderRadius: 6, display: "block" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#1a0a05" }}>{item.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#7b2d1e" }}>{item.price}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Right: 3 small items + tall photo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { name: "Baked Spinach Dip",      price: "$10.00" },
              { name: "Avocado Spring Rolls",   price: "$9.50" },
              { name: "Cheese & Charcuterie",   price: "$14.00" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(123,45,30,0.04)",
                border: "1px solid rgba(123,45,30,0.1)", borderRadius: 6, padding: "5px 7px" }}>
                <div style={{ fontSize: 7.5, fontWeight: 700, color: "#1a0a05", lineHeight: 1.3 }}>{item.name}</div>
                <div style={{ fontSize: 8, color: "#7b2d1e", fontWeight: 700 }}>{item.price}</div>
              </div>
            ))}
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <img src={SHRIMP} alt="Shrimp Cocktail" loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover",
                  borderRadius: 6, display: "block" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(0,0,0,0.65)", padding: "3px 0",
                borderBottomLeftRadius: 6, borderBottomRightRadius: 6, textAlign: "center" }}>
                <div style={{ fontSize: 7, color: "#fff", fontWeight: 600 }}>Shrimp Cocktail</div>
                <div style={{ fontSize: 7, color: "#c9a96e" }}>$13.00</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 9, color: "#ddd" }}>2</div>
      </div>
    </Page>
  );

  const mainLeft = (
    <Page>
      <div style={{ width: "100%", height: "100%", background: "#faf8f4",
        padding: "28px 22px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ height: 3, background: "linear-gradient(to right, #1a4a2e, transparent)",
          marginBottom: 18 }} />
        <div style={{ fontSize: 21, fontWeight: 700, color: "#1a4a2e",
          fontFamily: "Georgia, serif", marginBottom: 4 }}>Main Courses</div>
        <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em",
          textTransform: "uppercase", marginBottom: 18 }}>Premium Selections</div>
        {[
          { name: "Grilled Salmon",   price: "$22.00", desc: "Atlantic salmon with lemon butter sauce and seasonal vegetables", src: SALMON },
          { name: "Beef Tenderloin",  price: "$28.00", desc: "Premium beef with truffle demi-glace and roasted potatoes", src: BEEF },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <img src={item.src} alt={item.name} loading="lazy"
              style={{ width: "100%", height: 95, objectFit: "cover", borderRadius: 7, display: "block" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a0a05" }}>{item.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a4a2e" }}>{item.price}</span>
            </div>
            <p style={{ fontSize: 9.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
        <div style={{ position: "absolute", bottom: 10, left: 22, fontSize: 9, color: "#ddd" }}>3</div>
      </div>
    </Page>
  );

  const mainRight = (
    <Page>
      <div style={{ width: "100%", height: "100%", background: "#faf8f4",
        padding: "28px 22px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ height: 3, background: "linear-gradient(to right, #1a4a2e, transparent)",
          marginBottom: 16 }} />
        {[
          { name: "Pasta Carbonara",  price: "$16.00", desc: "Classic Roman pasta with pancetta, egg yolk, and aged Parmesan", src: PASTA },
          { name: "Margherita Pizza", price: "$14.00", desc: "Wood-fired base with San Marzano tomatoes, buffalo mozzarella, and fresh basil", src: PIZZA },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <img src={item.src} alt={item.name} loading="lazy"
              style={{ width: "100%", height: 95, objectFit: "cover", borderRadius: 7, display: "block" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a0a05" }}>{item.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a4a2e" }}>{item.price}</span>
            </div>
            <p style={{ fontSize: 9.5, color: "#999", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Gluten-Free Options", "Vegetarian", "Chef's Selection"].map((tag) => (
              <span key={tag} style={{ fontSize: 7.5, color: "#1a4a2e",
                border: "1px solid rgba(26,74,46,0.3)", borderRadius: 999, padding: "2px 8px" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 10, right: 22, fontSize: 9, color: "#ddd" }}>4</div>
      </div>
    </Page>
  );

  const backCover = (
    <Page>
      <div style={{ position: "relative", width: "100%", height: "100%",
        background: "#120803", overflow: "hidden" }}>
        <img src={RESTO} alt="restaurant" loading="lazy"
          style={{ position: "absolute", top: 0, left: 0, right: 0,
            height: "48%", width: "100%", objectFit: "cover", objectPosition: "center top" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "52%",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #120803 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4,
          background: "linear-gradient(to bottom, #c9a96e, #a07840, #c9a96e)" }} />
        <div style={{ position: "absolute", top: "calc(48% + 10px)", left: 0, right: 0, bottom: 0,
          padding: "12px 26px 20px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, fontFamily: "Georgia, serif" }}>
            Thank You for Visiting
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 5, lineHeight: 1.7 }}>
            Experience fresh flavors, simple elegance, and moments worth savoring.
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ color: "#c9a96e", fontSize: 8, letterSpacing: "0.15em",
              textTransform: "uppercase", marginBottom: 8 }}>Contact and Location</div>
            {[
              { icon: "📍", text: "Rua do Comércio 45, Lisboa" },
              { icon: "📞", text: "+351 912 345 678" },
              { icon: "🌐", text: "vitrinepro.com/burgerhouse" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <span style={{ fontSize: 10 }}>{c.icon}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>{c.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "#c9a96e", fontSize: 8, letterSpacing: "0.15em",
              textTransform: "uppercase", marginBottom: 8 }}>Operating Hours</div>
            {[
              { day: "Segunda a Sexta", hours: "12h00 às 23h00" },
              { day: "Fim de Semana",   hours: "12h00 às 00h00" },
            ].map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)" }}>{h.day}</span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.75)" }}>{h.hours}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {["📘", "📸", "🐦"].map((icon, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: "50%",
                border: "1px solid rgba(201,169,110,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                {icon}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(201,169,110,0.15)", paddingTop: 8 }}>
            <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
              Gerado pela VitrinePro · vitrinepro.com
            </div>
          </div>
        </div>
      </div>
    </Page>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  const ArrowBtn = ({ dir, onClick }: { dir: "←" | "→"; onClick: () => void }) => (
    <button
      onClick={onClick}
      aria-label={dir === "←" ? "Página anterior" : "Próxima página"}
      style={{
        width: 52, height: 52, borderRadius: "50%",
        border: "1.5px solid rgba(201,169,110,0.4)",
        background: "rgba(201,169,110,0.06)",
        color: "#c9a96e", fontSize: 22, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.15)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.06)")}
    >
      {dir}
    </button>
  );

  return (
    <section style={{ background: "#080b12", padding: "80px 0 64px", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", width: 700, height: 350,
        background: "rgba(201,169,110,0.04)", filter: "blur(100px)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div className="max-w-7xl mx-auto px-4" style={{ position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{
            display: "inline-block",
            border: "1px solid rgba(201,169,110,0.3)", color: "#c9a96e",
            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "5px 16px", borderRadius: 999, marginBottom: 20,
          }}>
            Demo Interativo
          </span>
          <h2 style={{
            fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 700,
            color: "#f5f0e8", lineHeight: 1.2, marginBottom: 12,
          }}>
            Transforme os seus produtos num{" "}
            <span style={{ color: "#c9a96e", fontStyle: "italic" }}>catálogo profissional</span>
          </h2>
          <p style={{ color: "#888", fontSize: 14, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Clique nas setas para folhear. É assim que o seu catálogo vai ficar.
          </p>
        </div>

        {/* Flipbook row */}
        {isMobile ? (
          /* Mobile: book full width, arrows stacked below */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ borderRadius: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,110,0.08)", width: pageW * 2 + 1, maxWidth: "100%" }}>
              {!mounted || !FlipBook ? (
                <div style={{
                  width: pageW * 2, height: pageH, background: "#0f172a",
                  borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#c9a96e", fontSize: 13 }}>A carregar…</span>
                </div>
              ) : (
                <FlipBook
                  ref={bookRef}
                  width={pageW}
                  height={pageH}
                  size="fixed"
                  drawShadow={true}
                  flippingTime={600}
                  usePortrait={false}
                  startPage={0}
                  showCover={false}
                  maxShadowOpacity={0.4}
                  mobileScrollSupport={true}
                  onFlip={onFlip}
                  style={{ cursor: "pointer" }}
                >
                  {ghostPage}
                  {coverPage}
                  {appetizersLeft}
                  {appetizersRight}
                  {mainLeft}
                  {mainRight}
                  {backCover}
                  {ghostPage}
                </FlipBook>
              )}
            </div>
            {/* Mobile arrows below */}
            <div style={{ display: "flex", gap: 16 }}>
              <ArrowBtn dir="←" onClick={prevPage} />
              <ArrowBtn dir="→" onClick={nextPage} />
            </div>
          </div>
        ) : (
          /* Desktop: arrows beside the book */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <ArrowBtn dir="←" onClick={prevPage} />
            <div style={{ borderRadius: 6, boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,169,110,0.08)" }}>
              {!mounted || !FlipBook ? (
                <div style={{
                  width: pageW * 2, height: pageH, background: "#0f172a",
                  borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "#c9a96e", fontSize: 13 }}>A carregar catálogo…</span>
                </div>
              ) : (
                <FlipBook
                  ref={bookRef}
                  width={pageW}
                  height={pageH}
                  size="fixed"
                  drawShadow={true}
                  flippingTime={700}
                  usePortrait={false}
                  startPage={0}
                  showCover={false}
                  maxShadowOpacity={0.5}
                  mobileScrollSupport={true}
                  onFlip={onFlip}
                  style={{ cursor: "pointer" }}
                >
                  {ghostPage}
                  {coverPage}
                  {appetizersLeft}
                  {appetizersRight}
                  {mainLeft}
                  {mainRight}
                  {backCover}
                  {ghostPage}
                </FlipBook>
              )}
            </div>
            <ArrowBtn dir="→" onClick={nextPage} />
          </div>
        )}

        {/* Page indicator */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span style={{ color: "#c9a96e", fontSize: 12, letterSpacing: "0.05em" }}>
            Página {displayPage} de {displayTotal}
          </span>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button
            onClick={onCadastrar}
            style={{
              background: "#c9a96e", color: "#0a0d14", fontWeight: 700,
              padding: "14px 36px", borderRadius: 8, border: "none",
              fontSize: 14, cursor: "pointer", letterSpacing: "0.03em",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#d4bb82")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#c9a96e")}
          >
            Criar o Meu Catálogo Grátis →
          </button>
        </div>

      </div>
    </section>
  );
}

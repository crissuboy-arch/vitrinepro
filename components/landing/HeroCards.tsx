'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const CARDS = [
  {
    icon: '✂️',
    name: 'Studio Hair Lisboa',
    city: 'Lisboa',
    service: 'Corte + Escova — €25',
    accent: '#F472B6',
  },
  {
    icon: '🎨',
    name: 'Ink Art Porto',
    city: 'Porto',
    service: 'Tatuagem pequena — €50',
    accent: '#A78BFA',
  },
  {
    icon: '💆',
    name: 'Zen Massage Cascais',
    city: 'Cascais',
    service: 'Massagem relaxante — €45',
    accent: '#34D399',
  },
  {
    icon: '🍽️',
    name: 'Sabor Brasil Lisboa',
    city: 'Lisboa',
    service: 'Prato do dia — €12',
    accent: '#FB923C',
  },
  {
    icon: '💪',
    name: 'FitLife Braga',
    city: 'Braga',
    service: 'Treino personalizado — €35',
    accent: '#60A5FA',
  },
  {
    icon: '💅',
    name: 'Beleza & Cia Faro',
    city: 'Faro',
    service: 'Manicure completa — €20',
    accent: '#C8A96B',
  },
]

export default function HeroCards() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  const advance = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setActive((prev) => (prev + 1) % CARDS.length)
      setVisible(true)
    }, 500)
  }, [])

  useEffect(() => {
    const timer = setInterval(advance, 3500)
    return () => clearInterval(timer)
  }, [advance])

  const goTo = (i: number) => {
    if (i === active) return
    setVisible(false)
    setTimeout(() => {
      setActive(i)
      setVisible(true)
    }, 250)
  }

  const card = CARDS[active]

  return (
    /* ── Phone mockup shell ── */
    <div
      style={{
        width: '280px',
        height: '560px',
        background: '#0F172A',
        borderRadius: '40px',
        border: '3px solid rgba(200,169,107,0.4)',
        boxShadow: '0 0 40px rgba(200,169,107,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0px' }}>
        <div
          style={{
            width: '80px',
            height: '22px',
            background: '#0F172A',
            borderRadius: '0 0 14px 14px',
            border: '2px solid rgba(200,169,107,0.3)',
            borderTop: 'none',
          }}
        />
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          padding: '6px 20px 0',
        }}
      >
        <span>9:41</span>
        <span>●●●</span>
      </div>

      {/* Card area — flex-grow so it fills remaining space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 14px 0',
          overflow: 'hidden',
        }}
      >
        {/* The card itself */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            background: '#1E293B',
            borderRadius: '16px',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Accent header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${card.accent}cc, ${card.accent}77)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px 0',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '36px', lineHeight: 1 }}>{card.icon}</span>
          </div>

          {/* Body */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
            }}
          >
            {/* Name + city */}
            <div>
              <div
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  lineHeight: '1.2',
                }}
              >
                {card.name}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '2px' }}>
                📍 {card.city}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(200,169,107,0.3)' }} />

            {/* Service */}
            <div>
              <div
                style={{
                  color: '#C8A96B',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                ✦ Destaque
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>
                {card.service}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  background: '#C8A96B',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '7px 10px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                Ver vitrine →
              </Link>
              <a
                href="https://wa.me/351900000000"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: 'white',
                  fontSize: '14px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                💬
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          padding: '12px 0 16px',
          flexShrink: 0,
        }}
      >
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Card ${i + 1}`}
            style={{
              width: i === active ? '20px' : '7px',
              height: '7px',
              borderRadius: '9999px',
              background: i === active ? '#C8A96B' : 'rgba(200,169,107,0.25)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.35s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

export default function LogoHero3D() {
  return (
    <div
      style={{
        width: '128px',
        height: '128px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <iframe
        src="/vitrinepro-logo-3d.html"
        scrolling="no"
        style={{
          width: '128px',
          height: '128px',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          overflow: 'hidden',
          display: 'block',
        }}
      />
    </div>
  )
}

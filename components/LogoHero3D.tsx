'use client'

export default function LogoHero3D() {
  return (
    <div
      style={{
        width: '320px',
        height: '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <iframe
        src="/vitrinepro-logo-3d.html"
        scrolling="no"
        style={{
          width: '320px',
          height: '320px',
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

/**
 * app/pedidos/acompanhar/[token]/page.tsx — Fase 2.
 * Página PRIVADA de acompanhamento (link com token, sem conta).
 * noindex: nunca deve ser indexada nem partilhada por motores de busca.
 */
import type { Metadata } from "next";
import Link from "next/link";
import TrackingPanel from "@/components/quotes/TrackingPanel";

export const metadata: Metadata = {
  title: "Acompanhar pedido | VitrinePro",
  robots: { index: false, follow: false },
};

export default async function AcompanharPedidoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans">
      {/* Header (mesmo padrão do /explorar e /promocoes) */}
      <header className="border-b border-white/5 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-slate-600 px-3 py-1.5 rounded-lg">
            ← Voltar ao Início
          </Link>
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/orcamentos" className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg">
            Ver pedidos
          </Link>
        </div>
      </header>
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-8">
        <div className="text-center py-4 space-y-2">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            🔒 Área privada do teu pedido
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-[#F5F0E8] leading-tight">
            O teu <span className="text-[#C8A96B]">pedido</span>
          </h1>
        </div>
        <TrackingPanel token={token} />
      </main>
      {/* Footer (mesmo padrão do /explorar e /promocoes) */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 mt-20 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-1" />
          </Link>
          <p className="text-slate-400">Portugal, à sua volta.</p>
          <p className="text-[10px] text-slate-600 mt-2">© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

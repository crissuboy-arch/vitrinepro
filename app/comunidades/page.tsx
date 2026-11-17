"use client";

/**
 * /comunidades — índice público das comunidades sociais.
 * Visitantes leem; entrar/publicar exige conta (na página da
 * comunidade). Links individuais partilháveis: /comunidades/<slug>.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

interface Community {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  counts: { members: number; posts: number };
}

export default function ComunidadesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/communities");
        if (res.status === 503) {
          setNotReady(true);
          return;
        }
        const data = await res.json();
        if (res.ok) setCommunities(data.communities ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function share(name: string, slug: string) {
    const url = `${window.location.origin}/comunidades/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Ligação copiada!");
      }
    } catch {
      // partilha cancelada
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/explorar" className="text-gray-200 hover:text-white">Explorar</Link>
            <Link href="/radar" className="text-gray-200 hover:text-white">Radar Local</Link>
            <Link href="/promocoes" className="text-gray-200 hover:text-white">Promoções</Link>
            <Link href="/orcamentos" className="text-gray-200 hover:text-white">Orçamentos</Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-10 space-y-8">
        <section className="text-center space-y-3">
          <span className="inline-block px-3 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-full">👥 COMUNIDADES</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Comunidades VitrinePro</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Espaços de conversa e apoio entre quem empreende em Portugal. Qualquer pessoa pode ler; para publicar,
            comentar e reagir, entra com a tua conta — qualquer nacionalidade pode participar em qualquer comunidade.
          </p>
        </section>

        {loading && <p className="text-center text-gray-300 py-10">A carregar comunidades…</p>}
        {notReady && (
          <p className="text-center text-gray-300 py-10">As comunidades estão a ser ativadas. Volta em breve!</p>
        )}
        {!loading && !notReady && communities.length === 0 && (
          <p className="text-center text-gray-300 py-10">Ainda não há comunidades ativas.</p>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((c) => (
            <article key={c.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6 space-y-3 flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{c.icon || "👥"}</span>
                <h2 className="font-display text-xl font-bold leading-tight">{c.name}</h2>
              </div>
              {c.description && <p className="text-sm text-gray-300 flex-grow">{c.description}</p>}
              <p className="text-xs text-gray-400">
                {c.counts.members} membros · {c.counts.posts} publicações
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/comunidades/${c.slug}`}
                  className="flex-grow text-center px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg"
                >
                  Entrar na Comunidade
                </Link>
                <button
                  onClick={() => share(c.name, c.slug)}
                  className="px-3 py-2 border border-gray-700 rounded-lg text-sm"
                  aria-label={`Partilhar ${c.name}`}
                >
                  ↗
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-400 text-xs">
        Comunidades · VitrinePro
      </footer>
    </div>
  );
}

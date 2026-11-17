"use client";

/**
 * /comunidades/[slug] — página pública de uma comunidade social.
 * Leitura pública; publicar/comentar/reagir exige login + adesão.
 * Link partilhável para divulgação (Reels, Instagram, WhatsApp…).
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Community {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  counts: { members: number; posts: number };
}
interface ReactionInfo {
  count: number;
  mine: boolean;
}
interface Post {
  id: string;
  author_name: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  commentCount: number;
  reactions: Record<string, ReactionInfo>;
}
interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const EMOJIS = ["❤️", "👍", "🎉"];
const inputCls =
  "w-full px-3 py-2.5 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-400 focus:border-[#C8A96B] outline-none";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-2 border border-gray-700 text-gray-200 hover:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50";

export default function ComunidadePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [community, setCommunity] = useState<Community | null>(null);
  const [viewer, setViewer] = useState<{ loggedIn: boolean; isMember: boolean; displayName?: string }>({ loggedIn: false, isMember: false });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState({ content: "", image_url: "" });
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (q = "") => {
      try {
        const res = await fetch(`/api/communities/${slug}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
        if (res.status === 503) {
          setNotReady(true);
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar.");
        setCommunity(data.community);
        setViewer(data.viewer);
        setPosts(data.posts ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function joinLeave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${slug}/join`, { method: viewer.isMember ? "DELETE" : "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A operação falhou.");
      await load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A operação falhou.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composer),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível publicar.");
      setComposer({ content: "", image_url: "" });
      await load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setBusy(false);
    }
  }

  async function react(post: Post, emoji: string) {
    try {
      const res = await fetch(`/api/communities/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível reagir.");
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id) return p;
          const reactions = { ...p.reactions };
          const cur = reactions[emoji] ?? { count: 0, mine: false };
          reactions[emoji] = data.reacted
            ? { count: cur.count + 1, mine: true }
            : { count: Math.max(0, cur.count - 1), mine: false };
          return { ...p, reactions };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível reagir.");
    }
  }

  async function toggleComments(post: Post) {
    if (openComments === post.id) {
      setOpenComments(null);
      return;
    }
    setOpenComments(post.id);
    if (!comments[post.id]) {
      const res = await fetch(`/api/communities/posts/${post.id}/comments`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setComments((prev) => ({ ...prev, [post.id]: data.comments ?? [] }));
    }
  }

  async function sendComment(post: Post) {
    if (!commentDraft.trim()) return;
    try {
      const res = await fetch(`/api/communities/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível comentar.");
      setComments((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), data.comment] }));
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p)));
      setCommentDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível comentar.");
    }
  }

  async function report(targetType: "post" | "comment", targetId: string) {
    const reason = window.prompt("Motivo da denúncia (opcional):") ?? "";
    try {
      const res = await fetch("/api/communities/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível denunciar.");
      alert("Denúncia registada. A equipa de moderação vai rever.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível denunciar.");
    }
  }

  async function sharePost(post: Post) {
    const url = `${window.location.origin}/comunidades/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: community?.name ?? "Comunidade", text: post.content.slice(0, 120), url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Ligação copiada!");
      }
    } catch {
      // cancelado
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0F172A] text-gray-300 flex items-center justify-center">A carregar comunidade…</div>;
  }
  if (notReady) {
    return <div className="min-h-screen bg-[#0F172A] text-gray-300 flex items-center justify-center px-4 text-center">As comunidades estão a ser ativadas. Volta em breve!</div>;
  }
  if (notFound || !community) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl font-bold">Comunidade não encontrada</p>
        <Link href="/comunidades" className="text-[#D4BB82] underline">Ver todas as comunidades</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/comunidades" className="text-sm text-gray-200 hover:text-white">← Comunidades</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explorar" className="text-gray-200 hover:text-white">Explorar</Link>
            <Link href="/radar" className="text-gray-200 hover:text-white">Radar</Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <section className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-5xl">{community.icon || "👥"}</span>
            <div>
              <h1 className="font-display text-3xl font-bold">{community.name}</h1>
              <p className="text-sm text-gray-300">{community.counts.members} membros · {community.counts.posts} publicações</p>
            </div>
            <div className="ml-auto flex gap-2">
              {viewer.loggedIn ? (
                <button onClick={joinLeave} disabled={busy} className={viewer.isMember ? btnGhost : btnGold}>
                  {viewer.isMember ? "Sair da comunidade" : "Entrar na Comunidade"}
                </button>
              ) : (
                <Link href="/login" className={btnGold}>Entrar para participar</Link>
              )}
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/comunidades/${slug}`;
                  try {
                    if (navigator.share) await navigator.share({ title: community.name, url });
                    else {
                      await navigator.clipboard.writeText(url);
                      alert("Ligação de convite copiada!");
                    }
                  } catch { /* cancelado */ }
                }}
                className={btnGhost}
              >
                ↗ Convidar
              </button>
            </div>
          </div>
          {community.description && <p className="text-gray-300">{community.description}</p>}
          {error && <p className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>}
        </section>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(search)}
            placeholder="Pesquisar nesta comunidade…"
            className={inputCls}
          />
          <button onClick={() => void load(search)} className={btnGhost}>Pesquisar</button>
        </div>

        {viewer.isMember ? (
          <section className="bg-[#0B1120] border border-gray-800 rounded-2xl p-5 space-y-3">
            <p className="text-sm text-gray-300">Publicar como <strong className="text-white">{viewer.displayName}</strong></p>
            <textarea value={composer.content} onChange={(e) => setComposer({ ...composer, content: e.target.value })} className={inputCls} rows={3} placeholder="Partilha uma dica, uma novidade, uma pergunta…" maxLength={2000} />
            <input value={composer.image_url} onChange={(e) => setComposer({ ...composer, image_url: e.target.value })} className={inputCls} placeholder="Imagem (URL, opcional)" />
            <button onClick={publish} disabled={busy || !composer.content.trim()} className={btnGold}>Publicar</button>
          </section>
        ) : (
          <p className="text-sm text-gray-300 bg-[#0B1120] border border-gray-800 rounded-2xl px-5 py-4">
            {viewer.loggedIn
              ? "Entra na comunidade para publicar, comentar e reagir."
              : "Estás a ler como visitante. Entra com a tua conta e junta-te à comunidade para participar."}
          </p>
        )}

        <section className="space-y-4">
          {posts.length === 0 && <p className="text-gray-300 text-sm">Ainda não há publicações. Sê a primeira pessoa a partilhar!</p>}
          {posts.map((post) => (
            <article key={post.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold">{post.author_name}</span>
                {post.is_pinned && <span className="px-2 py-0.5 bg-[#C8A96B] text-[#0F172A] text-[11px] font-bold rounded-full">📌 Fixada</span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(post.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-gray-100 whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_url} alt="" className="w-full max-h-96 object-cover rounded-xl" />
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {EMOJIS.map((emoji) => {
                  const info = post.reactions[emoji];
                  return (
                    <button
                      key={emoji}
                      onClick={() => react(post, emoji)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${info?.mine ? "border-[#C8A96B] bg-[#C8A96B]/15" : "border-gray-700 hover:border-gray-500"}`}
                    >
                      {emoji} {info?.count ?? 0}
                    </button>
                  );
                })}
                <button onClick={() => toggleComments(post)} className={btnGhost}>
                  💬 {post.commentCount} comentários
                </button>
                <button onClick={() => sharePost(post)} className={btnGhost}>↗ Partilhar</button>
                {viewer.loggedIn && (
                  <button onClick={() => report("post", post.id)} className="ml-auto text-xs text-gray-400 hover:text-gray-200">
                    Denunciar
                  </button>
                )}
              </div>

              {openComments === post.id && (
                <div className="border-t border-gray-800 pt-3 space-y-3">
                  {(comments[post.id] ?? []).map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-bold">{c.author_name}</span>{" "}
                      <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <p className="text-gray-200 whitespace-pre-wrap">{c.content}</p>
                      {viewer.loggedIn && (
                        <button onClick={() => report("comment", c.id)} className="text-[11px] text-gray-400 hover:text-gray-200">Denunciar</button>
                      )}
                    </div>
                  ))}
                  {viewer.isMember ? (
                    <div className="flex gap-2">
                      <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} className={inputCls} placeholder="Escreve um comentário…" maxLength={1000} />
                      <button onClick={() => sendComment(post)} disabled={!commentDraft.trim()} className={btnGold}>Enviar</button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Entra na comunidade para comentar.</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-400 text-xs">
        {community.name} · VitrinePro
      </footer>
    </div>
  );
}

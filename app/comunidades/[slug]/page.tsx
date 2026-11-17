"use client";

/**
 * /comunidades/[slug] — comunidade como rede social interna.
 * Feed com avatares, composer com fotografia, perfil de membro,
 * comentários com respostas, notificações e boas-vindas.
 * Leitura pública; participar exige login + adesão.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { uploadCommunityImage } from "@/lib/supabase-storage";
import { buildCommentTree } from "@/lib/communities-core";

interface Community {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  counts: { members: number; posts: number };
}
interface Profile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
}
interface Viewer {
  loggedIn: boolean;
  isMember: boolean;
  userId?: string;
  displayName?: string;
  profile?: Profile | null;
}
interface ReactionInfo {
  count: number;
  mine: boolean;
}
interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_city: string | null;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  edited_at: string | null;
  created_at: string;
  commentCount: number;
  reactions: Record<string, ReactionInfo>;
}
interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_city: string | null;
  content: string;
  parent_id: string | null;
  edited_at: string | null;
  created_at: string;
}
interface Notification {
  id: string;
  actor_name: string;
  type: "comment" | "reply" | "reaction";
  post_id: string;
  is_read: boolean;
  created_at: string;
  social_communities: { slug: string; name: string } | null;
}
interface MemberPreview {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
}

const EMOJIS = ["❤️", "👍", "🎉"];
const card = "bg-white text-[#0F172A] rounded-2xl shadow-sm ring-1 ring-black/5";
const inputCls =
  "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#0F172A] placeholder:text-gray-500 focus:border-[#C8A96B] outline-none";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnNavy =
  "px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-2 border border-gray-300 text-gray-700 hover:text-[#0F172A] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50";

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="rounded-full bg-[#0F172A] text-[#C8A96B] font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {(name || "M").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function when(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ComunidadePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [community, setCommunity] = useState<Community | null>(null);
  const [viewer, setViewer] = useState<Viewer>({ loggedIn: false, isMember: false });
  const [members, setMembers] = useState<MemberPreview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [composerImage, setComposerImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; content: string; image_url: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; postId: string; content: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | MemberPreview | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (q = "", silent = false) => {
      try {
        const res = await fetch(`/api/communities/${slug}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
        if (res.status === 503) return setNotReady(true);
        if (res.status === 404) return setNotFound(true);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar.");
        setCommunity(data.community);
        setViewer(data.viewer);
        setPosts(data.posts ?? []);
        setMembers(data.membersPreview ?? []);
      } catch (e) {
        if (!silent) setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/communities/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // silencioso
    }
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    const res = await fetch(`/api/communities/posts/${postId}/comments`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
  }, []);

  useEffect(() => {
    void load();
    void loadNotifications();
  }, [load, loadNotifications]);

  // Atualização suave: novos conteúdos sem recarregar a página.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        void load(search, true);
        void loadNotifications();
        if (openComments) void loadComments(openComments);
      }
    }, 25000);
    return () => clearInterval(t);
  }, [load, loadNotifications, loadComments, search, openComments]);

  // Deep-link ?post=<id>: abre comentários e faz scroll.
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("post");
    if (pid && posts.length > 0) {
      setOpenComments(pid);
      void loadComments(pid);
      document.getElementById(`post-${pid}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length > 0]);

  async function joinLeave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${slug}/join`, { method: viewer.isMember ? "DELETE" : "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A operação falhou.");
      if (data.firstJoin) setJustJoined(true);
      await load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A operação falhou.");
    } finally {
      setBusy(false);
    }
  }

  async function onPickImage(file: File | null) {
    if (!file || !viewer.userId) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCommunityImage(file, viewer.userId);
      setComposerImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a fotografia.");
    } finally {
      setUploading(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: composer, image_url: composerImage ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível publicar.");
      setComposer("");
      setComposerImage(null);
      setJustJoined(false);
      await load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível publicar.");
    } finally {
      setBusy(false);
    }
  }

  function startPresentation() {
    const name = viewer.profile?.displayName || viewer.displayName || "";
    const city = viewer.profile?.city ? `, de ${viewer.profile.city}` : "";
    setComposer(`Olá a todos! 👋 Sou ${name}${city}. \n\n`);
    setWelcomeDismissed(true);
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
          reactions[emoji] = data.reacted ? { count: cur.count + 1, mine: true } : { count: Math.max(0, cur.count - 1), mine: false };
          return { ...p, reactions };
        }),
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
    await loadComments(post.id);
  }

  async function sendComment(post: Post) {
    const draft = (commentDrafts[post.id] ?? "").trim();
    if (!draft) return;
    try {
      const res = await fetch(`/api/communities/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, parent_id: replyTo?.postId === post.id ? replyTo.commentId : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível comentar.");
      setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
      setReplyTo(null);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p)));
      await loadComments(post.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível comentar.");
    }
  }

  async function saveEditPost() {
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/communities/posts/${editingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingPost.content, image_url: editingPost.image_url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível editar.");
      setEditingPost(null);
      await load(search, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível editar.");
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm("Apagar esta publicação?")) return;
    try {
      const res = await fetch(`/api/communities/posts/${post.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível apagar.");
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível apagar.");
    }
  }

  async function saveEditComment() {
    if (!editingComment) return;
    try {
      const res = await fetch(`/api/communities/posts/${editingComment.postId}/comments/${editingComment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingComment.content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível editar.");
      setEditingComment(null);
      await loadComments(editingComment.postId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível editar.");
    }
  }

  async function deleteComment(postId: string, commentId: string) {
    if (!window.confirm("Apagar este comentário?")) return;
    try {
      const res = await fetch(`/api/communities/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível apagar.");
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)));
      await loadComments(postId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível apagar.");
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
    const url = `${window.location.origin}/comunidades/${slug}?post=${post.id}`;
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

  async function openNotifications() {
    setNotifOpen((v) => !v);
    if (!notifOpen && unread > 0) {
      await fetch("/api/communities/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => undefined);
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  const showWelcome = viewer.isMember && !welcomeDismissed && (justJoined || !viewer.profile);
  const myName = viewer.profile?.displayName || viewer.displayName || "Membro";

  if (loading) return <div className="min-h-screen bg-[#0F172A] text-gray-300 flex items-center justify-center">A carregar comunidade…</div>;
  if (notReady) return <div className="min-h-screen bg-[#0F172A] text-gray-300 flex items-center justify-center px-4 text-center">As comunidades estão a ser ativadas. Volta em breve!</div>;
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
      <header className="border-b border-white/10 bg-[#0F172A]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/comunidades" className="text-sm text-gray-200 hover:text-white">← Comunidades</Link>
          <span className="ml-auto flex items-center gap-2">
            {viewer.loggedIn && (
              <span className="relative">
                <button onClick={openNotifications} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg" aria-label="Notificações">
                  🔔
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8A96B] px-1 text-[11px] font-bold text-[#0F172A]">{unread}</span>
                  )}
                </button>
                {notifOpen && (
                  <span className="absolute right-0 top-12 block w-80 max-w-[85vw] rounded-2xl bg-white p-2 text-left text-[#0F172A] shadow-xl ring-1 ring-black/10 z-50">
                    {notifications.length === 0 ? (
                      <span className="block px-3 py-4 text-sm text-gray-500">Sem notificações. Quando alguém comentar ou reagir às tuas publicações, aparece aqui.</span>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100"
                          onClick={() => {
                            setNotifOpen(false);
                            setOpenComments(n.post_id);
                            void loadComments(n.post_id);
                            document.getElementById(`post-${n.post_id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <strong>{n.actor_name}</strong>{" "}
                          {n.type === "comment" ? "comentou a tua publicação" : n.type === "reply" ? "respondeu ao teu comentário" : "reagiu à tua publicação"}
                          <span className="block text-xs text-gray-500">{n.social_communities?.name ?? community.name} · {when(n.created_at)}</span>
                        </button>
                      ))
                    )}
                  </span>
                )}
              </span>
            )}
            {viewer.loggedIn ? (
              <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm font-semibold hover:bg-white/15">
                <Avatar name={myName} url={viewer.profile?.avatarUrl ?? null} size={32} />
                <span className="max-w-28 truncate">{myName}</span>
              </button>
            ) : (
              <Link href="/login" className={btnGold}>Entrar</Link>
            )}
          </span>
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Cartão da comunidade */}
        <section className={`${card} p-5 space-y-3`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl">{community.icon || "👥"}</span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight">{community.name}</h1>
              <p className="text-sm text-gray-500">{community.counts.members} membros · {community.counts.posts} publicações</p>
            </div>
            <div className="ml-auto flex gap-2">
              {viewer.loggedIn ? (
                <button onClick={joinLeave} disabled={busy} className={viewer.isMember ? btnGhost : btnGold}>
                  {viewer.isMember ? "Sair" : "Entrar na Comunidade"}
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
          {community.description && <p className="text-sm text-gray-600">{community.description}</p>}
          {members.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-2">
                {members.slice(0, 8).map((m) => (
                  <button key={m.userId} onClick={() => setViewProfile(m)} title={m.displayName} className="ring-2 ring-white rounded-full">
                    <Avatar name={m.displayName} url={m.avatarUrl} size={32} />
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">Membros recentes — toca num rosto para ver o perfil</span>
            </div>
          )}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </section>

        {/* Boas-vindas */}
        {showWelcome && (
          <section className="rounded-2xl bg-gradient-to-br from-[#C8A96B] to-[#E7CF9B] p-5 text-[#0F172A] shadow-sm">
            <h2 className="font-display text-xl font-bold">Bem-vindo à comunidade! 🎉</h2>
            <p className="mt-1 text-sm">Apresenta-te aos outros membros. Conta-nos um pouco sobre ti e de que cidade és.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={startPresentation} className={btnNavy}>Fazer a minha apresentação</button>
              {!viewer.profile && (
                <button onClick={() => setProfileOpen(true)} className="px-4 py-2.5 bg-white/70 hover:bg-white text-[#0F172A] text-sm font-bold rounded-lg">Completar o meu perfil</button>
              )}
              <button onClick={() => setWelcomeDismissed(true)} className="px-3 py-2 text-sm font-semibold text-[#0F172A]/70">Agora não</button>
            </div>
          </section>
        )}

        {/* Composer */}
        {viewer.isMember ? (
          <section className={`${card} p-4 space-y-3`}>
            <div className="flex gap-3">
              <Avatar name={myName} url={viewer.profile?.avatarUrl ?? null} size={44} />
              <textarea
                ref={composerRef}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="O que queres partilhar com a comunidade?"
                maxLength={2000}
              />
            </div>
            {composerImage && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={composerImage} alt="" className="max-h-64 w-full rounded-xl object-cover" />
                <button onClick={() => setComposerImage(null)} className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white">✕ Remover</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className={btnGhost}>
                📷 {uploading ? "A carregar…" : "Fotografia"}
              </button>
              <span className="ml-auto text-xs text-gray-400">{composer.length}/2000</span>
              <button onClick={publish} disabled={busy || uploading || !composer.trim()} className={btnGold}>Publicar</button>
            </div>
          </section>
        ) : (
          <p className="text-sm text-gray-200 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            {viewer.loggedIn ? "Entra na comunidade para publicar, comentar e reagir." : "Estás a ler como visitante. Entra com a tua conta e junta-te à comunidade para participar."}
          </p>
        )}

        {/* Pesquisa */}
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load(search)} placeholder="Pesquisar nesta comunidade…" className={inputCls} />
          <button onClick={() => void load(search)} className={btnGhost}>Pesquisar</button>
        </div>

        {/* Feed */}
        <section className="space-y-4">
          {posts.length === 0 && <p className="text-gray-300 text-sm">Ainda não há publicações. Sê a primeira pessoa a partilhar!</p>}
          {posts.map((post) => {
            const tree = openComments === post.id ? buildCommentTree(comments[post.id] ?? []) : [];
            const totalReactions = Object.values(post.reactions).reduce((acc, r) => acc + r.count, 0);
            const mine = viewer.userId && post.author_id === viewer.userId;
            return (
              <article key={post.id} id={`post-${post.id}`} className={`${card} p-5 space-y-3`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewProfile({ userId: post.author_id, displayName: post.author_name, avatarUrl: post.author_avatar, city: post.author_city })}>
                    <Avatar name={post.author_name} url={post.author_avatar} size={44} />
                  </button>
                  <div className="min-w-0 leading-tight">
                    <p className="font-bold truncate">{post.author_name}</p>
                    <p className="text-xs text-gray-500">
                      {post.author_city ? `${post.author_city} · ` : ""}
                      {when(post.created_at)}
                      {post.edited_at ? " · editada" : ""}
                    </p>
                  </div>
                  {post.is_pinned && <span className="ml-auto px-2 py-0.5 bg-[#C8A96B] text-[#0F172A] text-[11px] font-bold rounded-full shrink-0">📌 Fixada</span>}
                  {mine && (
                    <span className={`${post.is_pinned ? "" : "ml-auto"} flex gap-1 shrink-0`}>
                      <button onClick={() => setEditingPost({ id: post.id, content: post.content, image_url: post.image_url ?? "" })} className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] px-2 py-1">Editar</button>
                      <button onClick={() => void deletePost(post)} className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1">Apagar</button>
                    </span>
                  )}
                </div>

                {editingPost?.id === post.id ? (
                  <div className="space-y-2">
                    <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} className={inputCls} rows={4} maxLength={2000} />
                    <input value={editingPost.image_url} onChange={(e) => setEditingPost({ ...editingPost, image_url: e.target.value })} className={inputCls} placeholder="Imagem (URL, opcional)" />
                    <div className="flex gap-2">
                      <button onClick={() => void saveEditPost()} className={btnGold}>Guardar</button>
                      <button onClick={() => setEditingPost(null)} className={btnGhost}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="" className="w-full max-h-96 object-cover rounded-xl" />
                    )}
                  </>
                )}

                {(totalReactions > 0 || post.commentCount > 0) && (
                  <p className="text-xs text-gray-500">
                    {totalReactions > 0 ? `${totalReactions} ${totalReactions === 1 ? "reação" : "reações"}` : ""}
                    {totalReactions > 0 && post.commentCount > 0 ? " · " : ""}
                    {post.commentCount > 0 ? `${post.commentCount} ${post.commentCount === 1 ? "comentário" : "comentários"}` : ""}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  {EMOJIS.map((emoji) => {
                    const info = post.reactions[emoji];
                    return (
                      <button
                        key={emoji}
                        onClick={() => void react(post, emoji)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${info?.mine ? "border-[#C8A96B] bg-[#C8A96B]/15 font-bold" : "border-gray-300 hover:border-gray-400"}`}
                      >
                        {emoji} {info?.count ?? 0}
                      </button>
                    );
                  })}
                  <button onClick={() => void toggleComments(post)} className={btnGhost}>💬 Comentar</button>
                  <button onClick={() => void sharePost(post)} className={btnGhost}>↗ Partilhar</button>
                  {viewer.loggedIn && !mine && (
                    <button onClick={() => void report("post", post.id)} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Denunciar</button>
                  )}
                </div>

                {openComments === post.id && (
                  <div className="border-t border-gray-100 pt-3 space-y-4">
                    {tree.length === 0 && <p className="text-sm text-gray-500">Ainda sem comentários. Começa a conversa!</p>}
                    {tree.map((c) => (
                      <CommentBlock
                        key={c.id}
                        post={post}
                        comment={c}
                        viewer={viewer}
                        isReply={false}
                        onReply={() => {
                          setReplyTo({ postId: post.id, commentId: c.id, name: c.author_name });
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: prev[post.id] ?? "" }));
                        }}
                        onEdit={() => setEditingComment({ id: c.id, postId: post.id, content: c.content })}
                        onDelete={() => void deleteComment(post.id, c.id)}
                        onReport={() => void report("comment", c.id)}
                        onViewProfile={() => setViewProfile({ userId: c.author_id, displayName: c.author_name, avatarUrl: c.author_avatar, city: c.author_city })}
                        editingComment={editingComment}
                        setEditingComment={setEditingComment}
                        onSaveEdit={() => void saveEditComment()}
                        renderReply={(reply) => (
                          <CommentBlock
                            key={reply.id}
                            post={post}
                            comment={reply}
                            viewer={viewer}
                            isReply
                            onReply={() => setReplyTo({ postId: post.id, commentId: c.id, name: reply.author_name })}
                            onEdit={() => setEditingComment({ id: reply.id, postId: post.id, content: reply.content })}
                            onDelete={() => void deleteComment(post.id, reply.id)}
                            onReport={() => void report("comment", reply.id)}
                            onViewProfile={() => setViewProfile({ userId: reply.author_id, displayName: reply.author_name, avatarUrl: reply.author_avatar, city: reply.author_city })}
                            editingComment={editingComment}
                            setEditingComment={setEditingComment}
                            onSaveEdit={() => void saveEditComment()}
                            renderReply={() => null}
                          />
                        )}
                      />
                    ))}
                    {viewer.isMember ? (
                      <div className="space-y-2">
                        {replyTo?.postId === post.id && (
                          <p className="flex items-center gap-2 text-xs text-gray-500">
                            A responder a <strong className="text-[#0F172A]">{replyTo.name}</strong>
                            <button onClick={() => setReplyTo(null)} className="font-bold text-gray-400 hover:text-gray-600">✕ cancelar</button>
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Avatar name={myName} url={viewer.profile?.avatarUrl ?? null} size={36} />
                          <input
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && void sendComment(post)}
                            className={inputCls}
                            placeholder={replyTo?.postId === post.id ? `Responder a ${replyTo.name}…` : "Escreve um comentário…"}
                            maxLength={1000}
                          />
                          <button onClick={() => void sendComment(post)} disabled={!(commentDrafts[post.id] ?? "").trim()} className={btnGold}>Enviar</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Entra na comunidade para comentar.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-gray-400 text-xs">{community.name} · VitrinePro</footer>

      {/* Modal: o meu perfil */}
      {profileOpen && (
        <ProfileModal
          initial={viewer.profile ?? { userId: viewer.userId!, displayName: myName, avatarUrl: null, bio: null, city: null }}
          userId={viewer.userId!}
          onClose={() => setProfileOpen(false)}
          onSaved={() => {
            setProfileOpen(false);
            void load(search, true);
          }}
        />
      )}

      {/* Modal: perfil público de outro membro */}
      {viewProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setViewProfile(null)}>
          <div className={`${card} w-full max-w-sm p-6 text-center space-y-3`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center">
              <Avatar name={viewProfile.displayName} url={viewProfile.avatarUrl} size={84} />
            </div>
            <h3 className="font-display text-xl font-bold">{viewProfile.displayName}</h3>
            {"city" in viewProfile && viewProfile.city && <p className="text-sm text-gray-500">📍 {viewProfile.city}</p>}
            {"bio" in viewProfile && viewProfile.bio ? (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewProfile.bio}</p>
            ) : (
              <p className="text-sm text-gray-400">Ainda sem apresentação.</p>
            )}
            <button onClick={() => setViewProfile(null)} className={btnGhost}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentBlock(props: {
  post: Post;
  comment: Comment & { replies?: Comment[] };
  viewer: Viewer;
  isReply: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onViewProfile: () => void;
  editingComment: { id: string; postId: string; content: string } | null;
  setEditingComment: (v: { id: string; postId: string; content: string } | null) => void;
  onSaveEdit: () => void;
  renderReply: (reply: Comment) => React.ReactNode;
}) {
  const c = props.comment;
  const mine = props.viewer.userId && c.author_id === props.viewer.userId;
  const editing = props.editingComment?.id === c.id;
  return (
    <div className={props.isReply ? "ml-10" : ""}>
      <div className="flex gap-2.5">
        <button onClick={props.onViewProfile} className="shrink-0">
          <Avatar name={c.author_name} url={c.author_avatar} size={36} />
        </button>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-2.5">
          <p className="text-[13px] leading-tight">
            <strong>{c.author_name}</strong>{" "}
            <span className="text-xs font-normal text-gray-500">
              {c.author_city ? `${c.author_city} · ` : ""}
              {when(c.created_at)}
              {c.edited_at ? " · editado" : ""}
            </span>
          </p>
          {editing ? (
            <span className="mt-1 flex gap-2">
              <input
                value={props.editingComment?.content ?? ""}
                onChange={(e) => props.setEditingComment({ id: c.id, postId: props.post.id, content: e.target.value })}
                className={inputCls}
                maxLength={1000}
              />
              <button onClick={props.onSaveEdit} className={btnGold}>Guardar</button>
              <button onClick={() => props.setEditingComment(null)} className={btnGhost}>Cancelar</button>
            </span>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
          )}
        </div>
      </div>
      {!editing && (
        <div className="ml-12 mt-1 flex gap-3 text-[11px] font-semibold text-gray-500">
          {props.viewer.isMember && <button onClick={props.onReply} className="hover:text-[#0F172A]">Responder</button>}
          {mine && <button onClick={props.onEdit} className="hover:text-[#0F172A]">Editar</button>}
          {mine && <button onClick={props.onDelete} className="hover:text-red-600">Apagar</button>}
          {props.viewer.loggedIn && !mine && <button onClick={props.onReport} className="hover:text-gray-700">Denunciar</button>}
        </div>
      )}
      {(c.replies ?? []).length > 0 && <div className="mt-3 space-y-3">{(c.replies ?? []).map((r) => props.renderReply(r))}</div>}
    </div>
  );
}

function ProfileModal({
  initial,
  userId,
  onClose,
  onSaved,
}: {
  initial: Profile;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ display_name: initial.displayName, avatar_url: initial.avatarUrl ?? "", bio: initial.bio ?? "", city: initial.city ?? "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCommunityImage(file, userId);
      setForm((f) => ({ ...f, avatar_url: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a fotografia.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/communities/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível guardar.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className={`${card} w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold">O meu perfil na comunidade</h3>
        <div className="flex items-center gap-4">
          <Avatar name={form.display_name || "M"} url={form.avatar_url || null} size={72} />
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void onPick(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className={btnGhost}>
              📷 {uploading ? "A carregar…" : "Mudar fotografia"}
            </button>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WEBP, até 5 MB.</p>
          </div>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Nome público</span>
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={inputCls} maxLength={60} placeholder="Como queres ser conhecido/a" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Cidade <span className="font-normal text-gray-400">(opcional)</span></span>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} maxLength={60} placeholder="Ex.: Águeda" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Apresentação</span>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputCls} rows={3} maxLength={280} placeholder="Conta um pouco sobre ti: o que fazes, o que procuras, como podes ajudar…" />
          <span className="block text-right text-xs text-gray-400">{form.bio.length}/280</span>
        </label>
        <p className="text-xs text-gray-500">O teu email e contactos nunca são mostrados nas comunidades.</p>
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => void save()} disabled={busy || uploading} className={btnGold}>Guardar perfil</button>
          <button onClick={onClose} className={btnGhost}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type {
  ContentItem,
  RedeSocial,
  ContentStatus,
  ViewMode,
} from "@/types/content-calendar";
import CalendarFilters from "@/components/calendar/CalendarFilters";
import ContentForm from "@/components/calendar/ContentForm";
import ContentListView from "@/components/calendar/ContentListView";
import ContentMonthView from "@/components/calendar/ContentMonthView";

export default function ContentCalendarPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<ViewMode>("lista");
  const [rede, setRede] = useState<RedeSocial | "todas">("todas");
  const [status, setStatus] = useState<ContentStatus | "todos">("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("user_id", uid)
      .order("data", { ascending: true })
      .order("hora", { ascending: true });
    setItems((data as ContentItem[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!active) return;
      setUserId(session.user.id);
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (active && biz) setBusinessId(biz.id as string);
      await fetchItems(session.user.id);
    })();
    return () => {
      active = false;
    };
  }, [router, fetchItems]);

  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          (rede === "todas" || it.rede_social === rede) &&
          (status === "todos" || it.status === status),
      ),
    [items, rede, status],
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSave = useCallback(
    async (item: ContentItem) => {
      if (!userId) return;
      setSaving(true);
      try {
        const payload = {
          titulo: item.titulo,
          rede_social: item.rede_social,
          data: item.data,
          hora: item.hora ? item.hora : null,
          status: item.status,
          legenda: item.legenda ? item.legenda : null,
          observacoes: item.observacoes ? item.observacoes : null,
        };
        if (item.id) {
          await supabase
            .from("content_calendar")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", item.id);
        } else {
          await supabase
            .from("content_calendar")
            .insert({ ...payload, user_id: userId, business_id: businessId });
        }
        setModalOpen(false);
        setEditing(null);
        await fetchItems(userId);
      } finally {
        setSaving(false);
      }
    },
    [userId, businessId, fetchItems],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!userId) return;
      if (typeof window !== "undefined" && !window.confirm("Excluir este conteúdo?")) return;
      await supabase.from("content_calendar").delete().eq("id", id);
      await fetchItems(userId);
    },
    [userId, fetchItems],
  );

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-[#C8A96B]">
              ← Voltar ao dashboard
            </Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-[#C8A96B]">
              Calendário de Conteúdo
            </h1>
            <p className="text-xs text-gray-500">Planeie e organize as suas publicações.</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="rounded-xl bg-[#C8A96B] px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#D4BB82]"
          >
            + Novo conteúdo
          </button>
        </div>

        <div className="mb-5">
          <CalendarFilters
            view={view}
            onView={setView}
            rede={rede}
            onRede={setRede}
            status={status}
            onStatus={setStatus}
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">A carregar...</div>
        ) : view === "lista" ? (
          <ContentListView items={filtered} onEdit={openEdit} onDelete={handleDelete} />
        ) : (
          <ContentMonthView items={filtered} onEdit={openEdit} />
        )}
      </div>

      {modalOpen && (
        <ContentForm
          key={editing?.id ?? "new"}
          initial={editing}
          saving={saving}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

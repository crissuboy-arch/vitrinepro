/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/SupabaseAuthContext";
import { supabase } from "../lib/supabase";
import { isPaidTier } from "@/lib/plans";

// UI-only gate: hides admin controls in the browser.
// Real authorization happens server-side (app/api/admin/* checks ADMIN_EMAILS).
const ADMIN_EMAILS = ["cris.suboy@gmail.com", "geralvitrinepropt@gmail.com"];

interface Business {
  id: string;
  name: string;
  description: string;
  plan: string;
  published: boolean;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  view_count: number;
  created_at: string;
  logo_url?: string;
  categories?: { name: string };
  cities?: { name: string };
  profiles?: { email: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parent_id?: string | null;
  is_active: boolean;
  order_index: number;
}

interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  order_index: number;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  created_at: string;
}

// ADMIN (Visão Geral): dados reais de contas.
interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  businessCount: number;
  tipo: "consumidor" | "comerciante" | "admin";
  status: "ativo" | "inativo" | "nunca_entrou";
  plan: string | null;
}

interface AdminStats {
  activeWindowDays: number;
  accounts: { total: number; newToday: number; new7d: number; new30d: number; active30d: number; neverLoggedIn: number; consumers: number; merchants: number; admins: number };
  businesses: { total: number; published: number; unpublished: number; plans: { free: number; pro: number; business: number; other: number } };
  content: { products: number; posts: number; gallery: number };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  business_type: string | null;
  source: string | null;
  created_at: string;
}

interface Stats {
  totalBusinesses: number;
  publishedBusinesses: number;
  totalReviews: number;
  pendingReviews: number;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ totalBusinesses: 0, publishedBusinesses: 0, totalReviews: 0, pendingReviews: 0 });
  const [filter, setFilter] = useState<"all" | "published" | "unpublished" | "premium">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "categories" | "cities" | "users" | "leads">("overview");

  // Visão Geral (dados reais)
  const [overview, setOverview] = useState<AdminStats | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Utilizadores reais (Auth) — paginação server-side
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("todos");
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user: AdminUser; businesses: any[] } | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

  // City CRUD states
  const [cities, setCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [cityCountry, setCityCountry] = useState("Portugal");
  const [cityIsActive, setCityIsActive] = useState(true);
  const [cityOrderIndex, setCityOrderIndex] = useState(0);
  const [cityActionLoading, setCityActionLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");

  // Category CRUD states
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catIsActive, setCatIsActive] = useState(true);
  const [catOrderIndex, setCatOrderIndex] = useState(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) { router.push("/login"); return; }
    if (!authLoading && user && !ADMIN_EMAILS.includes(user.email || "")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (!mounted || !user || !ADMIN_EMAILS.includes(user.email || "")) return;
    loadData();
    loadStats();
    loadAdminUsers(1, "", "todos");
  }, [mounted, user]);

  // ADMIN-1: busca server-side com debounce (nome, slug, cidade, owner).
  useEffect(() => {
    if (!mounted || !user || !ADMIN_EMAILS.includes(user.email || "")) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/businesses?q=${encodeURIComponent(search)}&page=1`);
        if (!r.ok) return;
        const j = await r.json();
        setBusinesses(j.businesses || []);
      } catch { /* mantém lista atual em caso de erro */ }
    }, 400);
    return () => clearTimeout(t);
  }, [search, mounted, user]);

  // Auto-slugify for category name
  useEffect(() => {
    if (!editingCategory) {
      setCatSlug(slugify(catName));
    }
  }, [catName, editingCategory]);

  // Auto-slugify for city name
  useEffect(() => {
    if (!editingCity) {
      setCitySlug(slugify(cityName));
    }
  }, [cityName, editingCity]);

  const loadData = async () => {
    setLoading(true);
    try {
      // A2.14: users are PII — fetched via the server-side admin API
      // (service role + ADMIN_EMAILS check), never with the anon key.
      const usersPromise = fetch("/api/admin/users?limit=200")
        .then((r) => (r.ok ? r.json() : { users: [] }))
        .catch(() => ({ users: [] }));
      const leadsPromise = fetch("/api/admin/leads?limit=500")
        .then((r) => (r.ok ? r.json() : { leads: [] }))
        .catch(() => ({ leads: [] }));
      const [bizRes, reviewRes, catRes, citiesRes, usersRes, leadsRes] = await Promise.all([
        // ADMIN-1: businesses via API administrativa (service_role + ADMIN_EMAILS).
        // O anon key direto NÃO consegue editar businesses de terceiros (RLS owner-scoped).
        fetch("/api/admin/businesses?page=1")
          .then((r) => (r.ok ? r.json() : { businesses: [] }))
          .catch(() => ({ businesses: [] })),
        supabase.from("reviews").select("id, is_approved"),
        supabase
          .from("categories")
          .select("*")
          .order("order_index", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("cities")
          .select("*")
          .order("order_index", { ascending: true })
          .order("name", { ascending: true }),
        usersPromise,
        leadsPromise,
      ]);

      const bizList: Business[] = (bizRes as { businesses?: Business[] }).businesses || [];
      setBusinesses(bizList);
      setCategories(catRes.data || []);
      setCities(citiesRes.data || []);
      setUsers((usersRes as { users?: UserProfile[] }).users || []);
      setLeads((leadsRes as { leads?: Lead[] }).leads || []);

      const reviews = reviewRes.data || [];
      setStats({
        totalBusinesses: bizList.length,
        publishedBusinesses: bizList.filter((b) => b.published).length,
        totalReviews: reviews.length,
        pendingReviews: reviews.filter((r: any) => !r.is_approved).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Visão Geral: estatísticas reais ──
  const loadStats = async () => {
    setOverviewLoading(true);
    try {
      const r = await fetch("/api/admin/stats");
      if (r.ok) setOverview(await r.json());
    } catch (e) { console.error(e); } finally { setOverviewLoading(false); }
  };

  // ── Utilizadores reais: paginação + busca + filtros server-side ──
  const loadAdminUsers = async (page = 1, q = "", filter = "todos") => {
    setUserLoading(true);
    try {
      const r = await fetch(
        `/api/admin/users?page=${page}&q=${encodeURIComponent(q)}&filter=${filter}`
      );
      if (r.ok) {
        const j = await r.json();
        setAdminUsers(j.users || []);
        setUserPage(j.page || 1);
        setUserTotalPages(j.totalPages || 1);
        setUserTotal(j.total || 0);
      }
    } catch (e) { console.error(e); } finally { setUserLoading(false); }
  };

  const openUser = async (u: AdminUser) => {
    setSelectedUserLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${u.id}`);
      if (r.ok) {
        const j = await r.json();
        setSelectedUser({ user: j.user, businesses: j.businesses || [] });
      }
    } catch (e) { console.error(e); } finally { setSelectedUserLoading(false); }
  };

  const togglePublished = async (biz: Business) => {
    setActionLoading(biz.id);
    try {
      // ADMIN-1: via API administrativa (não anon key — RLS bloquearia terceiros).
      const r = await fetch(`/api/admin/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !biz.published }),
      });
      if (!r.ok) throw new Error("Falha ao atualizar");
      setBusinesses((prev) => prev.map((b) => b.id === biz.id ? { ...b, published: !biz.published } : b));
      setStats((s) => ({
        ...s,
        publishedBusinesses: !biz.published ? s.publishedBusinesses + 1 : s.publishedBusinesses - 1,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const setPlan = async (biz: Business, plan: "free" | "pro" | "premium" | "business") => {
    setActionLoading(biz.id + plan);
    try {
      // ADMIN-1: via API administrativa. NOTA: isto altera o campo `plan`
      // diretamente (uso interno/operacional). O Stripe continua sendo a fonte
      // do estado financeiro quando há assinatura real.
      const r = await fetch(`/api/admin/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!r.ok) throw new Error("Falha ao atualizar plano");
      setBusinesses((prev) => prev.map((b) => b.id === biz.id ? { ...b, plan } : b));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (biz: Business) => {
    const next = !(biz as any).is_featured;
    setActionLoading(biz.id + "featured");
    try {
      const r = await fetch(`/api/admin/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: next }),
      });
      if (!r.ok) throw new Error("Falha ao atualizar");
      setBusinesses((prev) => prev.map((b) => b.id === biz.id ? { ...b, is_featured: next } as any : b));
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const deleteBusiness = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este negócio? Esta ação é irreversível.")) return;
    setActionLoading(id + "delete");
    try {
      await supabase.from("businesses").delete().eq("id", id);
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
      setStats((s) => ({ ...s, totalBusinesses: s.totalBusinesses - 1 }));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      alert("Por favor, preencha o nome e o slug.");
      return;
    }
    setCatActionLoading(true);
    try {
      const parentVal = catParentId || null;
      const payload = {
        name: catName,
        slug: catSlug,
        icon: catIcon || null,
        description: catDescription || null,
        parent_id: parentVal,
        is_active: catIsActive,
        order_index: Number(catOrderIndex),
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);

        if (error) {
          alert(`Erro ao atualizar categoria: ${error.message}`);
        } else {
          setEditingCategory(null);
          resetCatForm();
          loadData();
        }
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(payload);

        if (error) {
          alert(`Erro ao criar categoria: ${error.message}`);
        } else {
          resetCatForm();
          loadData();
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro ao salvar a categoria.");
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta categoria? Isto pode afetar os negócios e produtos associados.")) return;
    setCatActionLoading(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        alert(`Erro ao eliminar categoria: ${error.message}`);
      } else {
        if (editingCategory?.id === id) {
          setEditingCategory(null);
          resetCatForm();
        }
        loadData();
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro ao eliminar a categoria.");
    } finally {
      setCatActionLoading(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon || "");
    setCatSlug(cat.slug);
    setCatDescription(cat.description || "");
    setCatParentId(cat.parent_id || "");
    setCatIsActive(cat.is_active);
    setCatOrderIndex(cat.order_index);
  };

  const resetCatForm = () => {
    setEditingCategory(null);
    setCatName("");
    setCatIcon("");
    setCatSlug("");
    setCatDescription("");
    setCatParentId("");
    setCatIsActive(true);
    setCatOrderIndex(0);
  };

  // City Actions
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName || !citySlug) {
      alert("Por favor, preencha o nome e o slug.");
      return;
    }
    setCityActionLoading(true);
    try {
      const payload = {
        name: cityName,
        slug: citySlug,
        country: cityCountry || "Portugal",
        is_active: cityIsActive,
        order_index: Number(cityOrderIndex),
      };

      if (editingCity) {
        const { error } = await supabase.from("cities").update(payload).eq("id", editingCity.id);
        if (error) { alert(`Erro ao atualizar cidade: ${error.message}`); }
        else { setEditingCity(null); resetCityForm(); loadData(); }
      } else {
        const { error } = await supabase.from("cities").insert(payload);
        if (error) { alert(`Erro ao criar cidade: ${error.message}`); }
        else { resetCityForm(); loadData(); }
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro ao salvar a cidade.");
    } finally {
      setCityActionLoading(false);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta cidade? Isto pode afetar os negócios associados.")) return;
    setCityActionLoading(true);
    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) { alert(`Erro ao eliminar cidade: ${error.message}`); }
      else {
        if (editingCity?.id === id) { setEditingCity(null); resetCityForm(); }
        loadData();
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro ao eliminar a cidade.");
    } finally {
      setCityActionLoading(false);
    }
  };

  const startEditCity = (city: City) => {
    setEditingCity(city);
    setCityName(city.name);
    setCitySlug(city.slug);
    setCityCountry(city.country);
    setCityIsActive(city.is_active);
    setCityOrderIndex(city.order_index);
  };

  const resetCityForm = () => {
    setEditingCity(null);
    setCityName("");
    setCitySlug("");
    setCityCountry("Portugal");
    setCityIsActive(true);
    setCityOrderIndex(0);
  };

  const filtered = businesses.filter((b) => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "published") return b.published && matchSearch;
    if (filter === "unpublished") return !b.published && matchSearch;
    if (filter === "premium") return isPaidTier(b.plan) && matchSearch;
    return matchSearch;
  });

  const filteredCategories = categories.filter((c) => {
    return !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()) || c.slug.toLowerCase().includes(catSearch.toLowerCase());
  });

  const filteredCities = cities.filter((c) =>
    !citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase()) || c.slug.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    !userSearch || (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.display_name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLeads = leads.filter((l) =>
    !leadSearch || (l.email || "").toLowerCase().includes(leadSearch.toLowerCase()) || (l.name || "").toLowerCase().includes(leadSearch.toLowerCase())
  );

  const planColors: Record<string, string> = {
    free: "bg-[#E5E7EB] text-[#1F2937]",
    pro: "bg-blue-100 text-blue-800",
    premium: "bg-[#FEF3C7] text-[#92400E]",
    business: "bg-purple-100 text-purple-800",
  };

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-[#C8A96B] font-display text-xl animate-pulse">VitrinePro Admin</div>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans">
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
            </Link>
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#E5E7EB] hover:text-white text-sm">Dashboard</Link>
            <Link href="/" className="text-[#E5E7EB] hover:text-white text-sm">Início</Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl text-[#0F172A] mb-6 font-bold">Painel de Administração</h1>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E5E7EB] mb-8 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            📊 Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("businesses")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "businesses"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            🏢 Negócios & Avaliações
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "categories"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            📁 Categorias
          </button>
          <button
            onClick={() => setActiveTab("cities")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "cities"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            🏙️ Cidades
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "users"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            👥 Utilizadores
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-5 py-3 font-display text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === "leads"
                ? "border-[#0F172A] text-[#0F172A] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg"
            }`}
          >
            📩 Leads ({leads.length})
          </button>
        </div>

        {/* ══════════ VISÃO GERAL (dados reais) ══════════ */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {overviewLoading && !overview && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-slate-500">
                A carregar métricas reais…
              </div>
            )}
            {overview && (
              <>
                {/* CONTAS */}
                <section>
                  <h2 className="font-display text-lg font-bold text-[#0F172A] mb-4">👥 Contas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total de contas", value: overview.accounts.total },
                      { label: `Ativas (últimos ${overview.activeWindowDays} dias)`, value: overview.accounts.active30d, hint: "last_sign_in_at real" },
                      { label: "Novas hoje", value: overview.accounts.newToday },
                      { label: "Novas (7 dias)", value: overview.accounts.new7d },
                      { label: "Novas (30 dias)", value: overview.accounts.new30d },
                      { label: "Nunca entraram", value: overview.accounts.neverLoggedIn },
                      { label: "Consumidores (0 Montras)", value: overview.accounts.consumers },
                      { label: "Comerciantes (≥1 Montra)", value: overview.accounts.merchants },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                        <div className="text-3xl font-bold font-display text-[#0F172A] mb-1">{s.value}</div>
                        <div className="text-sm text-[#1F2937] font-medium">{s.label}</div>
                        {s.hint && <div className="text-[11px] text-slate-400 mt-1">{s.hint}</div>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    “Ativa” = fez login nos últimos {overview.activeWindowDays} dias (last_sign_in_at do Supabase Auth).
                    Admin ({overview.accounts.admins}) não precisa de assinatura Stripe — autorização da plataforma, não produto comercial.
                  </p>
                </section>

                {/* MONTRAS */}
                <section>
                  <h2 className="font-display text-lg font-bold text-[#0F172A] mb-4">🏢 Montras</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total de Montras", value: overview.businesses.total },
                      { label: "Publicadas", value: overview.businesses.published },
                      { label: "Não publicadas", value: overview.businesses.unpublished },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                        <div className="text-3xl font-bold font-display text-[#0F172A] mb-1">{s.value}</div>
                        <div className="text-sm text-[#1F2937] font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* PLANOS */}
                <section>
                  <h2 className="font-display text-lg font-bold text-[#0F172A] mb-4">💳 Planos (por Montra)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Free", value: overview.businesses.plans.free },
                      { label: "Pro", value: overview.businesses.plans.pro },
                      { label: "Business", value: overview.businesses.plans.business },
                      { label: "Outros", value: overview.businesses.plans.other },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                        <div className="text-3xl font-bold font-display text-[#C8A96B] mb-1">{s.value}</div>
                        <div className="text-sm text-[#1F2937] font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* CONTEÚDO */}
                <section>
                  <h2 className="font-display text-lg font-bold text-[#0F172A] mb-4">📦 Conteúdo</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Produtos", value: overview.content.products },
                      { label: "Novidades", value: overview.content.posts },
                      { label: "Itens de galeria", value: overview.content.gallery },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                        <div className="text-3xl font-bold font-display text-[#0F172A] mb-1">{s.value}</div>
                        <div className="text-sm text-[#1F2937] font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === "businesses" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total de negócios", value: stats.totalBusinesses, color: "text-[#0F172A]" },
                { label: "Publicados", value: stats.publishedBusinesses, color: "text-green-600" },
                { label: "Total avaliações", value: stats.totalReviews, color: "text-[#C8A96B]" },
                { label: "Avaliações pendentes", value: stats.pendingReviews, color: "text-red-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                  <div className={`text-3xl font-bold font-display ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-sm text-[#1F2937] font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
              <input
                type="text"
                placeholder="Pesquisar negócios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] flex-1 min-w-48 focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
              />
              <div className="flex gap-2 flex-wrap">
                {(["all", "published", "unpublished", "premium"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-[#0F172A] text-white" : "bg-[#FAF7F2] text-[#1F2937] hover:bg-[#E5E7EB]"}`}
                  >
                    {f === "all" ? "Todos" : f === "published" ? "Publicados" : f === "unpublished" ? "Não publicados" : "Planos Pagos"}
                  </button>
                ))}
              </div>
              <button onClick={loadData} className="px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] hover:bg-[#E5E7EB] transition-colors">
                Atualizar
              </button>
            </div>

            {/* Businesses Table */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Negócio</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Categoria</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Cidade</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Plano</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Estado</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Destaque</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Visualizações</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-[#1F2937]">
                          Nenhum negócio encontrado.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((biz) => (
                        <tr key={biz.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {biz.logo_url ? (
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image src={biz.logo_url} alt="" fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#E5E7EB] flex-shrink-0" />
                              )}
                              <div>
                                <div className="font-semibold text-[#0F172A]">{biz.name}</div>
                                <div className="text-[10px] text-[#9CA3AF] font-mono">{biz.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#1F2937]">{(biz.categories as any)?.name || "—"}</td>
                          <td className="px-4 py-3 text-[#1F2937]">{(biz.cities as any)?.name || "—"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={biz.plan}
                              onChange={(e) => setPlan(biz, e.target.value as any)}
                              disabled={actionLoading === biz.id + biz.plan}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${planColors[biz.plan] || planColors.free} focus:outline-none focus:ring-1 focus:ring-slate-400`}
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium (legado)</option>
                              <option value="business">Business</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePublished(biz)}
                              disabled={actionLoading === biz.id}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                biz.published
                                  ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                                  : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                              } disabled:opacity-50`}
                            >
                              {actionLoading === biz.id ? "..." : biz.published ? "Publicado" : "Não publicado"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleFeatured(biz)}
                              disabled={actionLoading === biz.id + "featured"}
                              title={(biz as any).is_featured ? "Remover destaque" : "Destacar negócio"}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                (biz as any).is_featured
                                  ? "bg-[#FEF3C7] text-[#92400E] hover:bg-red-100 hover:text-red-700"
                                  : "bg-[#FAF7F2] text-[#9CA3AF] hover:bg-[#FEF3C7] hover:text-[#92400E]"
                              } disabled:opacity-50`}
                            >
                              {actionLoading === biz.id + "featured" ? "..." : (biz as any).is_featured ? "⭐ Destacado" : "— Normal"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-[#1F2937]">{biz.view_count || 0}</td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs font-medium">
                            {new Date(biz.created_at).toLocaleDateString("pt-PT")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/business/${biz.id}`}
                                className="text-[#C8A96B] hover:underline text-xs font-bold"
                                target="_blank"
                              >
                                Ver
                              </Link>
                              <button
                                onClick={() => deleteBusiness(biz.id)}
                                disabled={actionLoading === biz.id + "delete"}
                                className="text-red-500 hover:text-red-700 text-xs font-bold disabled:opacity-50"
                              >
                                {actionLoading === biz.id + "delete" ? "..." : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3.5 border-t border-[#E5E7EB] bg-[#FAF7F2] text-xs text-[#9CA3AF] font-medium">
                {filtered.length} negócio{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mt-8 shadow-sm">
              <h2 className="font-display text-xl text-[#0F172A] mb-4 font-bold border-b pb-2">Avaliações pendentes</h2>
              <ReviewsPanel />
            </div>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column: List of Categories */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category Search & Title */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
                <h2 className="text-base font-bold text-[#0F172A] font-display">
                  Categorias Ativas ({categories.length})
                </h2>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou slug..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] w-64 max-w-full focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                />
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-12">Ícone</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Nome</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Slug (SEO)</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Categoria Pai</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-20">Ordem</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-20">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Nenhuma categoria cadastrada ou encontrada.
                          </td>
                        </tr>
                      ) : (
                        filteredCategories.map((cat) => {
                          const parentName = cat.parent_id
                            ? categories.find((c) => c.id === cat.parent_id)?.name || "Subcategoria"
                            : "Categoria Principal";
                          return (
                            <tr key={cat.id} className="hover:bg-[#FAF7F2] transition-colors">
                              <td className="px-4 py-3 text-center text-lg">{cat.icon || "📁"}</td>
                              <td className="px-4 py-3 font-medium text-[#0F172A]">{cat.name}</td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{cat.slug}</td>
                              <td className="px-4 py-3 text-slate-600 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${cat.parent_id ? "bg-slate-150 text-slate-700 border border-slate-200" : "bg-[#FEF3C7] text-[#92400E]"}`}>
                                  {parentName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs">{cat.order_index}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                  {cat.is_active ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => startEditCategory(cat)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    disabled={catActionLoading}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold disabled:opacity-55"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: Add/Edit Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm sticky top-24">
                <h3 className="font-display text-lg text-[#0F172A] mb-4 font-bold border-b pb-2">
                  {editingCategory ? "📝 Editar Categoria" : "➕ Adicionar Categoria"}
                </h3>
                
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nome da Categoria
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Ex: Nutricionista, Moda, Ebooks"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Ícone (Emoji)
                    </label>
                    <input
                      type="text"
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      placeholder="Ex: 🧠, 🛍️, 💻"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Slug Único (SEO)
                    </label>
                    <input
                      type="text"
                      required
                      value={catSlug}
                      onChange={(e) => setCatSlug(slugify(e.target.value))}
                      placeholder="Ex: nutricionista, moda-local"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] font-mono focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>

                  {/* Parent Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Categoria Pai
                    </label>
                    <select
                      value={catParentId}
                      onChange={(e) => setCatParentId(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    >
                      <option value="">Nenhuma (Categoria Principal)</option>
                      {categories
                        .filter((c) => !editingCategory || c.id !== editingCategory.id) // Avoid self-referencing hierarchy
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={catDescription}
                      onChange={(e) => setCatDescription(e.target.value)}
                      placeholder="Breve descrição da categoria para indexação de SEO..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>

                  {/* Order Index */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={catOrderIndex}
                      onChange={(e) => setCatOrderIndex(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] font-mono focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="catIsActive"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="rounded border-[#E5E7EB] text-[#C8A96B] focus:ring-[#C8A96B]"
                    />
                    <label htmlFor="catIsActive" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                      Categoria Ativa para SEO
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2 border-t mt-4">
                    <button
                      type="submit"
                      disabled={catActionLoading}
                      className="flex-1 px-4 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-slate-850 transition-colors disabled:opacity-50"
                    >
                      {catActionLoading ? "Salvando..." : editingCategory ? "Atualizar" : "Criar Categoria"}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={resetCatForm}
                        className="px-4 py-2.5 bg-slate-200 text-[#0F172A] text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                </form>
              </div>
            </div>

          </div>
        )}

        {/* Cities Tab */}
        {activeTab === "cities" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
                <h2 className="text-base font-bold text-[#0F172A] font-display">
                  Cidades Ativas ({cities.length})
                </h2>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou slug..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] w-64 max-w-full focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                />
              </div>

              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Nome</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Slug (SEO)</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">País</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-20">Ordem</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-20">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#0F172A] w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredCities.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            Nenhuma cidade cadastrada ou encontrada.
                          </td>
                        </tr>
                      ) : (
                        filteredCities.map((city) => (
                          <tr key={city.id} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#0F172A]">{city.name}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{city.slug}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{city.country}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{city.order_index}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${city.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                {city.is_active ? "Ativa" : "Inativa"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button onClick={() => startEditCity(city)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Editar</button>
                                <button onClick={() => handleDeleteCity(city.id)} disabled={cityActionLoading} className="text-red-500 hover:text-red-700 text-xs font-bold disabled:opacity-55">Excluir</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm sticky top-24">
                <h3 className="font-display text-lg text-[#0F172A] mb-4 font-bold border-b pb-2">
                  {editingCity ? "📝 Editar Cidade" : "➕ Adicionar Cidade"}
                </h3>
                <form onSubmit={handleSaveCity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nome da Cidade</label>
                    <input
                      type="text"
                      required
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder="Ex: Lisboa, Porto, Braga"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Slug Único (SEO)</label>
                    <input
                      type="text"
                      required
                      value={citySlug}
                      onChange={(e) => setCitySlug(slugify(e.target.value))}
                      placeholder="Ex: lisboa, porto"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] font-mono focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">País</label>
                    <select
                      value={cityCountry}
                      onChange={(e) => setCityCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    >
                      <option value="Portugal">Portugal</option>
                      <option value="Brasil">Brasil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Ordem de Exibição</label>
                    <input
                      type="number"
                      value={cityOrderIndex}
                      onChange={(e) => setCityOrderIndex(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] font-mono focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="cityIsActive"
                      checked={cityIsActive}
                      onChange={(e) => setCityIsActive(e.target.checked)}
                      className="rounded border-[#E5E7EB] text-[#C8A96B] focus:ring-[#C8A96B]"
                    />
                    <label htmlFor="cityIsActive" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                      Cidade Ativa para SEO
                    </label>
                  </div>
                  <div className="flex gap-2 pt-2 border-t mt-4">
                    <button
                      type="submit"
                      disabled={cityActionLoading}
                      className="flex-1 px-4 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {cityActionLoading ? "Salvando..." : editingCity ? "Atualizar" : "Criar Cidade"}
                    </button>
                    {editingCity && (
                      <button type="button" onClick={resetCityForm} className="px-4 py-2.5 bg-slate-200 text-[#0F172A] text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Busca + filtros */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-base font-bold text-[#0F172A] font-display">
                  Contas ({userTotal})
                </h2>
                <input
                  type="text"
                  placeholder="Pesquisar por email ou user_id…"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadAdminUsers(1, userSearch, userFilter);
                  }}
                  onBlur={() => loadAdminUsers(1, userSearch, userFilter)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] w-64 max-w-full focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["todos", "ativos", "inativos", "consumidores", "comerciantes", "admins"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setUserFilter(f);
                      loadAdminUsers(1, userSearch, f);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${userFilter === f ? "bg-[#0F172A] text-white" : "bg-[#FAF7F2] text-[#1F2937] hover:bg-[#E5E7EB]"}`}
                  >
                    {f === "todos" ? "Todos" : f === "ativos" ? "Ativos" : f === "inativos" ? "Inativos" : f === "consumidores" ? "Consumidores" : f === "comerciantes" ? "Comerciantes" : "Admins"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Tipo</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Montras</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Último login</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Registo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {userLoading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">A carregar…</td></tr>
                    ) : adminUsers.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhuma conta encontrada.</td></tr>
                    ) : (
                      adminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FAF7F2] transition-colors cursor-pointer" onClick={() => openUser(u)}>
                          <td className="px-4 py-3 text-[#0F172A] font-medium break-all">{u.email || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.tipo === "admin" ? "bg-[#0F172A] text-white" : u.tipo === "comerciante" ? "bg-[#C8A96B]/20 text-[#8a6f3e]" : "bg-slate-100 text-slate-600"}`}>
                              {u.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === "ativo" ? "bg-green-100 text-green-700" : u.status === "nunca_entrou" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                              {u.status === "ativo" ? "ativo" : u.status === "nunca_entrou" ? "nunca entrou" : "inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.businessCount}</td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-PT") : "—"}</td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString("pt-PT") : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3.5 border-t border-[#E5E7EB] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF] font-medium">
                  Página {userPage} de {userTotalPages} · {userTotal} contas
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => loadAdminUsers(userPage - 1, userSearch, userFilter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#E5E7EB] disabled:opacity-40"
                  >
                    ← Anterior
                  </button>
                  <button
                    disabled={userPage >= userTotalPages}
                    onClick={() => loadAdminUsers(userPage + 1, userSearch, userFilter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#E5E7EB] disabled:opacity-40"
                  >
                    Seguinte →
                  </button>
                </div>
              </div>
            </div>

            {/* Detalhe do utilizador */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={() => setSelectedUser(null)}>
                <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                  {selectedUserLoading ? (
                    <p className="text-slate-500">A carregar…</p>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-display text-xl font-bold text-[#0F172A] break-all">{selectedUser.user.email || "—"}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-1">{selectedUser.user.id}</p>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                        <div><span className="text-slate-400">Tipo:</span> <strong>{selectedUser.user.tipo}</strong></div>
                        <div><span className="text-slate-400">Status:</span> <strong>{selectedUser.user.status}</strong></div>
                        <div><span className="text-slate-400">Criada em:</span> {selectedUser.user.created_at ? new Date(selectedUser.user.created_at).toLocaleString("pt-PT") : "—"}</div>
                        <div><span className="text-slate-400">Último login:</span> {selectedUser.user.last_sign_in_at ? new Date(selectedUser.user.last_sign_in_at).toLocaleString("pt-PT") : "—"}</div>
                        <div><span className="text-slate-400">Montras:</span> <strong>{selectedUser.user.businessCount}</strong></div>
                      </div>
                      {selectedUser.businesses.length > 0 && (
                        <>
                          <h4 className="font-bold text-[#0F172A] mb-2">Montras</h4>
                          <div className="space-y-2">
                            {selectedUser.businesses.map((b: any) => (
                              <div key={b.id} className="flex items-center justify-between border border-[#E5E7EB] rounded-lg px-3 py-2">
                                <div>
                                  <div className="font-medium text-[#0F172A]">{b.name}</div>
                                  <div className="text-xs text-slate-400">/{b.slug} · {b.city || "—"} · {b.published ? "publicada" : "não publicada"} · {b.plan || "free"}</div>
                                </div>
                                <div className="flex gap-2">
                                  <a href={`/vitrine/${b.slug}`} target="_blank" rel="noopener" className="text-xs text-[#C8A96B] hover:underline">Pública ↗</a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] font-display">
                Leads captados ({leads.length})
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] w-64 max-w-full focus:outline-none focus:ring-1 focus:ring-[#C8A96B]"
                />
                <button onClick={loadData} className="px-3 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] hover:bg-[#E5E7EB]">
                  Atualizar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Nome</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">WhatsApp</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Tipo de Negócio</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Origem</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#0F172A]">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          {leads.length === 0
                            ? "Nenhum lead ainda. O popup de captação aparece após 7 segundos para visitantes não autenticados."
                            : "Nenhum lead encontrado."}
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((l) => (
                        <tr key={l.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#0F172A]">{l.name}</td>
                          <td className="px-4 py-3 text-slate-600">{l.email}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {l.whatsapp ? (
                              <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">
                                {l.whatsapp}
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{l.business_type || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#1F2937] rounded text-[10px] font-medium">{l.source || "popup"}</span>
                          </td>
                          <td className="px-4 py-3 text-[#9CA3AF] text-xs font-medium">
                            {new Date(l.created_at).toLocaleDateString("pt-PT")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3.5 border-t border-[#E5E7EB] bg-[#FAF7F2] text-xs text-[#9CA3AF] font-medium">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} · Execute a migration 005_leads.sql no Supabase para activar a tabela
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsPanel() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, businesses(name)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false })
        .limit(20);
      setReviews(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const approve = async (id: string) => {
    await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const reject = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <p className="text-[#1F2937] text-sm">A carregar...</p>;
  if (reviews.length === 0) return <p className="text-[#1F2937] text-sm text-center py-4">Nenhuma avaliação pendente.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="flex items-start justify-between p-4 bg-[#FAF7F2] rounded-lg gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[#0F172A] text-sm">{r.author_name}</span>
              <span className="text-[#C8A96B] text-xs">{"★".repeat(r.rating)}</span>
              <span className="text-xs text-[#9CA3AF] font-medium">em {r.businesses?.name || "—"}</span>
            </div>
            {r.comment && <p className="text-[#1F2937] text-sm truncate leading-relaxed">{r.comment}</p>}
            <span className="text-[10px] text-[#9CA3AF] font-semibold">{new Date(r.created_at).toLocaleDateString("pt-PT")}</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm">
              Aprovar
            </button>
            <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm">
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

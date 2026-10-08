import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A2.11: only routes that actually exist. Removed ghost routes that
  // returned 404: /categorias, /cidades, /lojas.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1.0, lastModified: new Date() },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/explorar`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/plano-business`, changeFrequency: "weekly", priority: 0.9 },
  ];

  let businessRoutes: MetadataRoute.Sitemap = [];
  const seoRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [bizRes, citiesRes, catsRes] = await Promise.all([
      supabase
        .from("businesses")
        .select("slug, updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("cities")
        .select("id, slug")
        .eq("is_active", true),
      supabase
        .from("categories")
        .select("id, slug")
        .eq("is_active", true),
    ]);

    if (bizRes.data) {
      businessRoutes = bizRes.data.map((b) => ({
        url: `${siteUrl}/vitrine/${b.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      }));
    }

    if (citiesRes.data && catsRes.data) {
      // I5 (A10.2): só inclui cidade×categoria com conteúdo real elegível
      // (≥1 negócio publicado). Combinações vazias não entram no sitemap
      // para não gerar páginas indexáveis sem oferta local.
      const { data: combos } = await supabase
        .from("businesses")
        .select("city_id, category_id")
        .eq("published", true)
        .not("city_id", "is", null)
        .not("category_id", "is", null)
        .limit(5000);
      const citySlugById = new Map<string, string>(
        (citiesRes.data || []).map((c: { id: string; slug: string }) => [c.id, c.slug])
      );
      const catSlugById = new Map<string, string>(
        (catsRes.data || []).map((c: { id: string; slug: string }) => [c.id, c.slug])
      );
      const seen = new Set<string>();
      for (const b of combos || []) {
        const cSlug = citySlugById.get(b.city_id) || b.city_id;
        const kSlug = catSlugById.get(b.category_id) || b.category_id;
        if (!cSlug || !kSlug) continue;
        const key = `${cSlug}/${kSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        seoRoutes.push({
          url: `${siteUrl}/${key}`,
          changeFrequency: "weekly" as const,
          priority: 0.8,
          lastModified: new Date(),
        });
      }
    }
  } catch {
    // Supabase unavailable at build time — sitemap still serves static routes
  }

  return [...staticRoutes, ...businessRoutes, ...seoRoutes];
}

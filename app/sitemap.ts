import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1.0, lastModified: new Date() },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/explorar`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/categorias`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/cidades`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/lojas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/dashboard`, changeFrequency: "monthly", priority: 0.4 },
  ];

  let businessRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from("businesses")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (data) {
      businessRoutes = data.map((b) => ({
        url: `${siteUrl}/vitrine/${b.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      }));
    }
  } catch {
    // Supabase unavailable at build time — sitemap still serves static routes
  }

  return [...staticRoutes, ...businessRoutes];
}

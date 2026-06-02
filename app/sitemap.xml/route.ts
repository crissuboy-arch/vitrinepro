import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const host = request.headers.get("host") || "vitrinepro.pt";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const siteUrl = `${protocol}://${host}`;

    // Fetch dynamic entities from Supabase
    const [citiesRes, categoriesRes, businessesRes, productsRes] = await Promise.all([
      supabase.from("cities").select("slug").eq("is_active", true),
      supabase.from("categories").select("slug").eq("is_active", true),
      supabase.from("businesses").select("slug, type").eq("published", true),
      supabase.from("products").select("slug, type, businesses!inner(published)").eq("businesses.published", true),
    ]);

    const cities = citiesRes.data || [];
    const categories = categoriesRes.data || [];
    const businesses = businessesRes.data || [];
    const products = productsRes.data || [];

    // Static pages
    const staticPages = ["", "/explorar", "/pricing", "/login", "/register"];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 1. Add static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${siteUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    }

    // 2. Add Programmatic SEO pages /[city]/[category] (All combinations of active cities & categories)
    for (const city of cities) {
      for (const cat of categories) {
        xml += `
  <url>
    <loc>${siteUrl}/${city.slug}/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // 3. Add Marketplace category landing pages /marketplace/[category]
    for (const cat of categories) {
      xml += `
  <url>
    <loc>${siteUrl}/marketplace/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // 4. Add Public Vitrinas (/vitrine/[slug]) & Storefronts (/loja/[slug])
    for (const biz of businesses) {
      const isStore = biz.type === "loja";
      const route = isStore ? "loja" : "vitrine";
      xml += `
  <url>
    <loc>${siteUrl}/${route}/${biz.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    // 5. Add Product landing pages (/produto/[slug])
    for (const prod of products) {
      if (prod.slug) {
        xml += `
  <url>
    <loc>${siteUrl}/produto/${prod.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=18000",
      },
    });
  } catch (error) {
    console.error("[SITEMAP] Error generating sitemap.xml:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml" },
      }
    );
  }
}

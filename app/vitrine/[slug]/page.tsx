import VitrineClient from "./VitrineClient";
import { supabase } from "../../lib/supabase";
import type { Metadata } from "next";

// ─── Schema.org LocalBusiness JSON-LD ─────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  segunda: "Mo", "segunda-feira": "Mo",
  terça: "Tu", "terça-feira": "Tu", terca: "Tu",
  quarta: "We", "quarta-feira": "We",
  quinta: "Th", "quinta-feira": "Th",
  sexta: "Fr", "sexta-feira": "Fr",
  sábado: "Sa", sabado: "Sa",
  domingo: "Su",
};

function buildOpeningHours(hours: any[]): string[] {
  if (!Array.isArray(hours)) return [];
  return hours
    .filter((h) => !h.closed && h.open && h.close)
    .map((h) => {
      const iso = DAY_MAP[h.day?.toLowerCase()?.trim() ?? ""] ?? null;
      return iso ? `${iso} ${h.open}-${h.close}` : null;
    })
    .filter(Boolean) as string[];
}

function buildLocalBusinessSchema(data: any, slug: string): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    description: data.description || undefined,
    url: `${baseUrl}/vitrine/${slug}`,
  };

  if (data.cover_url || data.logo_url) {
    schema.image = data.cover_url || data.logo_url;
  }

  if (data.phone || data.whatsapp) {
    schema.telephone = data.phone || data.whatsapp;
  }

  if (data.email) {
    schema.email = data.email;
  }

  if (data.address || data.city) {
    schema.address = {
      "@type": "PostalAddress",
      ...(data.address ? { streetAddress: data.address } : {}),
      ...(data.city ? { addressLocality: data.city } : {}),
      addressCountry: data.country === "Brasil" ? "BR" : "PT",
    };
  }

  if (data.instagram) {
    schema.sameAs = [`https://instagram.com/${data.instagram.replace(/^@/, "")}`];
  }

  const openingHours = buildOpeningHours(data.opening_hours ?? []);
  if (openingHours.length > 0) {
    schema.openingHours = openingHours;
  }

  if (
    data.rating_average && data.rating_average > 0 &&
    data.rating_count && data.rating_count > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(Number(data.rating_average).toFixed(1)),
      reviewCount: String(data.rating_count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (slug === "demo") {
    const cover = "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=1200&h=500&fit=crop";
    return {
      title: "Café Central em Lisboa | VitrinePro",
      description: "O Café Central é o ponto de encontro de eleição no coração histórico de Lisboa. Cafetaria & Pastelaria com expresso premiado e pastel de nata.",
      keywords: "Café Central, Lisboa, Cafetaria, Pastelaria, Portugal, VitrinePro",
      openGraph: {
        title: "Café Central",
        description: "Cafetaria & Pastelaria no coração de Lisboa.",
        images: [{ url: cover }],
        type: "website",
      },
      twitter: { card: "summary_large_image", title: "Café Central em Lisboa | VitrinePro", images: [cover] },
    };
  }

  if (slug === "exemplo") {
    const cover = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop";
    return {
      title: "Estúdio Ouro & Co. em Lisboa | VitrinePro",
      description: "O Estúdio Ouro & Co. é um espaço exclusivo dedicado ao autocuidado, beleza e bem-estar em Lisboa.",
      keywords: "Estúdio Ouro, Lisboa, Beleza, Bem-estar, Portugal, VitrinePro",
      openGraph: {
        title: "Estúdio Ouro & Co.",
        description: "Beleza e Bem-estar em Lisboa.",
        images: [{ url: cover }],
        type: "website",
      },
      twitter: { card: "summary_large_image", title: "Estúdio Ouro & Co. em Lisboa | VitrinePro", images: [cover] },
    };
  }

  try {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      const name = data.name || "Vitrine Comercial";
      const city = data.city || "Geral";
      const desc = data.description || "Consulte a nossa vitrina oficial.";
      const cat = data.category || "Serviços";
      const country = data.country || "Portugal";
      const cover = data.cover_url || data.logo_url || "/og-default.png";

      return {
        title: `${name} em ${city} | VitrinePro`,
        description: desc.slice(0, 155),
        keywords: `${name}, ${cat}, ${city}, ${country}, VitrinePro, negócios locais`,
        openGraph: {
          title: name,
          description: desc.slice(0, 155),
          images: [{ url: cover }],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} em ${city} | VitrinePro`,
          description: desc.slice(0, 155),
          images: [cover],
        },
      };
    }
  } catch (e) {
    console.error("Error generating metadata:", e);
  }

  return {
    title: "VitrinePro",
    description: "Crie a sua vitrina profissional e receba pedidos no WhatsApp.",
  };
}

export default async function VitrinePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch business data server-side only for JSON-LD (demo slugs get no schema)
  let jsonLd: Record<string, unknown> | null = null;
  if (slug !== "demo" && slug !== "exemplo") {
    try {
      const { data } = await supabase
        .from("businesses")
        .select("name,description,cover_url,logo_url,phone,whatsapp,email,address,city,country,instagram,opening_hours,rating_average,rating_count")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (data) jsonLd = buildLocalBusinessSchema(data, slug);
    } catch {
      // Non-critical — page still renders without schema
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <VitrineClient slug={slug} />
    </>
  );
}

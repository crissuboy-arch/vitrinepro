import VitrineClient from "./VitrineClient";
import { supabase } from "../../lib/supabase";
import type { Metadata } from "next";

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
  return <VitrineClient slug={resolvedParams.slug} />;
}

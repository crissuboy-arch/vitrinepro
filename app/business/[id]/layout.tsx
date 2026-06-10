import type { Metadata } from "next";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabase";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data } = await supabase
      .from("businesses")
      .select("name, city, category, description, logo_url, cover_url")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      const name = data.name || "Negócio";
      const city = data.city || "";
      const desc = (
        data.description || `${name}${city ? ` em ${city}` : ""}. Veja contactos, produtos e serviços na VitrinePro.`
      ).slice(0, 155);
      const image = data.cover_url || data.logo_url || "/og-default.png";
      const title = `${name}${city ? ` em ${city}` : ""} | VitrinePro`;

      return {
        title,
        description: desc,
        alternates: { canonical: `/business/${id}` },
        openGraph: {
          type: "website",
          siteName: "VitrinePro",
          locale: "pt_PT",
          url: `${siteUrl}/business/${id}`,
          title,
          description: desc,
          images: [{ url: image }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: desc,
          images: [image],
        },
      };
    }
  } catch {
    // Fall through to the generic metadata below.
  }

  return {
    title: "Negócio | VitrinePro",
    description: "Veja este negócio local na VitrinePro.",
    alternates: { canonical: `/business/${id}` },
  };
}

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return children;
}

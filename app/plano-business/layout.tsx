import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import type { ReactNode } from "react";

const siteUrl = getSiteUrl();

const TITLE = "Plano Business | VitrinePro";
const DESCRIPTION =
  "Conheça o plano Business da VitrinePro: todas as funcionalidades do Pro, link curto personalizado e destaque para a sua montra digital. Disponível em breve.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/plano-business" },
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: `${siteUrl}/plano-business`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/brand/og-institutional.jpg", width: 1200, height: 630, alt: "VitrinePro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/og-institutional.jpg"],
  },
};

export default function PlanoBusinessLayout({ children }: { children: ReactNode }) {
  return children;
}

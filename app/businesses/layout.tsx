import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");

const TITLE = "Marketplace de negócios locais | VitrinePro";
const DESCRIPTION =
  "Descubra e contacte negócios locais das comunidades em Portugal — lojas, serviços e restaurantes na vitrine digital VitrinePro.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/businesses" },
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: `${siteUrl}/businesses`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "VitrinePro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default function BusinessesLayout({ children }: { children: ReactNode }) {
  return children;
}

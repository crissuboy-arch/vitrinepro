import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");

const TITLE = "Explorar negócios por comunidade | VitrinePro";
const DESCRIPTION =
  "Explore negócios locais por comunidade, categoria e cidade em Portugal. Filtre e encontre lojas e serviços na VitrinePro.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/explorar" },
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: `${siteUrl}/explorar`,
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

export default function ExplorarLayout({ children }: { children: ReactNode }) {
  return children;
}

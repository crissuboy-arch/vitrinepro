import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");

const TITLE = "Planos e preços | VitrinePro";
const DESCRIPTION =
  "Conheça os planos da VitrinePro — do grátis ao Business. Crie a sua vitrine digital e receba contactos e clientes sem anúncios pagos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: `${siteUrl}/pricing`,
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

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}

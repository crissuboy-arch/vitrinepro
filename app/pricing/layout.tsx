import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import type { ReactNode } from "react";

const siteUrl = getSiteUrl();

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
    images: [{ url: "/brand/og-institutional.jpg", width: 1200, height: 630, alt: "VitrinePro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/og-institutional.jpg"],
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}

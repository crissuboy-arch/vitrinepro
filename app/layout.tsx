import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/SupabaseAuthContext";
import CookieConsent from "./components/CookieConsent";
import GoogleAnalytics from "./components/GoogleAnalytics";
import MetaPixel from "./components/MetaPixel";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

const SITE_TITLE = "VitrinePro | Montra digital para negócios locais em Portugal";
const SITE_DESCRIPTION =
  "Crie a sua montra digital gratuita: produtos, serviços, WhatsApp e avaliações num só link. Feita para negócios locais em Portugal — online em minutos, sem programadores.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // I5 (A10.2): canonical explícito da home.
  alternates: { canonical: siteUrl },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "VitrinePro",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: siteUrl,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/brand/og-institutional.jpg", width: 1200, height: 630, alt: "VitrinePro — Negócios locais, mais perto de si" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/brand/og-institutional.jpg"],
  },
  // Verification tokens come from env vars; the placeholders were removed.
  ...(googleVerification || bingVerification
    ? {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
        },
      }
    : {}),
};

// Global structured data: Organization + WebSite (helps Google build the knowledge panel).
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "VitrinePro",
      url: siteUrl,
      logo: `${siteUrl}/brand/logo-horizontal-transparent.png`,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "VitrinePro",
      inLanguage: "pt-PT",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>
          {children}
          <CookieConsent />
          <GoogleAnalytics />
          <MetaPixel />
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/SupabaseAuthContext";
import CookieConsent from "./components/CookieConsent";
import GoogleAnalytics from "./components/GoogleAnalytics";
import MetaPixel from "./components/MetaPixel";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitrinepro.pt").replace(/\/$/, "");
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

const SITE_TITLE = "VitrinePro - Coloque seu negócio na frente de quem compra";
const SITE_DESCRIPTION =
  "A sua vitrine digital para negócios locais ganharem visibilidade, contactos e clientes sem depender de anúncios pagos.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "VitrinePro",
  openGraph: {
    type: "website",
    siteName: "VitrinePro",
    locale: "pt_PT",
    url: siteUrl,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "VitrinePro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
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
      logo: `${siteUrl}/logo-vitrinepro.png`,
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
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
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
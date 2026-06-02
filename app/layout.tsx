import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/SupabaseAuthContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitrinePro - Coloque seu negócio na frente de quem compra",
  description: "A sua vitrine digital para negócios locais ganharem visibilidade, contactos e clientes sem depender de anúncios pagos.",
  verification: {
    google: "google-site-verification-placeholder-token",
  },
  other: {
    "msvalidate.01": "bing-webmaster-tools-placeholder-token",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
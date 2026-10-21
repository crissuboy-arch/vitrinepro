import type { Metadata } from "next";
import type { ReactNode } from "react";

// Área privada/autenticação: nunca indexar (o robots.txt também faz disallow).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}

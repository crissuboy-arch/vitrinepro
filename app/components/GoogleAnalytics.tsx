"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = "vp_cookie_consent";
export const CONSENT_EVENT = "vp_consent_changed";

function readConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.analytics === true;
  } catch {
    return false;
  }
}

function GATracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);

  // Boot GA4 when consent is granted
  useEffect(() => {
    if (!enabled || !GA_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments as any); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
    // Send the current page view immediately
    window.gtag("event", "page_view", {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    });
  }, [enabled]);

  // Track subsequent SPA navigations
  useEffect(() => {
    if (!enabled || !GA_ID || typeof window.gtag !== "function") return;
    const qs = searchParams.toString();
    window.gtag("event", "page_view", {
      page_path: pathname + (qs ? `?${qs}` : ""),
      page_title: document.title,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Listen for consent changes (cross-tab via storage, same-tab via custom event)
  useEffect(() => {
    const update = () => setEnabled(readConsent());
    update();
    window.addEventListener("storage", update);
    window.addEventListener(CONSENT_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(CONSENT_EVENT, update);
    };
  }, []);

  if (!enabled || !GA_ID) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      strategy="afterInteractive"
    />
  );
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GATracker />
    </Suspense>
  );
}

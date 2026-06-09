"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CONSENT_EVENT } from "./GoogleAnalytics";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CONSENT_KEY = "vp_cookie_consent";

function readMarketing(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.marketing === true;
  } catch {
    return false;
  }
}

function setupFbqQueue() {
  if (window.fbq) return;
  const fbq: any = function (...args: any[]) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  };
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
}

function PixelTracker() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Listen for consent changes (same-tab custom event + cross-tab storage)
  useEffect(() => {
    const update = () => setEnabled(readMarketing());
    update();
    window.addEventListener("storage", update);
    window.addEventListener(CONSENT_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(CONSENT_EVENT, update);
    };
  }, []);

  // Initialize pixel + first PageView when marketing consent is granted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled || !PIXEL_ID) return;
    setupFbqQueue();
    window.fbq?.("init", PIXEL_ID);
    window.fbq?.("track", "PageView");
    setInitialized(true);
  }, [enabled]);

  // Track subsequent SPA navigations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialized || !window.fbq) return;
    window.fbq("track", "PageView");
  }, [pathname]);

  if (!enabled || !PIXEL_ID) return null;

  return (
    <Script
      id="meta-pixel-sdk"
      src="https://connect.facebook.net/en_US/fbevents.js"
      strategy="afterInteractive"
    />
  );
}

export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <PixelTracker />
    </Suspense>
  );
}

"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
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
  type FbqFn = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: (...args: unknown[]) => void;
    loaded?: boolean;
    version?: string;
  };
  const fbq = (function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as FbqFn;
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
  const initializedRef = useRef(false);

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

  // Initialize pixel once consent is granted, then track every navigation.
  useEffect(() => {
    if (!enabled || !PIXEL_ID) return;
    if (!initializedRef.current) {
      setupFbqQueue();
      window.fbq?.("init", PIXEL_ID);
      initializedRef.current = true;
    }
    window.fbq?.("track", "PageView");
  }, [enabled, pathname]);

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

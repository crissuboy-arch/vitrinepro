declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function fire(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

export function trackVitrineView(businessId: string, businessName: string, category: string) {
  fire("vitrine_view", { business_id: businessId, business_name: businessName, category });
}

export function trackMarketplaceView(category: string) {
  fire("marketplace_view", { category });
}

export function trackWhatsAppClick(businessId: string, businessName: string) {
  fire("whatsapp_click", { business_id: businessId, business_name: businessName });
}

export function trackCatalogPdfDownload(businessId: string, businessName: string) {
  fire("catalog_pdf_download", { business_id: businessId, business_name: businessName });
}

export function trackSignUp(method: "email" | "google") {
  fire("sign_up", { method });
}

export function trackVitrineCreate(businessId: string, businessName: string, category: string) {
  fire("vitrine_create", { business_id: businessId, business_name: businessName, category });
}

export function trackPhoneClick(businessId: string, businessName: string) {
  fire("phone_click", { business_id: businessId, business_name: businessName });
}

// A6.5 — "Novidades na Vitrine". Estes eventos vão para o sistema próprio
// /api/analytics (allowlist em lib/analytics-guard.ts), não para o gtag —
// o payload exige business_id e é validado no servidor.
function fireServer(
  event: "novidade_view" | "novidade_click" | "novidade_save",
  businessId: string
) {
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, event_type: event }),
    }).catch(() => {});
  } catch {
    // analytics nunca quebra a navegação
  }
}

export function trackNovidadeView(businessId: string) {
  fireServer("novidade_view", businessId);
}

export function trackNovidadeClick(businessId: string) {
  fireServer("novidade_click", businessId);
}

export function trackNovidadeSave(businessId: string) {
  fireServer("novidade_save", businessId);
}

export {};

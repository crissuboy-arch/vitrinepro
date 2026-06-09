declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
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

export {};

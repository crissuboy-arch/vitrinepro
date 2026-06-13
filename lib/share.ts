// Feature 4 — Advanced sharing helpers.

export function originBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://vitrinepro.pt";
}

export function vitrineUrl(slug: string): string {
  return `${originBase()}/vitrine/${slug}`;
}

export function qrImageUrl(url: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export function whatsappShareUrl(url: string, name: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`Olha este negócio: ${name} ${url}`)}`;
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/** Records a share server-side (anonymous, best-effort — never throws). */
export async function recordShare(businessId: string, platform: string): Promise<void> {
  try {
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, action: "record_share", platform }),
    });
  } catch {
    /* best-effort */
  }
}

/** Downloads the QR code PNG (falls back to opening it if the fetch is blocked). */
export async function downloadQr(url: string, filename = "qrcode-vitrinepro.png"): Promise<void> {
  const img = qrImageUrl(url, 600);
  try {
    const res = await fetch(img);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(img, "_blank");
  }
}

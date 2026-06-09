declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
      push?: (...args: any[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}

function fbq(track: string, event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) {
    window.fbq(track, event, params);
  } else {
    window.fbq(track, event);
  }
}

export function pixelPageView() {
  fbq("track", "PageView");
}

export function pixelLead() {
  fbq("track", "Lead");
}

export function pixelCompleteRegistration() {
  fbq("track", "CompleteRegistration");
}

export function pixelContact() {
  fbq("track", "Contact");
}

export {};

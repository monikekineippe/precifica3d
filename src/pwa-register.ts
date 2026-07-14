// Guarded PWA service worker registration.
// Only registers in production, outside iframes, and outside Lovable preview hosts.
export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;

  const isPreviewHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  const disabled =
    !import.meta.env.PROD ||
    inIframe ||
    isPreviewHost ||
    url.searchParams.get("sw") === "off";

  if (disabled) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => {
        const swUrl = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
        if (swUrl.endsWith("/sw.js")) r.unregister();
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore registration errors
    });
  });
}

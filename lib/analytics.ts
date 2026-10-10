type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  lwsAnalyticsId?: string;
};

export function analyticsPageUrl(raw: string): string {
  try { const url = new URL(raw); return `${url.origin}${url.pathname}`; } catch { return ""; }
}

export function trackQuoteSuccess(service: string): void {
  if (typeof window === "undefined") return;
  const analytics = window as AnalyticsWindow;
  if (!analytics.lwsAnalyticsId || !analytics.gtag) return;
  // Only an allowlisted category is sent. Never pass the form, contact details,
  // message, product wording, filenames or the request ID to Analytics.
  if (!["commercial", "residential", "vehicles", "engraving", "print", "unsure", "general"].includes(service)) return;
  try { analytics.gtag("event", "generate_lead", { service_category: service, send_to: analytics.lwsAnalyticsId }); } catch { /* Measurement must never interrupt quote delivery. */ }
}

export function initializeAnalytics(id: string): void {
  const analytics = window as AnalyticsWindow;
  if (analytics.lwsAnalyticsId) return;
  analytics.dataLayer ??= [];
  analytics.gtag = function () { analytics.dataLayer!.push(arguments); };
  analytics.lwsAnalyticsId = id;
  analytics.gtag("js", new Date());
  analytics.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: analyticsPageUrl(window.location.href),
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
  });
}

export function trackPageView(previous: string): string {
  const analytics = window as AnalyticsWindow;
  const page = analyticsPageUrl(window.location.href);
  analytics.gtag?.("set", { page_location: page, page_referrer: previous, page_title: document.title });
  analytics.gtag?.("event", "page_view", { page_location: page, page_referrer: previous, page_title: document.title, send_to: analytics.lwsAnalyticsId });
  return page;
}

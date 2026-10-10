"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { initializeAnalytics, trackPageView } from "@/lib/analytics";

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const previous = useRef("");
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    initializeAnalytics(measurementId);
    setActive(true);
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const referrer = previous.current || (document.referrer ? new URL(document.referrer).origin : "");
    previous.current = trackPageView(referrer);
  }, [pathname, measurementId]);
  return active ? <Script id="google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" /> : null;
}

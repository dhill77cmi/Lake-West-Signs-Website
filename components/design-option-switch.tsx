"use client";

import { useEffect, useState } from "react";
import { quoteFlowEvent, quoteFlowKey } from "@/lib/quote-preference";
import { Button } from "@/components/ui/button";
import { isDesignPreview } from "@/lib/design-preview";

type Section = "hero" | "services" | "trusted" | "text" | "quote" | "footer";
const sectionCopy = {
  hero: ["Hero design options", "Try a different layout or opening animation."],
  services: ["Service card design options", "Click an option to compare layouts, image frames and corners."],
  trusted: ["Trusted section design options", "Choose how the business names move."],
  text: ["Page text design options", "Applies to text throughout the website. Scroll down to see the effect."],
  quote: ["Quote form design options", "Compare a step-by-step inquiry with a single form. Switching clears the current draft."],
  footer: ["Footer design options", "Switch styles, then scroll up and down to compare the effect."],
} as const;

export function DesignOptionSwitch({ section, layout = "full" }: { section: Section; layout?: "split" | "full" }) {
  const [ready, setReady] = useState(false);
  const [expandedServices, setExpandedServices] = useState(false);
  const [roundedPhotos, setRoundedPhotos] = useState(true);
  const [standardFooter, setStandardFooter] = useState(false);
  useEffect(() => {
    if (!ready || section !== 'footer') return;
    document.documentElement.dataset.footer = standardFooter ? 'standard' : 'reveal';
    return () => { delete document.documentElement.dataset.footer; };
  }, [standardFooter, ready, section]);
  useEffect(() => {
    if (!ready || section !== 'services') return;
    document.documentElement.dataset.serviceCorners = roundedPhotos ? 'rounded' : 'square';
    window.dispatchEvent(new Event('lws-service-layout'));
  }, [roundedPhotos, ready, section]);
  const [serviceGrid, setServiceGrid] = useState(true);
  const [letterReveal, setLetterReveal] = useState(true);
  const [trustedFade, setTrustedFade] = useState(false);
  const [classicIntro, setClassicIntro] = useState(false);
  const [classicQuote, setClassicQuote] = useState(false);
  const replayNextPreview = () => {
    try { sessionStorage.removeItem("lws-hero-intro-seen"); } catch { /* Preview still works without storage. */ }
  };
  useEffect(() => {
    setReady(true);
    if (!isDesignPreview()) return;
    // Shipped defaults: letter reveal, ticker, 2x3 grid, hover-opened frames, rounded corners, reveal footer.
    try { setLetterReveal(localStorage.getItem("lws-scroll-letters") !== "false"); } catch { /* Storage is optional. */ }
    try { setTrustedFade(localStorage.getItem("lws-trusted-style") === "fade"); } catch { /* Optional preference. */ }
    try { setServiceGrid(localStorage.getItem("lws-service-grid") !== "false"); } catch { /* Optional preference. */ }
    try { setExpandedServices(localStorage.getItem("lws-service-expanded") === "true"); } catch { /* Optional preference. */ }
    try { setRoundedPhotos(localStorage.getItem("lws-service-rounded") !== "false"); } catch { /* Optional preference. */ }
    try { setStandardFooter(localStorage.getItem("lws-footer-standard") === "true"); } catch { /* Optional preference. */ }
    try { setClassicQuote(localStorage.getItem(quoteFlowKey) === "classic"); } catch { /* Optional preference. */ }
    setClassicIntro(new URLSearchParams(window.location.search).get("intro") === "original");
  }, []);
  if (!ready) return null;
  if (!isDesignPreview()) return null;
  const full = layout === "full";
  return <aside data-design-options={section} className={`design-options design-options-${section}`} title={sectionCopy[section][1]} aria-label={sectionCopy[section][0]}>
    <div className="design-options-copy"><p className="design-options-title">{sectionCopy[section][0]}</p><p>{sectionCopy[section][1]}</p></div>
    <div className="design-options-actions">
    {section === "hero" && <><Button variant="outline" size="review" asChild><a onClick={replayNextPreview} href={`/design-options/${full ? "half-screen" : "full-screen"}${classicIntro ? "?intro=original" : ""}`} aria-label={`Switch to ${full ? "half-screen" : "full-screen"} hero`}>
      Use {full ? "half" : "full"} screen
    </a></Button>
    <Button variant="outline" size="review" className="intro-variant-switch" type="button" aria-label={`Switch to ${classicIntro ? "swipe" : "original"} intro`} onClick={() => {
      const url = new URL(window.location.href);
      url.searchParams.set("intro", classicIntro ? "swipe" : "original");
      url.hash = "";
      replayNextPreview();
      window.location.assign(url.toString());
    }}>Use {classicIntro ? "swipe" : "classic"} intro</Button></>}
    {section === "text" && <Button variant="outline" size="review" type="button" aria-label="Letter-by-letter scroll reveal" aria-pressed={letterReveal} onClick={() => {
      const next = !letterReveal;
      setLetterReveal(next);
      try { localStorage.setItem("lws-scroll-letters", String(next)); } catch { /* Storage is optional. */ }
      window.dispatchEvent(new Event("lws-scroll-style"));
    }}>Scroll text: {letterReveal ? "Letter by letter" : "Fade up"}</Button>}
    {section === "trusted" && <Button variant="outline" size="review" type="button" aria-label="Fade-up trusted-by wordmarks" aria-pressed={trustedFade} onClick={() => {
      const next = !trustedFade;
      setTrustedFade(next);
      try { localStorage.setItem("lws-trusted-style", next ? "fade" : "ticker"); } catch { /* Optional preference. */ }
      window.dispatchEvent(new Event("lws-trusted-style"));
    }}>Trusted by: {trustedFade ? "Fade up" : "Rolling ticker"}</Button>}
    {section === "services" && <Button variant="outline" size="review" type="button" aria-label="Two-row service grid" aria-pressed={serviceGrid} onClick={() => {
      const next = !serviceGrid;
      setServiceGrid(next);
      try { localStorage.setItem("lws-service-grid", String(next)); } catch { /* Optional preference. */ }
      window.dispatchEvent(new Event("lws-service-layout"));
    }}>Card layout: {serviceGrid ? "Grid" : "Scrollable row"}</Button>}
    {section === "services" && <Button variant="outline" size="review" type="button" aria-label="Keep service images expanded" aria-pressed={expandedServices} onClick={() => {
      const next = !expandedServices;
      setExpandedServices(next);
      try { localStorage.setItem("lws-service-expanded", String(next)); } catch { /* Optional preference. */ }
      window.dispatchEvent(new Event("lws-service-layout"));
    }}>Image frames: {expandedServices ? "Always open" : "Open on hover"}</Button>}
    {section === "services" && <Button variant="outline" size="review" type="button" aria-label="Rounded service photos" aria-pressed={roundedPhotos} onClick={() => {
      const next = !roundedPhotos;
      setRoundedPhotos(next);
      try { localStorage.setItem("lws-service-rounded", String(next)); } catch { /* Optional preference. */ }
    }}>Photo corners: {roundedPhotos ? 'Rounded' : 'Square'}</Button>}
    {section === "footer" && <Button variant="outline" size="review" type="button" aria-label="Standard footer instead of the scroll reveal" aria-pressed={standardFooter} onClick={() => {
      const next = !standardFooter;
      setStandardFooter(next);
      try { localStorage.setItem("lws-footer-standard", String(next)); } catch { /* Optional preference. */ }
    }}>Footer: {standardFooter ? 'Standard' : 'Reveal'}</Button>}
    {section === "quote" && <Button variant="outline" size="review" type="button" aria-label="Classic quote form instead of the guided flow" aria-pressed={classicQuote} onClick={() => {
      const next = !classicQuote;
      setClassicQuote(next);
      try { localStorage.setItem(quoteFlowKey, next ? "classic" : "guided"); } catch { /* Optional preference. */ }
      window.dispatchEvent(new Event(quoteFlowEvent));
    }}>Quote form: {classicQuote ? "Classic" : "Guided"}</Button>}
  </div></aside>;
}

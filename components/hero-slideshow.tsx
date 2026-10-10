"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shuffleAfterFirst } from "@/lib/slideshow-order";
import { heroSlides, type HeroSlide } from "@/content/hero";
import { ResponsiveImage } from "@/components/responsive-image";
import { smallImage } from "@/lib/responsive-image";
import { gsap, useGSAP, motionConditions } from "@/lib/motion";

import { automaticMotionPaused, useAutomaticMotion } from "@/lib/automatic-motion";

export function HeroSlideshow({ fit = "cover", slides = heroSlides, enabled = true, shuffle = false, reviewControls = false }: { fit?: "cover" | "contain"; slides?: HeroSlide[]; enabled?: boolean; shuffle?: boolean; reviewControls?: boolean }) {
  const { paused: motionPaused } = useAutomaticMotion();
  const scope = useRef<HTMLDivElement>(null);
  const [orderedSlides, setOrderedSlides] = useState(slides);
  useEffect(() => {
    // Choose the visit's order after hydration; server markup stays stable.
    setOrderedSlides(shuffle ? shuffleAfterFirst(slides) : slides);
  }, [slides, shuffle]);
  const previous = useRef(-1);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(() => new Set([0]));

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduced(preference.matches);
    let inViewport = true;
    const updateVisibility = () => setVisible(inViewport && !document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; updateVisibility(); });
    observer.observe(scope.current!);
    return () => {
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!enabled || paused || reduced || motionPaused || automaticMotionPaused() || !visible) return;
    const next = (active + 1) % orderedSlides.length;
    // Load the next full-size frame after the intro; keep the current frame
    // visible on slow connections until its successor has decoded.
    setLoaded((current) => new Set([...current, next]));
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const image = scope.current?.querySelector<HTMLImageElement>(`[data-slide="${next}"] img`);
      try { await image?.decode(); } catch { return; }
      if (!cancelled) setActive(next);
    }, 3000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [enabled, paused, reduced, motionPaused, visible, active, orderedSlides]);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      const images = Array.from(scope.current!.querySelectorAll<HTMLElement>(".hero-slide"));
      gsap.set(images, { opacity: 0 });
      if (previous.current >= 0) gsap.set(images[previous.current], { opacity: 1 });
      gsap.to(images[active], { opacity: 1, duration: conditions?.reduce || motionPaused || previous.current < 0 ? 0 : paused ? 0.12 : 0.9, ease: "power2.inOut" });
      previous.current = active;
    }, scope);
    return () => media.revert();
  }, { scope, dependencies: [active, orderedSlides, motionPaused], revertOnUpdate: true });

  function selectPhoto(index: number) {
    setPaused(true);
    setActive((index + orderedSlides.length) % orderedSlides.length);
  }

  return <div ref={scope} className="hero-slideshow" data-active-slide={active} role="group" aria-label="Project photo slideshow">
    <div className="hero-slideshow-images" aria-hidden="true">
      {orderedSlides.map((photo, index) => {
        const requested = loaded.has(index) || index === active;
        return <div key={photo.slug} data-slide={index} data-photo={photo.slug} className={`hero-slide${fit === "contain" ? " hero-slide-blurred" : ""}`} style={{ backgroundImage: requested && fit === "contain" ? `url('${smallImage(photo.src)}')` : undefined, backgroundSize: fit, opacity: index === 0 ? 1 : 0, zIndex: index === active ? 1 : 0 }}>
          {requested && <ResponsiveImage src={photo.src} alt="" width={1600} height={900} loading="eager" priority={index === 0} sizes={fit === "contain" ? "(min-width: 1024px) 50vw, 100vw" : "100vw"} className="hero-slide-photo" style={{ objectFit: fit }} />}
        </div>;
      })}
    </div>
    {reviewControls && <div className="hero-slideshow-controls" role="group" aria-label="Slideshow controls">
      {reviewControls && <><Button type="button" variant="inverse-outline" size="icon" aria-label="Previous hero photograph" onClick={() => selectPhoto(active - 1)}><ChevronLeft aria-hidden="true" /></Button>
      <input className="hero-slide-scrubber" type="range" min={1} max={orderedSlides.length} step={1} value={active + 1} aria-label="Choose hero photograph" aria-valuetext={`Photo ${active + 1} of ${orderedSlides.length}: ${orderedSlides[active]?.title}`} onPointerDown={() => setPaused(true)} onKeyDown={() => setPaused(true)} onChange={(event) => selectPhoto(Number(event.target.value) - 1)} />
      <span className="hero-slide-count" aria-hidden="true">{active + 1} / {orderedSlides.length}</span>
      <Button type="button" variant="inverse-outline" size="icon" aria-label="Next hero photograph" onClick={() => selectPhoto(active + 1)}><ChevronRight aria-hidden="true" /></Button></>}
      {!reduced && <Button type="button" variant="inverse-outline" size="icon" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((value) => !value)}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</Button>}
    </div>}
  </div>;
}



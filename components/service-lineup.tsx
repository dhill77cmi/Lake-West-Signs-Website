"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "@/lib/motion";
import { isDesignPreview } from "@/lib/design-preview";

export function ServiceLineup({ children }: { children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState(true);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const update = () => {
      if (!isDesignPreview()) { setExpanded(false); setGrid(true); return; }
      try { setExpanded(localStorage.getItem("lws-service-expanded") === "true"); } catch { /* Optional preference. */ }
      try { setGrid(localStorage.getItem("lws-service-grid") !== "false"); } catch { /* Optional preference. */ }
    };
    update();
    window.addEventListener("lws-service-layout", update);
    return () => window.removeEventListener("lws-service-layout", update);
  }, []);
  useEffect(() => {
    // A previously scrolled carousel must not offset the restored grid.
    gsap.killTweensOf(row.current);
    row.current?.scrollTo({ left: 0, behavior: "instant" });
    ScrollTrigger.refresh();
  }, [grid]);
  const [edges, setEdges] = useState({ start: true, end: false });
  const { contextSafe } = useGSAP({ scope: row });
  useGSAP((_, safe) => {
    if (expanded) return;
    const media = gsap.matchMedia();
    media.add({ hover: "(min-width: 64rem) and (hover: hover) and (pointer: fine)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      if (!conditions?.hover || conditions.reduce) return;
      const duration = conditions.reduce ? 0 : 0.5;
      const disposers: (() => void)[] = [];
      row.current!.querySelectorAll<HTMLElement>('.home-service-media').forEach(link => {
        if (!link.querySelector('img, .home-service-placeholder')) return;
        const frame = link.querySelector('figure')!;
        const title = link.querySelector('.home-service-description')!;
        const action = link.querySelector('.service-learn-more')!;

        const progress = { value: 0 };
        let frameTop = 0;
        let frameBottom = 0;
        let buttonTop = 0;
        let buttonBottom = 0;
        let buttonHeight = 1;
        const cssNumber = (name: string, fallback: number) => {
          const value = parseFloat(getComputedStyle(link).getPropertyValue(name));
          return Number.isNaN(value) ? fallback : value;
        };
        const buttonColor = gsap.utils.interpolate('#1175bc', '#ffffff');
        const paint = () => {
          const inset = cssNumber("--service-frame-inset", 140);
          // The square-frame preview opens the window toward the caption, whichever edge it sits on.
          const insetTop = cssNumber("--service-frame-top", inset);
          const remaining = 1 - progress.value;
          const corners = document.documentElement.dataset.serviceCorners === 'square' ? '' : ' round var(--radius-md)';
          const clip = `inset(${insetTop * remaining}px ${12 * remaining}% ${inset * remaining}px ${12 * remaining}%${corners})`;
          frame.style.clipPath = clip;
          // How much of the button the photo window overlaps, for either caption position.
          const overlap = Math.min(buttonBottom, frameBottom - inset * remaining) - Math.max(buttonTop, frameTop + insetTop * remaining);
          const coverage = gsap.utils.clamp(0, 1, overlap / buttonHeight);
          (action as HTMLElement).style.color = buttonColor(coverage);
          action.setAttribute('data-photo-covered', String(coverage >= 0.5));
        };
        const measure = () => {
          const photoBounds = frame.getBoundingClientRect();
          const buttonBounds = action.getBoundingClientRect();
          frameTop = photoBounds.top;
          frameBottom = photoBounds.bottom;
          buttonTop = buttonBounds.top;
          buttonBottom = buttonBounds.bottom;
          buttonHeight = buttonBounds.height || 1;
          paint();
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(link);
        window.addEventListener('lws-service-layout', measure);
        const animate = (open: boolean) => {
          gsap.to(progress, { value: open ? 1 : 0, duration: 0.65, ease: 'power2.inOut', overwrite: true, onUpdate: paint });
          // The resting caption color comes from CSS so previews that keep the photo behind it stay white.
          const rest = getComputedStyle(link);
          const restColor = rest.getPropertyValue('--service-caption-color').trim() || '#141414';
          const restShadow = rest.getPropertyValue('--service-caption-shadow').trim() || '0px 1px 2px rgba(0,0,0,0), 0px 2px 8px rgba(0,0,0,0)';
          gsap.to(title, { color: open ? '#ffffff' : restColor, textShadow: open ? '0px 1px 2px rgba(0,0,0,0.9), 0px 2px 8px rgba(0,0,0,0.65)' : restShadow, duration, ease: 'power2.inOut', overwrite: true });
        };
        const reveal = safe!(() => animate(true));
        const close = safe!(() => {
          if (link.matches(':hover, :focus-visible')) return;
          animate(false);
        });
        link.addEventListener('pointerenter', reveal);
        link.addEventListener('pointerleave', close);
        link.addEventListener('focus', reveal);
        link.addEventListener('blur', close);
        if (link.matches(':hover, :focus-visible')) reveal();
        disposers.push(() => {
          observer.disconnect();
          window.removeEventListener('lws-service-layout', measure);
          action.removeAttribute('data-photo-covered');
          gsap.killTweensOf([progress, frame, title, action]);
          gsap.set(action, { clearProps: 'color' });
          gsap.set(frame, { clearProps: 'clipPath' });
          gsap.set(title, { clearProps: 'color,textShadow,transform' });
          link.removeEventListener('pointerenter', reveal);
          link.removeEventListener('pointerleave', close);
          link.removeEventListener('focus', reveal);
          link.removeEventListener('blur', close);
        });
      });
      return () => disposers.forEach(dispose => dispose());
    });
    return () => media.revert();
  }, { scope: row, dependencies: [expanded], revertOnUpdate: true });
  useEffect(() => {
    const element = row.current!;
    const update = () => setEdges({ start: element.scrollLeft < 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, []);
  const move = contextSafe((direction: number) => {
    const element = row.current!;
    const cards = Array.from(element.children) as HTMLElement[];
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : element.clientWidth;
    const next = (Math.round(element.scrollLeft / step) + direction) * step;
    gsap.killTweensOf(element);
    element.style.scrollSnapType = "none";
    const restoreSnap = () => element.style.removeProperty("scroll-snap-type");
    gsap.to(element, { scrollLeft: Math.max(0, Math.min(element.scrollWidth - element.clientWidth, next)), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.4, ease: "power2.out", overwrite: true, onComplete: restoreSnap, onInterrupt: restoreSnap });
  });
  return <>
    <div ref={row} className="home-services-grid" data-expanded={expanded} data-layout={grid ? "grid" : "row"} role="region" aria-label="Explore our services" tabIndex={0} onPointerDown={() => gsap.killTweensOf(row.current)}>{children}</div>
    {!grid && !(edges.start && edges.end) && <div className="lineup-navigation">
      <button type="button" aria-label="Previous services" disabled={edges.start} onClick={() => move(-1)}>←</button>
      <button type="button" aria-label="Next services" disabled={edges.end} onClick={() => move(1)}>→</button>
    </div>}
  </>;
}




"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { introPhotos, originalIntroPhotos, heroSlides, swipeHeroSlides } from "@/content/hero";
import { DesignOptionSwitch } from "@/components/design-option-switch";
import { isDesignPreview } from "@/lib/design-preview";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { ResponsiveImage } from "@/components/responsive-image";
import { gsap, useGSAP, motionConditions, pageReplayEvent } from "@/lib/motion";


import { automaticMotionPaused, useAutomaticMotion } from "@/lib/automatic-motion";

export function PhotoHero({ children, layout }: { children: ReactNode; layout: "split" | "full" }) {
  const { paused: motionPaused } = useAutomaticMotion();
  const [classicIntro, setClassicIntro] = useState(true);
  const [reviewControls, setReviewControls] = useState(false);
  useEffect(() => {
    setReviewControls(isDesignPreview());
    if (isDesignPreview()) setClassicIntro(new URLSearchParams(window.location.search).get("intro") === "original");
  }, []);
  const selectedPhotos = classicIntro ? originalIntroPhotos : introPhotos;
  const scope = useRef<HTMLDivElement>(null);
  const finishRef = useRef<() => void>(() => {});
  useEffect(() => { if (motionPaused) finishRef.current(); }, [motionPaused]);
  const replayRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const sessionSeen = useRef<boolean | null>(null);

  useGSAP((_, contextSafe) => {
    if (sessionSeen.current === null) {
      try { sessionSeen.current = sessionStorage.getItem("lws-hero-intro-seen") === "1"; }
      catch { sessionSeen.current = false; }
    }
    const root = scope.current!;
    const content = root.querySelector<HTMLElement>(".cinema-content")!;
    const shade = root.querySelector<HTMLElement>(".cinema-shade");
    const stage = root.querySelector<HTMLElement>(".photo-intro")!;
    const visual = root.querySelector<HTMLElement>(".cinema-media")!;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".intro-card:not(.intro-loop-copy)"));
    const allCards = cards;
    const images = Array.from(root.querySelectorAll<HTMLImageElement>(".intro-card img"));
    const lead = cards.find((card) => card.dataset.photo === "bedrock")!;
    const others = allCards.filter((card) => card !== lead);
    const header = document.querySelector<HTMLElement>(".site-header");
    const revealTargets = [content, ...(shade ? [shade] : []), ...(header ? [header] : [])];
    const setHeaderOpacity = header ? gsap.quickSetter(header, "--hero-nav-opacity") : null;
    const updateHeader = () => {
      const bounds = root.getBoundingClientRect();
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      // Stay transparent through 70% of the approach, then fade at the hero's edge.
      const distance = Math.max(1, bounds.height - headerBottom);
      const progress = gsap.utils.clamp(0, 1, (-bounds.top - distance * 0.7) / (distance * 0.3));
      setHeaderOpacity?.(progress * progress * (3 - 2 * progress));
      if (header) header.dataset.pastHero = String(bounds.bottom <= headerBottom);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    const media = gsap.matchMedia();
    let played = false;
    media.add(motionConditions, ({ conditions }) => {
      let timeline: gsap.core.Timeline | undefined;
      let disposed = false;
      let run = 0;
      let deadline: ReturnType<typeof setTimeout>;
      let viewportWidth = window.innerWidth;

      const finish = () => {
        if (disposed) return;
        run++;
        clearTimeout(deadline);
        timeline?.kill();
        root.dataset.intro = "ready";
        root.dataset.phase = "complete";
        content.inert = false;
        gsap.set(revealTargets, { clearProps: "opacity,visibility,transform" });
        root.style.removeProperty("--hero-blur-opacity");
        gsap.set(allCards, { clearProps: "willChange" });
        gsap.set(stage, { clearProps: "clipPath,willChange" });
        setReady(true);
      };
      const safeFinish = contextSafe!(finish);
      const animate = contextSafe!(() => {
        // Measure once; transform the same card into the final photo position.
        const bounds = root.getBoundingClientRect();
        const { width, height } = bounds;
        const destination = visual.getBoundingClientRect();
        const gutter = Math.min(48, width * 0.045);
        const gap = Math.min(18, width * 0.012);
        const rowWidth = (width - gutter * 2 - gap * 6) / 7;
        const cardWidth = Math.max(rowWidth, Math.min(112, width * 0.24));
        const lift = Math.min(height * 0.2, 180);
        // Preserve the full photo in the split layout; match cover in full screen.
        const finalScale = (layout === "full" ? Math.max : Math.min)(destination.width, destination.height * 16 / 9) / cardWidth;
        const finalX = destination.left - bounds.left + destination.width / 2 - width / 2;
        const finalY = destination.top - bounds.top + destination.height / 2 - height / 2;
        const finalClip = `inset(${destination.top - bounds.top}px ${bounds.right - destination.right}px ${bounds.bottom - destination.bottom}px ${destination.left - bounds.left}px)`;
        gsap.set(allCards, {
          width: cardWidth,
          height: cardWidth * 9 / 16,
          xPercent: -50,
          yPercent: -50,
          x: (index) => (index - 3) * (rowWidth + gap),
          y: (index) => index % 2 === 0 ? -lift : lift,
          scale: 1,
          autoAlpha: 0,
          force3D: true,
          willChange: "transform, opacity",
        });
        root.dataset.phase = "fade";
        // Read GSAP's cached transforms, not layout, to keep edge cards whole.
        const pitch = rowWidth + gap;
        const loopOffsets = cards.map((_, index) => {
          const offset = index - (cards.length - 4);
          return index < Math.ceil((cards.length - 7) / 2) ? index + 4 : offset;
        });
        const keepCardsWhole = () => {
          if (root.dataset.phase === "expand" || root.dataset.intro !== "playing") return;
          for (const card of allCards) {
            const x = Number(gsap.getProperty(card, "x"));
            const halfWidth = cardWidth * Number(gsap.getProperty(card, "scaleX")) / 2;
            const inside = x - halfWidth >= -width / 2 + 1 && x + halfWidth <= width / 2 - 1;
            card.style.visibility = inside ? "visible" : "hidden";
          }
        };
        timeline = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: safeFinish, onUpdate: keepCardsWhole });
        const swipeAt = 2.55;
        const swipeDuration = 1.85;
        const settledAt = swipeAt + swipeDuration;
        const gatherAt = classicIntro ? 2.45 : settledAt + 0.18;
        const expandAt = gatherAt + (classicIntro ? 1.2 : 1.45);
        // Finish with the last seven photos in view. A hard initial flick
        // loses momentum continuously instead of reversing into a bounce.
        const settledCenter = cards.length - 4;
        timeline
          .to(cards, { autoAlpha: 1, duration: 0.8, stagger: { amount: 0.21 }, ease: "power2.out" }, 0)
          .call(() => { root.dataset.phase = "align"; }, [], 0.8)
          .to(cards, { y: 0, scale: rowWidth / cardWidth, duration: 1.35, stagger: { amount: 0.15 } }, 0.8)
          .call(() => { root.dataset.phase = "row"; }, [], classicIntro ? 2.3 : 2.4);
        if (!classicIntro) timeline
          .call(() => { root.dataset.phase = "swipe"; }, [], swipeAt)
          .to(cards, { x: (index) => (index - settledCenter) * (rowWidth + gap), duration: swipeDuration, ease: "power3.out" }, swipeAt)
          .call(() => { root.dataset.phase = "settled"; }, [], settledAt);
        timeline.call(() => { root.dataset.phase = "gather"; }, [], gatherAt);
        if (classicIntro) {
          timeline.to(cards, { x: 0, y: 0, duration: 1.15 }, gatherAt);
        } else {
          // Recycle only off-screen cards to the far side of the loop.
          // The first half of the passed photos return from the right;
          // the second half stay left. Every photo takes exactly one path.
          timeline.set(cards, { x: (index) => loopOffsets[index] * pitch }, gatherAt);
          allCards.forEach((card, index) => {
            const distance = Math.abs(loopOffsets[index]);
            if (!distance) return;
            timeline!.to(card, { x: 0, y: 0, duration: 0.85, ease: "power2.inOut" }, gatherAt + (distance - 1) * 0.055);
          });
        }
        timeline
          .call(() => { root.dataset.phase = "expand"; }, [], expandAt)
          .to(others, { autoAlpha: 0, duration: 0.18 }, expandAt)
          .to(lead, { x: finalX, y: finalY, scale: finalScale, duration: 1.65 }, expandAt)
          .addLabel("photoSettled")
          .call(() => { root.dataset.intro = "revealing"; }, [], "photoSettled")
          .to(revealTargets, { autoAlpha: 1, duration: 1.25, ease: "sine.inOut" }, "photoSettled");
        if (layout === "split") timeline.to(root, { "--hero-blur-opacity": 1, duration: 1.25, ease: "sine.inOut" }, "photoSettled");
        if (layout === "split") {
          gsap.set(stage, { willChange: "clip-path" });
          timeline.to(stage, { clipPath: finalClip, duration: 1.65 }, expandAt);
        }
      });
      const start = () => {
        if (conditions?.reduce || automaticMotionPaused() || disposed) return;
        try { sessionStorage.setItem("lws-hero-intro-seen", "1"); } catch { /* Storage may be disabled. */ }
        const currentRun = ++run;
        clearTimeout(deadline);
        timeline?.kill();
        root.dataset.intro = "playing";
        root.dataset.phase = "loading";
        content.inert = true;
        setReady(false);
        setReplay((value) => value + 1);
        gsap.set(revealTargets, { autoAlpha: 0 });
        if (layout === "split") gsap.set(root, { "--hero-blur-opacity": 0 });
        gsap.set(allCards, { autoAlpha: 0 });
        gsap.set(stage, { clipPath: "inset(0px 0px 0px 0px)" });
        // Slow or failed image requests must never trap visitors in the intro.
        deadline = setTimeout(safeFinish, 12000);
        Promise.all(images.map((image) => image.decode())).then(() => {
          if (!disposed && currentRun === run) animate();
        }).catch(() => { if (!disposed && currentRun === run) safeFinish(); });
      };
      finishRef.current = safeFinish;
      replayRef.current = contextSafe!(start);
      const onKey = (event: KeyboardEvent) => {
        if (root.dataset.intro !== "ready" && (event.key === "Tab" || event.key === "Escape")) safeFinish();
      };
      const onScroll = () => { if (window.scrollY > 40 && root.dataset.intro !== "ready") safeFinish(); };
      const onResize = () => {
        if (window.innerWidth !== viewportWidth && root.dataset.intro !== "ready") safeFinish();
        viewportWidth = window.innerWidth;
        updateHeader();
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      if (!conditions?.reduce && !automaticMotionPaused() && !played && !sessionSeen.current && !window.location.hash && window.scrollY < 40) start();
      else finish();
      played = true;
      return () => {
        disposed = true;
        run++;
        clearTimeout(deadline);
        timeline?.kill();
        content.inert = false;
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
      };
    }, scope);
    // start() or finish() above now controls the hero, so release the pre-hydration hold from app/layout.tsx.
    delete document.documentElement.dataset.heroIntro;
    return () => {
      media.revert();
      window.removeEventListener("scroll", updateHeader);
      header?.style.removeProperty("--hero-nav-opacity");
      if (header) delete header.dataset.pastHero;
      finishRef.current = () => {};
      replayRef.current = () => {};
    };
  }, { scope, dependencies: [layout, classicIntro], revertOnUpdate: true });

  return <div ref={scope} data-intro-variant={classicIntro ? "original" : "swipe"} data-hero-moment data-layout={layout} data-intro="ready" className="cinema-hero photo-cinema-hero">
    <div className="cinema-media">
      <HeroSlideshow key={replay} slides={classicIntro ? heroSlides : swipeHeroSlides} shuffle={!classicIntro} fit={layout === "full" ? "cover" : "contain"} enabled={ready} reviewControls={reviewControls} />
    </div>
    <div className="photo-intro" aria-hidden="true">
      {selectedPhotos.map((photo) => <div key={photo.slug} data-photo={photo.slug} className={`intro-card${photo.enhanced ? "" : " intro-card-original"}${photo.slug === "bedrock" ? " intro-card-lead" : ""}`}>
        {/* Small intro cards use small derivatives; the expanding lead shares the slideshow source. */}
        <ResponsiveImage src={photo.src} alt={photo.title} width={1600} height={900} loading="eager" sizes={photo.slug === "bedrock" ? layout === "split" ? "(min-width: 1024px) 50vw, 100vw" : "100vw" : "180px"} draggable={false} />
      </div>)}
    </div>
    {layout === "full" && <div className="cinema-shade" aria-hidden="true" />}
    <DesignOptionSwitch section="hero" layout={layout} />
    <div className="cinema-content">{children}</div>
    {reviewControls && <button type="button" className="cinema-skip" onClick={() => finishRef.current()}>Skip intro</button>}
    {reviewControls && <button type="button" className="cinema-replay" onClick={() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      window.dispatchEvent(new Event(pageReplayEvent));
      replayRef.current();
    }}>Replay intro <span aria-hidden="true">↗</span></button>}
  </div>;
}


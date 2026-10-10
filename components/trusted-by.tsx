"use client";

import { DesignOptionSwitch } from "@/components/design-option-switch";
import { isDesignPreview } from "@/lib/design-preview";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

import { automaticMotionPaused, useAutomaticMotion } from "@/lib/automatic-motion";

const names = ["BEDROCK", "Comfort Zone", "HydroHoist", "THE DOCK BOX GUY", "VINYL REPAIR GUYS", "WESTSIDE ATHLETIC CLUB"];
const wordmarks = (list: string[]) => list.map(name => <div className={`trusted-logo-placeholder logo-style-${names.indexOf(name) % 3}`} key={name}>{name}</div>);

export function TrustedBy({ className = "" }: { className?: string }) {
  const { paused: motionPaused } = useAutomaticMotion();
  const scope = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(false);
  const [perSet, setPerSet] = useState(3);
  useEffect(() => {
    const update = () => {
      try { setFade(isDesignPreview() && localStorage.getItem("lws-trusted-style") === "fade"); } catch { /* Storage is optional. */ }
    };
    update();
    window.addEventListener("lws-trusted-style", update);
    return () => window.removeEventListener("lws-trusted-style", update);
  }, []);
  useEffect(() => {
    // Wordmarks per fade set follow the viewport; reduced motion shows every name once, still.
    const queries = [matchMedia(motionConditions.reduce), matchMedia("(min-width: 64rem)"), matchMedia("(min-width: 40rem)")];
    const update = () => setPerSet(queries[0].matches ? names.length : queries[1].matches ? 4 : queries[2].matches ? 3 : 2);
    update();
    queries.forEach(query => query.addEventListener("change", update));
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, []);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce || motionPaused || automaticMotionPaused()) return;
      const { ease, trustedSwap } = motionTokens(scope.current!);
      if (fade) {
        // Each set rises in left to right, holds, then carries on upward and out.
        const timeline = gsap.timeline({ repeat: -1 });
        scope.current!.querySelectorAll(".trusted-set").forEach(set => timeline
          .fromTo(set.children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: trustedSwap, ease, stagger: 0.06 })
          .to(set.children, { autoAlpha: 0, y: -12, duration: trustedSwap, ease, stagger: 0.06 }, "+=2.5"));
        return () => { timeline.kill(); };
      }
      const trackEl = track.current!, ticker = trackEl.parentElement!;
      const group = trackEl.firstElementChild as HTMLElement;
      let motion: gsap.core.Tween | null = null;
      const rebuild = () => {
        const progress = motion?.progress() ?? 0;
        motion?.kill();
        gsap.set(trackEl, { x: 0 });
        motion = gsap.to(trackEl, { x: -group.offsetWidth, duration: group.offsetWidth / 60, ease: "none", repeat: -1 }).progress(progress);
      };
      rebuild();
      const resize = new ResizeObserver(rebuild);
      resize.observe(group);
      // Hovering eases the ticker to a stop and back instead of freezing it.
      const glide = (timeScale: number) => () => { gsap.to(motion, { timeScale, duration: 0.4, ease }); };
      const [slow, resume] = [glide(0), glide(1)];
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        ticker.addEventListener("pointerenter", slow);
        ticker.addEventListener("pointerleave", resume);
      }
      return () => {
        resize.disconnect();
        ticker.removeEventListener("pointerenter", slow);
        ticker.removeEventListener("pointerleave", resume);
        motion?.kill(); gsap.set(trackEl, { clearProps: "transform" });
      };
    });
    return () => media.revert();
  }, { scope, dependencies: [fade, perSet, motionPaused], revertOnUpdate: true });
  // Sliding windows over the names so every set shows `perSet` wordmarks, wrapping round the end.
  const sets = Array.from({ length: Math.ceil(names.length / perSet) }, (_, set) => Array.from({ length: perSet }, (_, index) => names[(set * perSet + index) % names.length]));
  return <section ref={scope} id="trusted-by" className={`trusted-by ${className}`} data-motion-paused={motionPaused} aria-labelledby="trusted-by-title">
    <h2 id="trusted-by-title" className="text-small text-center text-muted-foreground">Trusted by</h2>
    <DesignOptionSwitch section="trusted" />
    <div className="trusted-row" data-scroll-reveal>
      <div className={fade ? "trusted-fade" : "trusted-ticker"} role="img" aria-label="Sample client wordmarks: Bedrock, Comfort Zone, HydroHoist of the Ozarks, The Dock Box Guy, Vinyl Repair Guys, and Westside Athletic Club.">
        {fade
          ? sets.map((set, index) => <div className="trusted-group trusted-set" aria-hidden="true" key={index}>{wordmarks(set)}</div>)
          : <div ref={track} className="trusted-track" aria-hidden="true">{[0, 1, 2, 3].map(copy => <div className="trusted-group" key={copy}>{wordmarks(names)}</div>)}</div>}
      </div>
    </div>
  </section>;
}

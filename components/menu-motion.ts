"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

export function closeMenu(details: HTMLDetailsElement, restoreFocus = false, animate = true) {
  const handled = !details.dispatchEvent(new CustomEvent("lws:close-menu", {
    cancelable: true, detail: { restoreFocus, animate },
  }));
  if (!handled) {
    details.open = false;
    if (restoreFocus) details.querySelector("summary")?.focus();
  }
}

export function useMenuMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP((_, contextSafe) => {
    const root = scope.current!;
    const tokens = motionTokens(root);
    const media = gsap.matchMedia();
    let reduce = true;
    const closing = new Map<HTMLDetailsElement, () => void>();
    const panels = root.querySelectorAll<HTMLElement>(".menu-panel");
    media.add(motionConditions, ({ conditions }) => {
      reduce = Boolean(conditions?.reduce);
      if (reduce) {
        gsap.killTweensOf(panels);
        for (const finish of closing.values()) finish();
        gsap.set(panels, { clearProps: "transform" });
        root.querySelectorAll<HTMLElement>(".services-arrow").forEach((arrow) => {
          gsap.killTweensOf(arrow);
          gsap.set(arrow, { rotation: arrow.closest("details")?.open ? 0 : 180, transformOrigin: "50% 50%" });
        });
      }
    }, scope);
    const disposers: (() => void)[] = [];
    // Pointer devices open the services menu on hover; touch and keyboard still toggle it.
    const hoverOpens = matchMedia("(hover: hover) and (pointer: fine)").matches;
    root.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
      const panel = details.querySelector<HTMLElement>(".menu-panel")!;
      const summary = details.querySelector("summary")!;
      const arrow = summary.querySelector<HTMLElement>(".services-arrow");
      if (arrow) gsap.set(arrow, { rotation: details.open ? 0 : 180, transformOrigin: "50% 50%" });
      const turnArrow = (open: boolean) => {
        if (arrow) gsap.to(arrow, { rotation: open ? 0 : 180, duration: reduce ? 0 : tokens.disclosure * 1.5, ease: "sine.inOut", force3D: false, overwrite: true });
      };
      const close = contextSafe!((event: Event) => {
        event.preventDefault();
        turnArrow(false);
        const { restoreFocus, animate } = (event as CustomEvent<{ restoreFocus: boolean; animate: boolean }>).detail;
        const finish = () => {
          closing.delete(details);
          details.open = false;
          gsap.set(panel, { clearProps: "transform,opacity,visibility" });
          if (restoreFocus) summary.focus();
        };
        if (reduce || !animate) {
          gsap.killTweensOf(panel);
          finish();
        } else if (!closing.has(details)) {
          closing.set(details, finish);
          gsap.to(panel, { y: -4, autoAlpha: 0, duration: tokens.disclosure, ease: tokens.ease, overwrite: true, onComplete: finish });
        }
      });
      let hovering = false;
      // Opening eases in a touch slower than closing, with a fade so the panel settles rather than snaps.
      const opening = { y: 0, autoAlpha: 1, duration: tokens.disclosure * 1.5, ease: tokens.ease, clearProps: "transform,opacity,visibility" };
      const open = (animate: boolean) => {
        const reversing = closing.delete(details);
        gsap.killTweensOf(panel);
        details.open = true;
        turnArrow(true);
        if (reduce || !animate) {
          gsap.set(panel, { clearProps: "transform,opacity,visibility" });
        } else if (reversing) {
          gsap.to(panel, opening);
        } else {
          gsap.fromTo(panel, { y: -6, autoAlpha: 0 }, opening);
        }
      };
      const toggle = contextSafe!((event: MouseEvent) => {
        event.preventDefault();
        if (details.open && !closing.has(details)) {
          // A mouse click on a hover-opened menu leaves it open; moving away closes it.
          if (!hovering || event.detail === 0) closeMenu(details, false, event.detail !== 0);
          return;
        }
        open(event.detail !== 0);
      });
      const enter = contextSafe!(() => { hovering = true; if (!details.open || closing.has(details)) open(true); });
      const leave = contextSafe!(() => { hovering = false; if (details.open) closeMenu(details); });
      details.addEventListener("lws:close-menu", close);
      summary.addEventListener("click", toggle);
      if (hoverOpens && panel.classList.contains("services-panel")) {
        details.addEventListener("pointerenter", enter);
        details.addEventListener("pointerleave", leave);
      }
      disposers.push(() => {
        details.removeEventListener("lws:close-menu", close);
        summary.removeEventListener("click", toggle);
        details.removeEventListener("pointerenter", enter);
        details.removeEventListener("pointerleave", leave);
      });
    });
    return () => {
      disposers.forEach((dispose) => dispose());
      closing.clear();
      media.revert();
    };
  }, { scope });
}

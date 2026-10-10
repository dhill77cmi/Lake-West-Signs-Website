"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

export function PressFeedback({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useGSAP((_, contextSafe) => {
    const root = scope.current!;
    const tokens = motionTokens(root);
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) return; // Existing color states still acknowledge presses.
      let pressed: HTMLElement | null = null;
      const touched = new Set<HTMLElement>();
      const release = contextSafe!(() => {
        if (pressed) gsap.to(pressed, { y: 0, duration: tokens.feedback, ease: tokens.ease, overwrite: true, clearProps: "transform" });
        pressed = null;
      });
      const press = contextSafe!((event: PointerEvent) => {
        if (event.button !== 0 || !event.isPrimary) return;
        const button = (event.target as Element).closest<HTMLElement>('[data-slot="button"]');
        if (!button || button.matches(":disabled, [aria-disabled=true]")) return;
        release();
        pressed = button;
        touched.add(button);
        // Keep the complete control and its hit area at their original size.
        gsap.to(button, { y: 1, duration: tokens.feedback, ease: tokens.ease, overwrite: true });
      });
      root.addEventListener("pointerdown", press);
      document.addEventListener("pointerup", release);
      document.addEventListener("pointercancel", release);
      window.addEventListener("blur", release);
      return () => {
        root.removeEventListener("pointerdown", press);
        document.removeEventListener("pointerup", release);
        document.removeEventListener("pointercancel", release);
        window.removeEventListener("blur", release);
        for (const button of touched) {
          gsap.killTweensOf(button);
          gsap.set(button, { clearProps: "transform" });
        }
      };
    }, scope);
    return () => media.revert();
  }, { scope, dependencies: [pathname], revertOnUpdate: true });
  return <div id="site-content" ref={scope} className="flex min-h-dvh flex-col">{children}</div>;
}

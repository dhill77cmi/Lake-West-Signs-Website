"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

// Next remounts a template on every navigation, so each new page eases in. The first load stays as
// rendered: no flash before hydration, and the homepage intro runs untouched.
let lastPathname: string | null = null;

export default function Template({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Decide only after a committed mount: React can discard or repeat renders.
  // Keep the decision in a ref so Strict Mode's repeated effects agree.
  const arrived = useRef<boolean | null>(null);
  useGSAP(() => {
    if (arrived.current === null) {
      arrived.current = lastPathname !== null && lastPathname !== pathname;
      lastPathname = pathname;
    }
    if (!arrived.current) return;
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) return;
      const tokens = motionTokens(scope.current!);
      gsap.fromTo(scope.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: tokens.hero, ease: tokens.ease, clearProps: "opacity,transform" });
    });
    return () => media.revert();
  }, { scope });
  return <div ref={scope} className="page-transition">{children}</div>;
}

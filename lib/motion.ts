"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(useGSAP, CustomEase);

export const pageReplayEvent = "lws-page-replay";

export const motionConditions = {
  reduce: "(prefers-reduced-motion: reduce)",
  animate: "(prefers-reduced-motion: no-preference)",
};

/** Read the existing theme; do not keep a second timing/easing palette in JS. */
export function motionTokens(element: Element) {
  const css = getComputedStyle(element);
  const seconds = (name: string) => {
    // CSS compilation can normalize milliseconds into seconds (200ms → .2s).
    const value = css.getPropertyValue(`--duration-${name}`).trim();
    return parseFloat(value) / (value.endsWith("ms") ? 1000 : 1);
  };
  const bezier = css.getPropertyValue("--ease-out").trim().replace(/^cubic-bezier\((.*)\)$/, "$1");
  return {
    feedback: seconds("feedback"), disclosure: seconds("disclosure"), step: seconds("step"), hero: seconds("hero"), trustedSwap: seconds("trusted-swap"), finish: seconds("finish"),
    ease: CustomEase.create("lws-out", bezier),
  };
}

export { gsap, useGSAP };

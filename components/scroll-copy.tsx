"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP, motionConditions, pageReplayEvent } from "@/lib/motion";
import { isDesignPreview } from "@/lib/design-preview";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function ScrollCopy({ children, revealAll = false }: { children: ReactNode; revealAll?: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const [letters, setLetters] = useState(true);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const restart = () => {
      // Replay has returned the page to the top. Refresh scroll measurements before
      // rebuilding the completed, once-only triggers through the GSAP cleanup path.
      ScrollTrigger.refresh();
      setReplay((value) => value + 1);
    };
    window.addEventListener(pageReplayEvent, restart);
    return () => window.removeEventListener(pageReplayEvent, restart);
  }, []);
  useEffect(() => {
    const update = () => {
      if (!isDesignPreview()) { setLetters(true); return; }
      try { setLetters(localStorage.getItem("lws-scroll-letters") !== "false"); } catch { /* Storage is optional. */ }
    };
    update();
    window.addEventListener("lws-scroll-style", update);
    return () => window.removeEventListener("lws-scroll-style", update);
  }, []);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) return;
      const root = scope.current!;
      // Reveal complete content units; never animate both a wrapper and its children.
      const selector = "h1, h2, h3, h4, p, figure, picture, img, blockquote, figcaption, address, form, li, a, button, [data-scroll-reveal]";
      const targets = Array.from(root.querySelectorAll<HTMLElement>(selector))
        .filter(element => !element.closest("[data-design-options]") && !element.parentElement?.closest(selector));
      const css = getComputedStyle(root);
      const timing = css.getPropertyValue("--duration-scroll-copy").trim();
      const duration = parseFloat(timing) / (timing.endsWith("ms") ? 1000 : 1);
      const distance = parseFloat(css.getPropertyValue("--spacing-scroll-copy"));
      // Long copy splits into letters only where a page carries little of it; a page of long answers
      // would spend seconds building thousands of letter tweens, so there it fades whole instead.
      const longCopy = Array.from(root.querySelectorAll<HTMLElement>("p,blockquote,figcaption,address"))
        .map(node => (node.textContent ?? "").length).filter(length => length > 120).reduce((sum, length) => sum + length, 0);
      const splitLong = longCopy <= 1000;
      const copySelector = "h1,h2,h3,h4,p,blockquote,figcaption,a,button,address";

      // Setup is ordered reads → writes → reads → one write, so the browser lays the page out once or twice
      // instead of once per element. Interleaving a style read with each element's hide forced a full
      // reflow ~50 times per page and made every navigation a second slower than it needed to be.

      // 1. Reads: which leaf copy gets split. Flex and grid boxes drop the whitespace between split word
      //    spans, so their copy fades whole.
      const copyFor = targets.map(element => !letters || element.matches("form") ? [] :
        [element, ...element.querySelectorAll<HTMLElement>(copySelector)]
          .filter(node => !/flex|grid/.test(getComputedStyle(node).display))
          .filter(node => node.matches("h1,h2,h3,h4") || (node.textContent ?? "").length <= 120 || splitLong)
          .filter(node => !node.closest("[aria-live]") && !node.hasAttribute("aria-label") && !node.querySelector('[aria-hidden="true"]') && node.matches(copySelector) &&
            !node.querySelector("a,button,input,select,textarea,img,svg,h1,h2,h3,h4,p,blockquote,figcaption,address")));

      // 2. Writes: split the copy, preserving nested links, form controls and image semantics.
      const splits: SplitText[] = [];
      const spokenCopies: HTMLElement[] = [];
      const splitsFor = copyFor.map(copy => copy.map(node => {
        // aria-label is prohibited on plain text elements, so those get a hidden spoken copy instead.
        const plainCopy = node.matches("p,blockquote,figcaption,address");
        const text = node.textContent ?? "";
        const split = SplitText.create(node, { type: "words,chars", tag: "span", charsClass: "scroll-letter", aria: plainCopy ? "none" : "auto" });
        splits.push(split);
        if (plainCopy) {
          // Hide only the visual letters, never their parent: the spoken copy must
          // remain in the accessibility tree (aria-hidden is inherited).
          Array.from(node.children).forEach(child => child.setAttribute("aria-hidden", "true"));
          const spoken = document.createElement("span");
          spoken.className = "sr-only";
          spoken.textContent = text;
          node.prepend(spoken);
          spokenCopies.push(spoken);
        }
        return split;
      }));

      // 3. Reads: the timelines and their scroll triggers measure positions; nothing is written here.
      const animations = targets.map((element, index) => {
        const timeline = gsap.timeline({
          // Not clamped: copy already inside the zone on load must start below zero so it reveals at once.
          // With revealAll there is no trigger: every timeline plays on arrival in a short cascade.
          scrollTrigger: revealAll ? undefined : { trigger: element, start: "top 88%", once: true },
          delay: revealAll ? Math.min(index, 12) * 0.06 : Math.min(Array.from(element.parentElement!.children).indexOf(element), 3) * 0.05,
        });
        timeline.fromTo(element, { opacity: 0, y: distance },
          { opacity: 1, y: 0, duration, ease: "power2.out", immediateRender: false, clearProps: "opacity,transform" }, 0);
        splitsFor[index].forEach(split => {
          timeline.fromTo(split.chars, { opacity: 0, y: 10 }, {
            opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false,
            stagger: { amount: Math.min(split.chars.length * 0.018, 0.7), from: "start" },
            clearProps: "opacity,transform",
          }, 0);
        });
        return timeline;
      });

      // 4. One write: everything starts hidden. Timelines already playing take over on the next tick.
      gsap.set(targets, { opacity: 0, y: distance });
      const chars = splits.flatMap(split => split.chars);
      if (chars.length) gsap.set(chars, { opacity: 0, y: 10 });

      // Keyboard navigation must never land on visually hidden copy or links.
      const showFocused = (event: FocusEvent) => {
        targets.forEach((element, index) => {
          if (element.contains(event.target as Node)) animations[index].progress(1);
        });
      };
      root.addEventListener("focusin", showFocused);
      return () => { root.removeEventListener("focusin", showFocused); spokenCopies.forEach(copy => copy.remove()); splits.forEach(split => split.revert()); };
    }, scope);
    return () => media.revert();
  }, { scope, dependencies: [letters, revealAll, replay], revertOnUpdate: true });
  return <div ref={scope} data-scroll-copy data-scroll-style={letters ? "letters" : "fade"}>{children}</div>;
}

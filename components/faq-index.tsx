"use client";

import { useRef } from "react";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { gsap, useGSAP, motionConditions } from "@/lib/motion";

gsap.registerPlugin(ScrollToPlugin);

type Group = { id: string; title: string };

// The category whose group has passed the reading line just under the header carries an underline that grows
// from a dot at its centre; when the current group changes, every other line shrinks away before the new one grows.
export function FaqIndex({ groups }: { groups: Group[] }) {
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".faq-index-link"));
    const lines = links.map((link) => link.querySelector<HTMLElement>(".faq-index-underline")!);
    const sections = groups.map((group) => document.getElementById(`faq-${group.id}`)!);
    let current = -1;
    let sequence: gsap.core.Timeline | undefined;
    let reduce = false;
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => { reduce = Boolean(conditions?.reduce); });
    const show = (index: number) => {
      const previous = current;
      current = index;
      links.forEach((link, i) => { if (i === index) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
      sequence?.kill();
      if (reduce) {
        gsap.set(lines, { scaleX: 0 });
        gsap.set(lines[index], { scaleX: 1 });
        return;
      }
      // Retract everything else first (a change mid-animation must never leave a second line half drawn).
      sequence = gsap.timeline();
      const others = lines.filter((_, i) => i !== index && Number(gsap.getProperty(lines[i], "scaleX")) > 0);
      if (others.length) sequence.to(others, { scaleX: 0, duration: previous >= 0 ? 0.25 : 0, ease: "power2.in", overwrite: true });
      sequence.to(lines[index], { scaleX: 1, duration: 0.35, ease: "power2.out", overwrite: true });
    };
    // Category clicks glide to their group, a header clearance below the top; the scroll reveal keeps firing on the way.
    const jump = (event: MouseEvent) => {
      const link = event.currentTarget as HTMLAnchorElement;
      const target = document.querySelector<HTMLElement>(link.getAttribute("href")!);
      if (!target) return;
      event.preventDefault();
      history.replaceState(null, "", link.getAttribute("href")!);
      const offsetY = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      if (reduce) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offsetY, behavior: "instant" });
      else gsap.to(window, { scrollTo: { y: target, offsetY }, duration: 0.8, ease: "power2.inOut", overwrite: true });
    };
    links.forEach((link) => link.addEventListener("click", jump));
    let frame = 0;
    const update = () => {
      frame = 0;
      // Reading line: where a jump lands a group, plus a little, so the jumped-to group is always the current one.
      const line = (parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0) + 48;
      let index = 0;
      sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= line) index = i; });
      // The last group may never reach the line on short pages: it is current once the page is scrolled to the end.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) index = sections.length - 1;
      if (index !== current) show(index);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    gsap.set(lines, { scaleX: 0, transformOrigin: "50% 50%" });
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      links.forEach((link) => link.removeEventListener("click", jump));
      gsap.killTweensOf(window);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      sequence?.kill();
      media.revert();
    };
  }, { scope });
  return <nav ref={scope} aria-label="Question categories" className="faq-index">
    <ul>{groups.map((group) => <li key={group.id}>
      <a href={`#faq-${group.id}`} className="faq-index-link">{group.title}<span className="faq-index-underline" aria-hidden="true" /></a>
    </li>)}</ul>
  </nav>;
}

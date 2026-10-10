"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { services } from "@/content/services";
import { featuredWork } from "@/content/work";
import { pageCopy } from "@/content/pages";
import { PhotoTile, useLightbox } from "@/components/lightbox";
import { gsap, useGSAP, motionConditions } from "@/lib/motion";

// Every service is a filter, matching the homepage lineup, even before it has photographs. One grid, ordered by service.
const ordered = services.flatMap((service) => featuredWork.filter((project) => project.service === service.id));

// The active filter arrives from the page on the server, so the gallery hydrates with the page (no Suspense).
// The chosen filter carries the same underline as the FAQ index: others retract, then it grows from its centre dot.
export function WorkFilter({ active }: { active: string }) {
  const filterRef = useRef<HTMLElement>(null);
  const previousFilter = useRef<string | null>(null);
  useEffect(() => {
    const nav = filterRef.current!;
    const selected = nav.querySelector<HTMLElement>('[aria-current="page"]')!;
    const bounds = nav.getBoundingClientRect();
    const link = selected.getBoundingClientRect();
    if (link.left < bounds.left) nav.scrollLeft += link.left - bounds.left;
    else if (link.right > bounds.right) nav.scrollLeft += link.right - bounds.right;
  }, [active]);
  useGSAP(() => {
    const nav = filterRef.current!;
    const lines = Array.from(nav.querySelectorAll<HTMLElement>(".faq-index-underline"));
    const target = nav.querySelector<HTMLElement>(`[data-filter="${active}"] .faq-index-underline`)!;
    gsap.set(lines, { transformOrigin: "50% 50%" });
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) {
        gsap.set(lines, { scaleX: 0 });
        gsap.set(target, { scaleX: 1 });
      } else {
        const others = lines.filter((line) => line !== target && Number(gsap.getProperty(line, "scaleX")) > 0);
        const sequence = gsap.timeline();
        if (others.length) sequence.to(others, { scaleX: 0, duration: previousFilter.current ? 0.25 : 0, ease: "power2.in", overwrite: true });
        sequence.to(target, { scaleX: 1, duration: 0.35, ease: "power2.out", overwrite: true });
      }
    }, filterRef);
    previousFilter.current = active;
    return () => media.revert();
  }, { scope: filterRef, dependencies: [active] });
  const filterLink = (id: string, label: string, href: string) => (
    <Link key={id} href={href} scroll={false} data-filter={id} aria-current={active === id ? "page" : undefined} className="faq-index-link">
      {label}<span className="faq-index-underline" aria-hidden="true" />
    </Link>
  );
  return <nav ref={filterRef} aria-label="Filter work by service" className="work-filter">
    {filterLink("all", pageCopy.work.allWork, "/work")}
    {services.map((service) => filterLink(service.id, service.name, `/work?service=${service.id}`))}
  </nav>;
}

export function WorkGallery({ active }: { active: string }) {
  const visible = ordered.filter((project) => active === "all" || active === project.service);
  const { open, lightbox } = useLightbox(visible);
  return <>
    <p role="status" className="sr-only">{pageCopy.work.showing} {active === "all" ? pageCopy.work.allWork.toLowerCase() : services.find((service) => service.id === active)?.name}.</p>
    {visible.length === 0 && <p className="max-w-prose text-muted-foreground">{pageCopy.work.emptyCategory} <Link className="text-link" href={`/contact?service=${active}`}>Ask us</Link></p>}
    <div className="work-grid">{visible.map((project, index) => <PhotoTile key={project.slug} project={project} open={open} eager={index === 0} sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, calc((100vw - 48px) / 2)" />)}</div>
    {lightbox}
  </>;
}

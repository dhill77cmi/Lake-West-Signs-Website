"use client";

import Link from "next/link";
import type { Project } from "@/content/types";
import { PhotoTile, useLightbox } from "@/components/lightbox";
import { RailArrows, useRail } from "@/components/review-rail";

// A service's photographs in one row: square tiles, arrows that page like the review cards, and the Our Work lightbox.
export function PhotoRail({ projects, more }: { projects: Project[]; more: { href: string; label: string } }) {
  const { rail, edges, previous, next } = useRail<HTMLUListElement>(projects.length);
  const { open, lightbox } = useLightbox(projects);
  // The arrows stay on every page for consistency; when every photograph already fits they are simply both disabled.
  return <>
    <div className="photo-rail-top">
      <Link className="text-link" href={more.href}>{more.label}</Link>
      <RailArrows label="photograph" previous={previous} next={next} edges={edges} />
    </div>
    <ul ref={rail} className="photo-rail" aria-label="Photographs of this work" tabIndex={0}>
      {projects.map((project) => <li key={project.slug}><PhotoTile project={project} open={open} /></li>)}
    </ul>
    {lightbox}
  </>;
}

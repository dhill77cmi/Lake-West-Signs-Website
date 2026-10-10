"use client";

import Image from "next/image";
import { ResponsiveImage } from "@/components/responsive-image";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { services } from "@/content/services";
import type { Project } from "@/content/types";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

type Opener = (project: Project, event: MouseEvent<HTMLButtonElement>) => void;

// A square tile that opens its photograph in the lightbox; the frame crops, the lightbox shows the whole photograph.
// The photograph is drawn once at the hovered size and rests slightly clipped; hover or focus opens the clip, like the
// home service cards, so nothing is rescaled and the picture stays sharp.
export function PhotoTile({ project, open, eager = false, sizes = "(min-width: 1024px) 280px, (min-width: 640px) 33vw, 70vw" }: { project: Project; open: Opener; eager?: boolean; sizes?: string }) {
  const tile = useRef<HTMLButtonElement>(null);
  useGSAP(() => {
    const button = tile.current!;
    const photo = button.querySelector("img")!;
    const media = gsap.matchMedia();
    media.add({ hover: "(hover: hover) and (pointer: fine)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      if (!conditions?.hover || conditions.reduce) return;
      const tokens = motionTokens(button);
      const radius = getComputedStyle(photo).borderRadius;
      const grow = () => gsap.to(photo, { clipPath: `inset(0% round ${radius})`, duration: tokens.hero, ease: tokens.ease, overwrite: true });
      const settle = () => gsap.to(photo, { clipPath: `inset(2% round ${radius})`, duration: tokens.hero, ease: tokens.ease, overwrite: true, clearProps: "clipPath" });
      button.addEventListener("pointerenter", grow);
      button.addEventListener("pointerleave", settle);
      button.addEventListener("focus", grow);
      button.addEventListener("blur", settle);
      return () => {
        button.removeEventListener("pointerenter", grow);
        button.removeEventListener("pointerleave", settle);
        button.removeEventListener("focus", grow);
        button.removeEventListener("blur", settle);
        gsap.killTweensOf(photo);
        gsap.set(photo, { clearProps: "clipPath" });
      };
    }, tile);
    return () => media.revert();
  }, { scope: tile });
  return <button ref={tile} type="button" className="work-tile" aria-label={`View photograph: ${project.caption}`} aria-haspopup="dialog" onClick={(event) => open(project, event)}>
    <ResponsiveImage src={project.image.src} width={project.image.width} height={project.image.height} alt={project.alt} priority={eager} sizes={sizes} className="work-photo" />
  </button>;
}

// The photograph window shared by Our Work and the service pages: eases open from a pointer, slides between
// neighbors with the arrow keys or buttons, and returns focus to the tile that opened it.
export function useLightbox(items: Project[]): { open: Opener; lightbox: ReactNode } {
  const [selected, setSelected] = useState<Project | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const reduce = useRef(true);
  const closing = useRef(false);
  const pointerOpened = useRef(false);
  const direction = useRef(0);
  const { contextSafe } = useGSAP(() => {
    const dialog = dialogRef.current!;
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      reduce.current = Boolean(conditions?.reduce);
      if (reduce.current) {
        gsap.killTweensOf(dialog);
        gsap.set(dialog, { clearProps: "opacity,transform" });
        if (closing.current) dialog.close();
      }
    }, dialogRef);
    return () => media.revert();
  }, { scope: dialogRef });
  const open = selected !== null;
  const step = (delta: number) => setSelected((current) => {
    direction.current = delta;
    const index = current ? items.indexOf(current) : -1;
    return items[(index + delta + items.length) % items.length];
  });
  useGSAP(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    closing.current = false;
    dialog.showModal();
    if (!reduce.current && pointerOpened.current) {
      const tokens = motionTokens(dialog);
      gsap.fromTo(dialog, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: tokens.hero, ease: tokens.ease, clearProps: "opacity,transform" });
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, { scope: dialogRef, dependencies: [open], revertOnUpdate: true });
  useGSAP(() => {
    if (!open || !direction.current || reduce.current) return;
    const photo = dialogRef.current!.querySelector(".lightbox-photo");
    const tokens = motionTokens(dialogRef.current!);
    gsap.fromTo(photo, { opacity: 0, x: direction.current * 24 }, { opacity: 1, x: 0, duration: tokens.hero, ease: tokens.ease, overwrite: true, clearProps: "opacity,transform" });
  }, { scope: dialogRef, dependencies: [selected] });
  const close = contextSafe((animate = true) => {
    const dialog = dialogRef.current!;
    gsap.killTweensOf(dialog);
    closing.current = true;
    if (reduce.current || !animate) {
      dialog.close();
    } else {
      const tokens = motionTokens(dialog);
      gsap.to(dialog, { opacity: 0, scale: 0.98, duration: tokens.disclosure, ease: tokens.ease, onComplete: () => { gsap.set(dialog, { clearProps: "opacity,transform" }); dialog.close(); } });
    }
  });
  function afterClose() { setSelected(null); opener.current?.focus(); }
  const openProject: Opener = (project, event) => { opener.current = event.currentTarget; pointerOpened.current = event.detail !== 0; direction.current = 0; setSelected(project); };
  const lightbox = <dialog ref={dialogRef} aria-labelledby="lightbox-title" className="work-lightbox" onClose={afterClose} onCancel={(event) => { event.preventDefault(); close(false); }} onClick={(event) => { if (event.target === event.currentTarget) close(event.detail !== 0); }}
    onKeyDown={(event) => { if (event.key === "ArrowRight") step(1); else if (event.key === "ArrowLeft") step(-1); }}>
    {selected && <div className="lightbox-content">
      <div className="mb-4 flex items-center justify-between gap-4"><h2 id="lightbox-title" className="text-title">{services.find((service) => service.id === selected.service)?.name}</h2><button type="button" autoFocus className="lightbox-close" aria-label="Close" onClick={(event) => close(event.detail !== 0)}><X aria-hidden="true" /></button></div>
      <div className="lightbox-stage">
        {items.length > 1 && <button type="button" className="lightbox-arrow lightbox-arrow-prev" aria-label="Previous photograph" onClick={() => step(-1)}><ChevronLeft aria-hidden="true" /></button>}
        <Image src={selected.image.src} width={selected.image.width} height={selected.image.height} alt={selected.alt} unoptimized className="lightbox-photo" />
        {items.length > 1 && <button type="button" className="lightbox-arrow lightbox-arrow-next" aria-label="Next photograph" onClick={() => step(1)}><ChevronRight aria-hidden="true" /></button>}
      </div>
    </div>}
  </dialog>;
  return { open: openProject, lightbox };
}

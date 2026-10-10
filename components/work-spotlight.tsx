"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, motionConditions } from "@/lib/motion";
import { workSpotlight } from "@/content/work-spotlight";

export function WorkSpotlight({ className = "" }: { className?: string }) {
  const scope = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0);
  const active = useRef(0);
  const duration = useRef(0.45);
  const { contextSafe } = useGSAP({ scope });
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      duration.current = conditions?.reduce ? 0 : 0.45;
      if (conditions?.reduce) {
        const photos = scope.current!.querySelectorAll('.work-spotlight-photo');
        gsap.killTweensOf(photos);
        gsap.set(photos, { opacity: index => index === active.current ? 1 : 0 });
      }
    });
    return () => media.revert();
  }, { scope });
  const choose = contextSafe((index: number) => {
    active.current = index;
    setSelected(index);
    gsap.to(scope.current!.querySelectorAll('.work-spotlight-photo'), {
      opacity: photo => photo === index ? 1 : 0, duration: duration.current, ease: "power2.out", overwrite: true,
    });
  });
  return <section ref={scope} id="selected-work" className={`work-spotlight ${className}`} aria-labelledby="selected-work-title">
    <div className="work-spotlight-copy">
      <h2 id="selected-work-title">Our work.</h2>
      <p className="work-spotlight-intro">Different ideas. Made to stand out.</p>
      <div className="work-project-list" role="group" aria-label="Choose a featured project">
        {workSpotlight.map((project, index) => <button key={project.src} type="button" aria-pressed={selected === index} aria-controls="work-spotlight-image" onClick={() => choose(index)}>
          <span>{project.title}</span><span aria-hidden="true" className="work-project-arrow">↗</span>
        </button>)}
      </div>
      <Link href="/work" className="work-gallery-link">Explore all our work <span aria-hidden="true">→</span></Link>
    </div>
    <figure className="work-spotlight-visual">
      <div id="work-spotlight-image" className="work-spotlight-images">
        {workSpotlight.map((project, index) => <Image key={project.src} src={project.src} width={1600} height={900} unoptimized alt={selected === index ? project.alt : ""} aria-hidden={selected !== index} className="work-spotlight-photo" style={{ opacity: index === 0 ? 1 : 0 }} />)}
      </div>
      <figcaption aria-live="polite">{workSpotlight[selected].detail}</figcaption>
    </figure>
  </section>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "@/lib/motion";
import { site } from "@/content/site";
import { testimonials } from "@/content/testimonials";

const stars = "★★★★★";

// A horizontal, snap-scrolling list paged by arrow buttons: one position per card that can sit at the left edge.
export function useRail<T extends HTMLElement>(count: number) {
  const rail = useRef<T>(null);
  const [active, setActive] = useState(0);
  const [pages, setPages] = useState(count);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const element = rail.current!;
    const update = () => {
      const cards = Array.from(element.children) as HTMLElement[];
      // One dot per scroll position: the first card that can sit at the left edge, up to the last that can.
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
      const visible = Math.max(1, Math.floor((element.clientWidth + (step - cards[0].offsetWidth) + 2) / step));
      setPages(Math.max(1, cards.length - visible + 1));
      setActive(cards.reduce((best, card, index) => Math.abs(card.offsetLeft - element.scrollLeft) < Math.abs(cards[best].offsetLeft - element.scrollLeft) ? index : best, 0));
      setEdges({ start: element.scrollLeft < 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, []);
  const show = (index: number) => {
    const element = rail.current!;
    const card = element.children[index] as HTMLElement | undefined;
    if (!card) return;
    // Snapping would jump the tween to a snap point on every frame; hand control back once it lands.
    element.style.scrollSnapType = "none";
    gsap.to(element, {
      scrollLeft: card.offsetLeft, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.6, ease: "power2.out", overwrite: true,
      onComplete: () => element.style.removeProperty("scroll-snap-type"),
    });
  };
  // When every card already fits, there is nothing to page through.
  const scrollable = !(edges.start && edges.end);
  const current = Math.min(active, pages - 1);
  return { rail, show, edges, pages, current, scrollable, previous: () => show(Math.max(0, current - 1)), next: () => show(Math.min(pages - 1, current + 1)) };
}

export function RailArrows({ label, previous, next, edges }: { label: string; previous: () => void; next: () => void; edges: { start: boolean; end: boolean } }) {
  return <div className="review-arrows">
    <button type="button" aria-label={`Previous ${label}`} disabled={edges.start} onClick={previous}><ChevronLeft aria-hidden="true" /></button>
    <button type="button" aria-label={`Next ${label}`} disabled={edges.end} onClick={next}><ChevronRight aria-hidden="true" /></button>
  </div>;
}

export function ReviewRail() {
  const { rail, show, edges, pages, current, scrollable, previous, next } = useRail<HTMLUListElement>(testimonials.length);
  const dots = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = dots.current;
    const selected = strip?.children[current] as HTMLElement | undefined;
    if (!strip || !selected) return;
    // Keep the selected position in view without moving the page vertically.
    strip.scrollLeft = selected.offsetLeft - strip.clientWidth / 2 + selected.offsetWidth / 2;
  }, [current, pages]);
  return <div className="review-rail">
    <div className="review-rail-top">
      <a className="review-summary review-summary--inline" href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${site.googleRating.toFixed(1)} out of 5 on Google, based on ${site.googleReviewCount} reviews (opens in a new tab)`}>
        <span className="review-summary-source">Google</span>
        <span className="review-summary-score"><strong>{site.googleRating.toFixed(1)}</strong><span>/ 5</span></span>
        <span className="review-summary-detail">
          <span className="review-summary-stars" aria-hidden="true">★★★★★</span>
          <span className="review-summary-count">{site.googleReviewCount} reviews</span>
        </span>
      </a>
      {scrollable && <RailArrows label="review" previous={previous} next={next} edges={edges} />}
    </div>
    <ul ref={rail} className="reviews-list" aria-label="Customer reviews" tabIndex={0}>
      {testimonials.map((testimonial) => <li key={testimonial.name} className="review"><a className="review-link" href={site.googleReviewsUrl}><figure>
        <span className="review-mark" aria-hidden="true">“</span>
        {testimonial.rating !== undefined && <span className="review-rating" role="img" aria-label={`Rated ${testimonial.rating} out of 5`}>
          <span aria-hidden="true">{testimonial.rating}</span>
          <span className="review-stars" aria-hidden="true">{stars.slice(0, testimonial.rating)}<span className="review-stars-empty">{stars.slice(testimonial.rating)}</span></span>
        </span>}
        <blockquote>{testimonial.quote}</blockquote>
        <figcaption>
          <span className="review-avatar" aria-hidden="true">{testimonial.name.charAt(0)}{testimonial.avatar && <img src={testimonial.avatar} alt={`Google profile picture of ${testimonial.name}`} loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.remove(); }} />}</span>
          {testimonial.name}
        </figcaption>
      </figure></a></li>)}
    </ul>
    {scrollable && <div ref={dots} className="review-dots" role="group" aria-label="Review positions">{Array.from({ length: pages }, (_, index) => <button type="button" key={index} className="review-dot" aria-label={`Go to position ${index + 1} of ${pages}`} aria-current={index === current ? "true" : undefined} onClick={() => show(index)} />)}</div>}
  </div>;
}

import type { ReactNode } from "react";
import { PhotoHero } from "@/components/photo-hero";

export function HeroMoment({ children, layout = "split" }: { children: ReactNode; layout?: "split" | "full" }) {
  return <PhotoHero layout={layout}>{children}</PhotoHero>;
}

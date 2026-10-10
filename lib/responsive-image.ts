import manifest from "@/content/responsive-images.json";

type Variant = { src: string; width: number; height: number };
const images: Record<string, Variant[]> = manifest;

export function responsiveImage(src: string, preferredWidth = 640) {
  const variants = images[src];
  if (!variants) return { src };
  const fallback = variants.find((variant) => variant.width >= preferredWidth) ?? variants.at(-1)!;
  return { src: fallback.src, srcSet: variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ") };
}

export function smallImage(src: string) {
  return images[src]?.[0].src ?? src;
}

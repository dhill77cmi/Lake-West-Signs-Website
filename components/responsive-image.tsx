import type { ImgHTMLAttributes } from "react";
import { preload } from "react-dom";
import { responsiveImage } from "@/lib/responsive-image";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & { src: string; alt: string; priority?: boolean };

// Native responsive images use prebuilt files on every host, with no runtime transformations.
export function ResponsiveImage({ src, alt, priority = false, loading, sizes = "(min-width: 1024px) 576px, calc(100vw - 32px)", ...props }: Props) {
  const image = responsiveImage(src);
  // Preserve early discovery of the logo and lead photo, including streamed pages.
  // Matching srcset/sizes prevents downloading a second, incorrectly sized file.
  if (priority) preload(image.src, { as: "image", imageSrcSet: image.srcSet, imageSizes: sizes, fetchPriority: "high" });
  return <img {...props} {...image} alt={alt} data-original-src={src} sizes={sizes}
    loading={priority ? "eager" : loading ?? "lazy"} fetchPriority={priority ? "high" : props.fetchPriority} decoding="async" />;
}

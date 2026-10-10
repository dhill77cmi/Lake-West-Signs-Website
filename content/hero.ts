import { work } from "@/content/work";

export type HeroSlide = { slug: string; title: string; src: string };

// These seven generated derivatives were separately selected for the hero.
export const heroSlides: HeroSlide[] = ["bedrock", "signage2", "jetski", "signage5", "airplane", "signage7", "czvan"].map((slug) => {
  const photo = work.find((project) => project.slug === slug);
  if (!photo) throw new Error(`Unknown hero photograph: ${slug}`);
  return { slug, title: photo.title, src: `/work/hero/${slug}.webp` };
});

export const originalIntroOrder = ["airplane", "signage7", "czvan", "signage5", "bedrock", "signage2", "jetski"];
export const enhancedIntroSlugs = ["signage4", "boat", "sbpolice", "laketime", "signage6", "lwyellowcharger", "signage8", "letteredvan", "signage9", "vinylrepairguys", "signage10", "thedockguy", "signage11"];

// End on the original seven enhanced photos, with Bedrock in the center.
export const introPhotoOrder = [
  "signage10", "boat", "sbpolice", "laketime", "signage6",
  "lwyellowcharger", "signage8", "letteredvan", "signage9", "vinylrepairguys",
  "signage4", "thedockguy", "signage11",
  "airplane", "signage7", "czvan", "bedrock", "signage5", "jetski", "signage2",
];

export const introPhotos = introPhotoOrder.map((slug) => {
  const enhanced = heroSlides.find(photo => photo.slug === slug);
  if (enhanced) return { ...enhanced, enhanced: true };
  const photo = work.find(project => project.slug === slug);
  if (!photo) throw new Error(`Unknown intro photograph: ${slug}`);
  const isEnhanced = enhancedIntroSlugs.includes(slug);
  return { slug, title: photo.title, src: isEnhanced ? `/work/intro/${slug}.webp` : photo.image.src, enhanced: isEnhanced };
});

export const originalIntroPhotos = originalIntroOrder.map(slug => introPhotos.find(photo => photo.slug === slug)!);

// Exclude black-banded Budget Blinds artwork and the unfinished sign installation.
export const swipeHeroSlides: HeroSlide[] = [heroSlides[0], ...introPhotos.filter(photo => photo.slug !== "bedrock" && photo.slug !== "signage3" && photo.slug !== "signage1")];

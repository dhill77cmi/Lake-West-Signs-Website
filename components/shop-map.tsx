import { site } from "@/content/site";

export function ShopMap() {
  return <iframe
    className="shop-map"
    title={`Map of ${site.name}`}
    src={site.mapsEmbedUrl}
    loading="lazy"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
  />;
}

import { serializeJsonLd } from "@/lib/schema";

export function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />;
}

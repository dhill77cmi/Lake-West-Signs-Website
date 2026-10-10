import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { mkdir, copyFile } from "node:fs/promises";
const slugs = ["signage4", "boat", "sbpolice", "signage3", "laketime", "signage6", "lwyellowcharger", "signage8", "letteredvan", "signage9", "vinylrepairguys", "signage10", "thedockguy", "signage11"];
const destination = new URL("../public/work/intro/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const slug of slugs) {
  const version = ["laketime", "letteredvan"].includes(slug) ? "-v2" : "";
  const source = new URL(`../assets/openart/intro-hd/renders/${slug}-hd${version}.png`, import.meta.url);
  await copyFile(source, new URL(`${slug}.png`, destination));
  await sharp(fileURLToPath(source)).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(fileURLToPath(new URL(`${slug}.webp`, destination)));
  console.log(slug);
}

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { featuredWork } from "../content/work.ts";

// Reproducible, uncropped derivatives; supplied originals are never overwritten.
const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public/optimized");
await mkdir(output, { recursive: true });
const sources = new Set(featuredWork.map((project) => project.image.src));
for (const directory of ["work/hero", "work/intro", "work/lineup"]) {
  for (const file of await readdir(path.join(root, "public", directory))) {
    if (file.endsWith(".webp")) sources.add(`/${directory}/${file}`);
  }
}
sources.add("/logo-transparent.png");
sources.add("/shop-front.jpg");
const manifest = {};
let totalBytes = 0;
let count = 0;
for (const src of [...sources].sort()) {
  const original = await readFile(path.join(root, "public", src));
  const metadata = await sharp(original).metadata();
  const logo = src === "/logo-transparent.png";
  const widths = logo ? [160, 320] : [320, 640, 1280, 1920];
  const recipe = `webp-v1-quality82-effort5-${logo ? "lossless" : "photo"}`;
  const digest = createHash("sha256").update(original).update(recipe).digest("hex").slice(0, 12);
  const name = path.basename(src, path.extname(src));
  manifest[src] = [];
  for (const width of [...new Set(widths.map((size) => Math.min(size, metadata.width)))]) {
    const filename = `${name}-${digest}-${width}.webp`;
    const { data, info } = await sharp(original).resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, lossless: logo }).toBuffer({ resolveWithObject: true });
    await writeFile(path.join(output, filename), data);
    manifest[src].push({ src: `/optimized/${filename}`, width: info.width, height: info.height });
    totalBytes += info.size;
    count++;
  }
}
await writeFile(path.join(root, "content/responsive-images.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${count} responsive images from ${sources.size} sources (${(totalBytes / 1024 / 1024).toFixed(2)} MiB). Originals unchanged.`);

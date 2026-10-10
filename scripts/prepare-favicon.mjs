import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// The approved "LWS" badge (2026-10-10): Bookman Old Style Bold letters with the logo's chrome
// gradient and logo-blue (#1175BC) outline on white. Kept as a finished square master so the
// icons can be rebuilt without that font installed.
const master = fileURLToPath(new URL("../assets/lws-badge.png", import.meta.url));
const png = (size) => sharp(master).resize(size, size).ensureAlpha().png().toBuffer();

// favicon.ico holding PNG-encoded 16/32/48px images (48px is Google's minimum for search results).
const images = await Promise.all([16, 32, 48].map(png));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const size = [16, 32, 48][index];
  const entry = 6 + 16 * index;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
const app = (name) => new URL(`../app/${name}`, import.meta.url);
await writeFile(app("favicon.ico"), Buffer.concat([header, ...images]));
await writeFile(app("icon.png"), await png(192));
await writeFile(app("apple-icon.png"), await png(180));
console.log("favicon.ico, icon.png, apple-icon.png written");

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";

const directory = new URL("../public/work/hero/", import.meta.url);
for (const slug of ["bedrock", "airplane", "czvan", "jetski", "signage2", "signage5", "signage7"]) {
  const source = fileURLToPath(new URL(`${slug}.png`, directory));
  const target = fileURLToPath(new URL(`${slug}.webp`, directory));
  await sharp(source).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(target);
  console.log(`${slug}: ${Math.round((await stat(target)).size / 1024)} KB`);
}

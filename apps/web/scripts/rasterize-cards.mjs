import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const sourceDir = path.join(appDir, "art-source", "cards");
const outputDir = path.join(appDir, "src", "assets", "cards");
const outputWidth = 148;
const maxBytes = 15 * 1024;
const minimumQuality = 70;

await mkdir(outputDir, { recursive: true });

const sources = (await readdir(sourceDir))
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort((left, right) => left.localeCompare(right, "en", { numeric: true }));

if (sources.length !== 53) {
  throw new Error(`Expected 52 face SVGs plus back.svg; found ${sources.length} SVGs`);
}

for (const sourceName of sources) {
  const inputPath = path.join(sourceDir, sourceName);
  const outputName = `${path.basename(sourceName, ".svg")}.webp`;
  const outputPath = path.join(outputDir, outputName);
  let quality = 80;

  while (quality >= minimumQuality) {
    await sharp(inputPath)
      .resize({ width: outputWidth })
      .webp({ quality, effort: 6 })
      .toFile(outputPath);

    if ((await stat(outputPath)).size <= maxBytes) break;
    quality -= 2;
  }

  const { size } = await stat(outputPath);
  if (size > maxBytes) {
    throw new Error(
      `${outputName} is ${size} bytes at quality ${minimumQuality}; refusing to lower quality further`,
    );
  }

  console.log(`${outputName}: ${size} bytes (quality ${quality})`);
}

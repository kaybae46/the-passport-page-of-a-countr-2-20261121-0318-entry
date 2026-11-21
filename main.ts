// main.ts — The Passport Page of a Country That Isn't There
//
// The entry ships its passport spread as passport.png in this repository.
// This program copies that image to the output directory as entry.png,
// the single file the make.fun gate checks (a whole PNG or JPEG of at most
// 1,048,576 bytes and 1024 by 1024 pixels).
//
// Run:  node main.ts
// The output directory is $MAKEFUN_OUTPUT_DIR when set, else /output.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576;
const MAX_DIMENSION = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "passport.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

if (!existsSync(source)) {
  throw new Error(`passport.png not found next to main.ts: ${source}`);
}

const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) {
  throw new Error(`passport.png is ${bytes.length} bytes, over the 1 MiB gate`);
}
if (!isPng(bytes)) {
  throw new Error("passport.png is not a PNG file");
}
const { width, height } = pngDimensions(bytes);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  throw new Error(`passport.png is ${width}x${height}, over the 1024x1024 gate`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
const written = statSync(target).size;
if (written !== bytes.length) {
  throw new Error(`copy incomplete: wrote ${written} of ${bytes.length} bytes`);
}
console.log(`wrote ${target} (${written} bytes, ${width}x${height})`);

function isPng(b: Buffer): boolean {
  return (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  );
}

// PNG dimensions live in the IHDR chunk: bytes 16..23, big-endian.
function pngDimensions(b: Buffer): { width: number; height: number } {
  if (b.length < 24) {
    throw new Error("passport.png is too short to hold an IHDR chunk");
  }
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

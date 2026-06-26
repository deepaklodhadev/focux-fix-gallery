// One-time generator for FocusPix sample media.
// Pure Node (uses built-in zlib), no external deps.
// Run with: node scripts/generate-samples.mjs
//
// Produces ~44 PNG placeholders in assets/samples/ plus a samples.json
// manifest with synthetic metadata spread across the last ~6 months
// (including Today and Yesterday), across several source folders, with
// a handful of "video" items (poster image + duration).

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "samples");

// --- minimal PNG encoder (24-bit RGB, no deps) ------------------------------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    crc32.table = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // add filter byte (0) per scanline
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * (stride + 1) + 1 + x * 3;
      raw[d] = rgba[s];
      raw[d + 1] = rgba[s + 1];
      raw[d + 2] = rgba[s + 2];
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- palette of pleasing gradients -----------------------------------------
function hsl(h, s, l) {
  // h: 0..360, s/l: 0..1 -> [r,g,b] 0..255
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (0 <= hp && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function gradient(w, h, c1, c2, angle = 45) {
  const buf = Buffer.alloc(w * h * 4);
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = Math.max(0, Math.min(1, ((x * dx + y * dy) + len / 2) / len));
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
      const s = (y * w + x) * 4;
      buf[s] = r; buf[s + 1] = g; buf[s + 2] = b; buf[s + 3] = 255;
    }
  }
  return buf;
}

// --- manifest generation ---------------------------------------------------
const FOLDERS = ["Camera", "Screenshots", "WhatsApp Images", "Downloads"];
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const startOfTodayMs = startOfToday.getTime();

// Spread items: today, yesterday, then increasingly older across ~6 months.
const offsetsDays = [
  // today (6 items)
  0, 0, 0, 0, 0, 0,
  // yesterday (4)
  1, 1, 1, 1,
  // recent week (8)
  2, 3, 4, 5, 6, 6, 7, 7,
  // recent month (10)
  10, 12, 14, 16, 18, 20, 22, 24, 26, 28,
  // older (16), up to ~6 months
  35, 42, 49, 56, 63, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 175,
];

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const items = [];
let idx = 0;
for (const d of offsetsDays) {
  // Vary time-of-day so within-day ordering is meaningful.
  const hour = (idx * 37) % 23;
  const minute = (idx * 53) % 60;
  const ts = startOfTodayMs - d * DAY + hour * 3600000 + minute * 60000;
  const folder = FOLDERS[idx % FOLDERS.length];
  const isVideo = idx % 9 === 0; // ~every 9th item is a video
  const id = `sample-${String(idx).padStart(3, "0")}`;
  const filename = `${id}.png`;

  // Render a gradient image.
  const hueA = (idx * 47) % 360;
  const hueB = (hueA + 40 + (idx % 5) * 20) % 360;
  const c1 = hsl(hueA, 0.6, 0.55);
  const c2 = hsl(hueB, 0.65, 0.42);
  const W = 512, H = 384;
  const png = makePNG(W, H, gradient(W, H, c1, c2, 30 + (idx % 6) * 25));
  writeFileSync(join(OUT_DIR, filename), png);

  items.push({
    id,
    filename,
    // Path used by the mock service via expo-asset / require-like resolution.
    asset: `./${filename}`,
    width: W,
    height: H,
    creationTime: ts,
    modificationTime: ts,
    folder,
    isVideo,
    duration: isVideo ? 5 + ((idx * 13) % 55) : 0, // seconds
  });
  idx++;
}

writeFileSync(
  join(OUT_DIR, "samples.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: items.length,
      items,
    },
    null,
    2,
  ),
);

// Emit a TS module that statically imports every PNG so Metro resolves them
// with zero extra config. The mock service imports items from this module.
const tsLines = [
  "// AUTO-GENERATED by scripts/generate-samples.mjs — do not edit.",
  "// Maps sample asset ids to statically-imported image modules.",
  "",
];
for (const it of items) {
  tsLines.push(`import ${it.id.replace(/-/g, "_")} from "./${it.filename}";`);
}
tsLines.push("");
tsLines.push("export const sampleAssets: Record<string, string | number> = {");
for (const it of items) {
  tsLines.push(`  "${it.id}": ${it.id.replace(/-/g, "_")},`);
}
tsLines.push("};");
tsLines.push("");
tsLines.push(
  "export const sampleManifest = " +
    JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, items }, null, 2) +
    " as const;",
);
tsLines.push("");
writeFileSync(join(OUT_DIR, "samples.ts"), tsLines.join("\n"));

console.log(`Generated ${items.length} sample images in ${OUT_DIR}`);

// Generates the PWA icons in public/icons with no dependencies.
// Design: three rising bars (run, weights, bike/hike) on a dark tile.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [18, 20, 24];
const BARS = [
  { color: [240, 82, 45], h: 0.42 },
  { color: [49, 73, 232], h: 0.62 },
  { color: [15, 138, 95], h: 0.82 },
];

// Crop/zoom factor: content fits inside the central `safe` fraction (maskable needs ~80%).
function render(size, { safe = 0.62, rounded = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 4; // supersampling
  const inset = (1 - safe) / 2;
  const barW = safe / 5; // 3 bars + 2 gaps of equal width… slightly tighter gaps below
  const gap = (safe - barW * 3) / 2;
  const bottom = 0.5 + (BARS[2].h * safe) / 2; // centre the tallest bar vertically
  const r = barW / 2;

  const inBar = (x, y) => {
    for (let i = 0; i < 3; i++) {
      const x0 = inset + i * (barW + gap);
      const x1 = x0 + barW;
      const y0 = bottom - BARS[i].h * safe;
      if (x < x0 || x > x1 || y < y0 || y > bottom) continue;
      // rounded ends
      const cx = x0 + r;
      if (y < y0 + r && (x - cx) ** 2 + (y - (y0 + r)) ** 2 > r * r) continue;
      if (y > bottom - r && (x - cx) ** 2 + (y - (bottom - r)) ** 2 > r * r) continue;
      return i;
    }
    return -1;
  };
  const inTile = (x, y) => {
    if (!rounded) return true;
    const R = 0.22;
    const dx = Math.max(R - x, 0, x - (1 - R));
    const dy = Math.max(R - y, 0, y - (1 - R));
    return dx * dx + dy * dy <= R * R;
  };

  for (let py = 0; py < size; py++) {
    for (let pxl = 0; pxl < size; pxl++) {
      let rr = 0, gg = 0, bb = 0, aa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (pxl + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (!inTile(x, y)) continue;
          const b = inBar(x, y);
          const c = b >= 0 ? BARS[b].color : BG;
          rr += c[0]; gg += c[1]; bb += c[2]; aa += 255;
        }
      }
      const n = SS * SS;
      const o = (py * size + pxl) * 4;
      const cov = aa / 255;
      px[o] = cov ? rr / cov : 0;
      px[o + 1] = cov ? gg / cov : 0;
      px[o + 2] = cov ? bb / cov : 0;
      px[o + 3] = aa / n;
    }
  }
  return png(size, px);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const out = new URL('../public/icons/', import.meta.url);
writeFileSync(new URL('icon-192.png', out), render(192, { rounded: true }));
writeFileSync(new URL('icon-512.png', out), render(512, { rounded: true }));
writeFileSync(new URL('maskable-512.png', out), render(512, { safe: 0.5 }));
writeFileSync(new URL('apple-touch-icon.png', out), render(180));
console.log('icons written');

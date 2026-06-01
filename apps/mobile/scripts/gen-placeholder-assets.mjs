#!/usr/bin/env node
// Generate placeholder PNG assets so EAS preview/dev builds don't fail
// while the designer produces final artwork.
//
// Pure Node (>= 22 for zlib.crc32), no external deps.
// Outputs solid brand-color PNGs at all sizes Expo expects.
// REPLACE these files with designer artwork before submitting to stores.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(ROOT, '..', 'assets');

// Brand color #2563eb
const BRAND = [0x25, 0x63, 0xeb];
// Notification icon must be monochrome white-on-transparent for Android,
// but a solid color also works for placeholder.
const WHITE = [0xff, 0xff, 0xff];

mkdirSync(ASSETS, { recursive: true });

function makePngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function solidPng(width, height, [r, g, b], { alpha = false } = {}) {
  const channels = alpha ? 4 : 3;
  const colorType = alpha ? 6 : 2;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLen = 1 + width * channels;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const off = y * rowLen;
    raw[off] = 0;
    for (let x = 0; x < width; x++) {
      const px = off + 1 + x * channels;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      if (alpha) raw[px + 3] = 0xff;
    }
  }
  const idat = deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: 'icon.png', w: 1024, h: 1024, color: BRAND },
  { name: 'adaptive-icon.png', w: 1024, h: 1024, color: BRAND, alpha: true },
  { name: 'splash.png', w: 1284, h: 2778, color: BRAND },
  { name: 'notification-icon.png', w: 96, h: 96, color: WHITE, alpha: true },
  { name: 'favicon.png', w: 48, h: 48, color: BRAND },
];

for (const t of targets) {
  const buf = solidPng(t.w, t.h, t.color, { alpha: t.alpha });
  const path = join(ASSETS, t.name);
  writeFileSync(path, buf);
  console.log(`  wrote ${t.name}  ${t.w}x${t.h}  ${buf.length} bytes`);
}

console.log('\n[done] Placeholder assets in apps/mobile/assets/.');
console.log('       REPLACE with designer artwork before store submission.');

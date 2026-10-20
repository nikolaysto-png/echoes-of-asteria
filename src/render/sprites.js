import { PAL } from '../core/constants.js';
import { CREATURES } from '../data/creatures.js';

// ---------------------------------------------------------------------------
// Tiny raster helpers. Creature buffers are 32x32, people are 16x20, and all
// output is forced through the same four DMG shades.
// ---------------------------------------------------------------------------
function makeBuf(w, h) { return { w, h, d: new Array(w * h).fill(null) }; }
function px(b, x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= b.w || y >= b.h) return; b.d[y * b.w + x] = c; }
function at(b, x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= b.w || y >= b.h) return null; return b.d[y * b.w + x]; }
function ell(b, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(b, x, y, c);
    }
  }
}
function box(b, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(b, x + i, y + j, c); }
function line(b, x1, y1, x2, y2, c) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    px(b, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), c);
  }
}
function tri(b, x1, y1, x2, y2, x3, y3, c) {
  const minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
  const minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d1 = (x - x2) * (y1 - y3) - (x1 - x2) * (y - y3);
      const d2 = (x - x3) * (y2 - y1) - (x2 - x3) * (y - y1);
      const d3 = (x - x1) * (y3 - y2) - (x3 - x1) * (y - y2);
      const neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      if (!(neg && pos)) px(b, x, y, c);
    }
  }
}
function flame(b, cx, cy, pal) {
  ell(b, cx, cy, 3, 4, pal[3]);
  tri(b, cx, cy - 7, cx - 3, cy, cx + 3, cy, pal[3]);
  ell(b, cx, cy + 1, 2, 2, pal[2]);
}

const OUTLINE = PAL.dark;

function shadeAndOutline(b, pal) {
  const main = pal[0], dark = pal[1], light = pal[2];
  const out = [];
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      const c = at(b, x, y);
      if (!c || c !== main) continue;
      const below = at(b, x, y + 1);
      const right = at(b, x + 1, y + 1);
      if (!below || !right) out.push([x, y, dark]);
    }
  }
  for (const [x, y, c] of out) px(b, x, y, c);
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (at(b, x, y) !== main) continue;
      if (!at(b, x, y - 1) && !at(b, x - 1, y)) px(b, x, y, light);
    }
  }
  const edge = [];
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (at(b, x, y)) continue;
      if (at(b, x + 1, y) || at(b, x - 1, y) || at(b, x, y + 1) || at(b, x, y - 1)) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) px(b, x, y, OUTLINE);
}

// ---------------------------------------------------------------------------
// Creature archetypes. These are rough little sprites drawn from primitives,
// then quantised into the DMG palette. No external art is loaded.
// ---------------------------------------------------------------------------
const ARCH = {
  blob(b, pal, f) {
    ell(b, 16, 20, 11, 10, pal[0]);
    box(b, 9, 28, 5, 3, pal[1]);
    box(b, 19, 28, 5, 3, pal[1]);
    if (f.has('fins')) tri(b, 4, 18, 10, 12, 10, 24, pal[2]);
    if (f.has('leaf')) { ell(b, 16, 8, 7, 4, pal[2]); box(b, 15, 11, 2, 4, pal[1]); }
  },
  reptile(b, pal, f) {
    ell(b, 15, 21, 11, 6, pal[0]);
    ell(b, 24, 17, 6, 5, pal[0]);
    tri(b, 4, 21, 12, 16, 12, 25, pal[0]);
    box(b, 8, 25, 3, 5, pal[1]); box(b, 13, 25, 3, 5, pal[1]);
    box(b, 19, 25, 3, 5, pal[1]); box(b, 23, 25, 3, 5, pal[1]);
    if (f.has('spikes')) { for (let i = 0; i < 4; i++) tri(b, 8 + i * 5, 15, 11 + i * 5, 9, 13 + i * 5, 15, pal[2]); }
    if (f.has('flame')) flame(b, 24, 11, pal);
    if (f.has('horns')) { tri(b, 21, 12, 19, 4, 23, 11, pal[2]); tri(b, 27, 12, 29, 4, 25, 11, pal[2]); }
  },
  fox(b, pal, f) {
    ell(b, 15, 21, 10, 6, pal[0]);
    ell(b, 23, 14, 6, 6, pal[0]);
    tri(b, 19, 9, 17, 2, 23, 8, pal[0]);
    tri(b, 26, 9, 29, 2, 24, 8, pal[0]);
    ell(b, 5, 20, 7, 5, pal[0]);
    box(b, 10, 25, 3, 5, pal[1]); box(b, 17, 25, 3, 5, pal[1]);
    box(b, 21, 25, 3, 5, pal[1]);
    if (f.has('leaf')) ell(b, 23, 7, 5, 3, pal[2]);
    if (f.has('glow')) ell(b, 23, 14, 2, 2, pal[3]);
    if (f.has('antennae')) { line(b, 21, 8, 18, 2, pal[2]); line(b, 26, 8, 29, 2, pal[2]); }
  },
  canine(b, pal, f) {
    ell(b, 15, 21, 11, 7, pal[0]);
    ell(b, 23, 14, 6, 6, pal[0]);
    box(b, 26, 15, 4, 3, pal[0]);
    tri(b, 4, 22, 12, 17, 12, 26, pal[0]);
    box(b, 9, 26, 3, 4, pal[1]); box(b, 16, 26, 3, 4, pal[1]);
    box(b, 21, 25, 3, 5, pal[1]);
    if (f.has('horns')) { tri(b, 20, 9, 17, 3, 23, 8, pal[2]); tri(b, 27, 9, 30, 3, 24, 8, pal[2]); }
    if (f.has('spikes')) { for (let i = 0; i < 4; i++) tri(b, 8 + i * 5, 16, 11 + i * 5, 11, 14 + i * 5, 16, pal[2]); }
    if (f.has('leaf')) ell(b, 14, 12, 6, 3, pal[2]);
  },
  amphibian(b, pal, f) {
    ell(b, 16, 23, 12, 8, pal[0]);
    ell(b, 16, 12, 10, 8, pal[0]);
    box(b, 6, 28, 5, 3, pal[1]); box(b, 22, 28, 5, 3, pal[1]);
    if (f.has('fins')) { tri(b, 4, 20, 10, 15, 10, 25, pal[2]); tri(b, 28, 20, 22, 15, 22, 25, pal[2]); }
    if (f.has('glow')) ell(b, 16, 24, 5, 4, pal[3]);
  },
  fish(b, pal, f) {
    ell(b, 16, 16, 8, 11, pal[0]);
    tri(b, 16, 27, 10, 20, 22, 20, pal[0]);
    tri(b, 16, 5, 12, 10, 20, 10, pal[0]);
    if (f.has('fins')) { tri(b, 5, 16, 10, 12, 10, 20, pal[2]); tri(b, 27, 16, 22, 12, 22, 20, pal[2]); }
    if (f.has('crystal')) tri(b, 16, 3, 12, 8, 20, 8, pal[3]);
  },
  bird(b, pal, f) {
    ell(b, 16, 19, 9, 10, pal[0]);
    ell(b, 16, 8, 7, 6, pal[0]);
    tri(b, 22, 8, 28, 9, 22, 11, pal[2]);
    box(b, 13, 28, 4, 3, pal[1]); box(b, 17, 28, 4, 3, pal[1]);
    if (f.has('wings')) { ell(b, 6, 17, 5, 8, pal[1]); ell(b, 26, 17, 5, 8, pal[1]); ell(b, 6, 16, 3, 5, pal[2]); }
    if (f.has('flower')) ell(b, 16, 1, 4, 3, pal[3]);
    if (f.has('horns')) { tri(b, 12, 3, 10, 0, 15, 3, pal[2]); tri(b, 20, 3, 22, 0, 17, 3, pal[2]); }
  },
  insect(b, pal, f) {
    ell(b, 16, 20, 7, 9, pal[0]);
    ell(b, 16, 12, 6, 6, pal[0]);
    ell(b, 16, 27, 5, 5, pal[1]);
    line(b, 12, 7, 9, 2, pal[1]); line(b, 20, 7, 23, 2, pal[1]);
    if (f.has('wings')) { ell(b, 6, 15, 5, 7, pal[1]); ell(b, 26, 15, 5, 7, pal[1]); ell(b, 6, 14, 3, 4, pal[2]); ell(b, 26, 14, 3, 4, pal[2]); }
    if (f.has('spikes')) { for (let i = 0; i < 3; i++) tri(b, 12 + i * 4, 15, 14 + i * 4, 10, 16 + i * 4, 15, pal[2]); }
    if (f.has('flame')) flame(b, 16, 6, pal);
  },
  moth(b, pal, f) {
    ell(b, 16, 17, 4, 10, pal[0]);
    ell(b, 16, 8, 4, 4, pal[0]);
    ell(b, 7, 13, 8, 10, pal[1]); ell(b, 25, 13, 8, 10, pal[1]);
    ell(b, 8, 22, 6, 7, pal[1]); ell(b, 24, 22, 6, 7, pal[1]);
    ell(b, 6, 11, 4, 5, pal[2]); ell(b, 26, 11, 4, 5, pal[2]);
    line(b, 13, 5, 10, 1, pal[2]); line(b, 19, 5, 22, 1, pal[2]);
    if (f.has('spots')) { ell(b, 6, 14, 2, 3, pal[3]); ell(b, 26, 14, 2, 3, pal[3]); ell(b, 7, 23, 2, 2, pal[3]); ell(b, 25, 23, 2, 2, pal[3]); }
    if (f.has('glow')) ell(b, 16, 18, 2, 4, pal[3]);
  },
  golem(b, pal, f) {
    box(b, 8, 10, 17, 16, pal[0]);
    box(b, 5, 13, 4, 11, pal[1]);
    box(b, 24, 13, 4, 11, pal[1]);
    box(b, 10, 26, 5, 5, pal[1]); box(b, 18, 26, 5, 5, pal[1]);
    box(b, 12, 13, 9, 6, pal[1]);
    if (f.has('spikes')) { for (let i = 0; i < 4; i++) tri(b, 9 + i * 4, 10, 11 + i * 4, 5, 14 + i * 4, 10, pal[2]); }
    if (f.has('shell')) box(b, 9, 8, 15, 4, pal[2]);
    if (f.has('leaf')) ell(b, 16, 6, 6, 3, pal[2]);
  },
  crab(b, pal, f) {
    ell(b, 16, 18, 12, 8, pal[0]);
    box(b, 3, 12, 6, 6, pal[0]); box(b, 24, 12, 6, 6, pal[0]);
    box(b, 5, 18, 3, 3, pal[1]); box(b, 26, 18, 3, 3, pal[1]);
    for (let i = 0; i < 3; i++) { box(b, 6 + i * 2, 24 + i * 2, 3, 3, pal[1]); box(b, 24 - i * 2, 24 + i * 2, 3, 3, pal[1]); }
    if (f.has('shell')) ell(b, 16, 15, 9, 6, pal[2]);
    if (f.has('spikes')) { for (let i = 0; i < 3; i++) tri(b, 11 + i * 5, 12, 13 + i * 5, 7, 16 + i * 5, 12, pal[2]); }
  },
  dragon(b, pal, f) {
    ell(b, 15, 20, 11, 8, pal[0]);
    ell(b, 24, 12, 6, 6, pal[0]);
    tri(b, 3, 22, 13, 16, 13, 27, pal[0]);
    box(b, 9, 26, 4, 5, pal[1]); box(b, 18, 26, 4, 5, pal[1]);
    if (f.has('wings')) {
      tri(b, 12, 12, 1, 4, 10, 20, pal[1]);
      tri(b, 20, 12, 31, 4, 22, 20, pal[1]);
      tri(b, 12, 12, 4, 7, 11, 18, pal[2]);
      tri(b, 20, 12, 28, 7, 21, 18, pal[2]);
    }
    if (f.has('horns')) { tri(b, 20, 7, 17, 1, 23, 6, pal[2]); tri(b, 28, 7, 31, 1, 25, 6, pal[2]); }
    if (f.has('spikes')) { for (let i = 0; i < 5; i++) tri(b, 6 + i * 5, 14, 8 + i * 5, 8, 11 + i * 5, 14, pal[2]); }
    if (f.has('flame')) flame(b, 24, 6, pal);
  }
};

function eyePositions(arch) {
  switch (arch) {
    case 'reptile': return [[22, 15, 3, 3], [27, 15, 3, 3]];
    case 'fox': return [[21, 12, 3, 3], [26, 12, 3, 3]];
    case 'canine': return [[21, 12, 3, 3], [26, 12, 3, 3]];
    case 'fish': return [[13, 11, 3, 3], [19, 11, 3, 3]];
    case 'bird': return [[13, 7, 3, 3], [18, 7, 3, 3]];
    case 'insect': return [[13, 11, 3, 3], [18, 11, 3, 3]];
    case 'moth': return [[14, 7, 3, 3], [18, 7, 3, 3]];
    case 'golem': return [[12, 14, 4, 4], [20, 14, 4, 4]];
    case 'crab': return [[12, 15, 3, 3], [18, 15, 3, 3]];
    case 'dragon': return [[22, 10, 3, 3], [27, 10, 3, 3]];
    case 'amphibian': return [[10, 9, 4, 4], [18, 9, 4, 4]];
    default: return [[11, 16, 4, 4], [18, 16, 4, 4]];
  }
}

function newCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  return { cv, c };
}

const creatureCache = new Map();
const charCache = new Map();
const objectCache = new Map();

function toneMapFor(pal) {
  const map = new Map();
  map.set(pal[0], PAL.mid);
  map.set(pal[1], PAL.dark);
  map.set(pal[2], PAL.light);
  map.set(pal[3], PAL.pale);
  map.set(OUTLINE, PAL.dark);
  map.set('#f8f8f0', PAL.pale);
  map.set('#1a1420', PAL.dark);
  map.set('#ffffff', PAL.pale);
  return map;
}

function buildCreature(speciesId, back, scale) {
  const def = CREATURES[speciesId];
  const art = def.art || { arch: 'blob', pal: [PAL.mid, PAL.dark, PAL.light, PAL.pale], features: [] };
  const pal = art.pal;
  const f = new Set(art.features || []);
  const b = makeBuf(32, 32);
  (ARCH[art.arch] || ARCH.blob)(b, pal, f);
  if (!back) {
    for (const [ex, ey, ew, eh] of eyePositions(art.arch)) {
      box(b, ex, ey, ew, eh, '#f8f8f0');
      box(b, ex + (ew > 2 ? 1 : 0), ey + (eh > 2 ? 1 : 0), 1, eh > 2 ? 2 : 1, '#1a1420');
      px(b, ex, ey, '#ffffff');
    }
  } else {
    for (const [ex, ey, ew, eh] of eyePositions(art.arch)) {
      for (let y = ey; y < ey + eh; y++) for (let x = ex; x < ex + ew; x++) px(b, x, y, pal[0]);
    }
  }
  if (f.has('spots')) {
    for (const [sx, sy] of [[10, 24], [22, 25], [12, 17], [21, 18], [16, 28]]) box(b, sx, sy, 2, 2, pal[3]);
  }
  if (f.has('flower')) ell(b, 24, 6, 3, 3, pal[3]);
  if (f.has('crystal')) tri(b, 8, 8, 5, 2, 11, 8, pal[3]);
  if (f.has('shell')) ell(b, 16, 20, 8, 5, pal[2]);
  shadeAndOutline(b, pal);

  const tones = toneMapFor(pal);
  const { cv, c } = newCanvas(32 * scale, 32 * scale);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const col = b.d[y * 32 + x];
      if (!col) continue;
      c.fillStyle = tones.get(col) || PAL.mid;
      c.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

/** Draw a creature centred on (cx, cy). Scale 2 => 64x64 pixels. */
export function drawCreature(r, cx, cy, speciesId, opts = {}) {
  if (!CREATURES[speciesId]) return;
  const scale = Math.max(1, Math.min(4, opts.scale || 2));
  const back = !!opts.back;
  const key = `${speciesId}:${back ? 1 : 0}:${scale}`;
  let cv = creatureCache.get(key);
  if (!cv) {
    cv = buildCreature(speciesId, back, scale);
    creatureCache.set(key, cv);
  }
  r.sprite(cv, Math.round(cx - 16 * scale), Math.round(cy - 16 * scale));
}

// ---------------------------------------------------------------------------
// People. The palettes are already expressed in DMG tones.
// ---------------------------------------------------------------------------
const CHAR_PALETTES = {
  player: { skin: PAL.pale, skinS: PAL.light, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  mom: { skin: PAL.pale, skinS: PAL.light, hair: PAL.mid, hairS: PAL.dark, shirt: PAL.light, shirtS: PAL.mid, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.pale },
  nurse: { skin: PAL.pale, skinS: PAL.light, hair: PAL.mid, hairS: PAL.dark, shirt: PAL.pale, shirtS: PAL.light, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.dark },
  vale: { skin: PAL.light, skinS: PAL.mid, hair: PAL.pale, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  mira: { skin: PAL.pale, skinS: PAL.light, hair: PAL.mid, hairS: PAL.dark, shirt: PAL.pale, shirtS: PAL.light, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.dark },
  orin: { skin: PAL.light, skinS: PAL.mid, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  selene: { skin: PAL.pale, skinS: PAL.light, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.dark, shirtS: PAL.mid, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.pale },
  rowan: { skin: PAL.light, skinS: PAL.mid, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.dark, shirtS: PAL.mid, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  elder: { skin: PAL.light, skinS: PAL.mid, hair: PAL.pale, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  archivist: { skin: PAL.pale, skinS: PAL.light, hair: PAL.light, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  girl: { skin: PAL.pale, skinS: PAL.light, hair: PAL.light, hairS: PAL.mid, shirt: PAL.pale, shirtS: PAL.light, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.dark },
  fisher: { skin: PAL.light, skinS: PAL.mid, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  shopkeep: { skin: PAL.light, skinS: PAL.mid, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.light, shirtS: PAL.mid, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.pale },
  innkeep: { skin: PAL.pale, skinS: PAL.light, hair: PAL.mid, hairS: PAL.dark, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  merchant: { skin: PAL.light, skinS: PAL.mid, hair: PAL.dark, hairS: PAL.mid, shirt: PAL.mid, shirtS: PAL.dark, pants: PAL.dark, pantsS: PAL.mid, accent: PAL.pale },
  boy: { skin: PAL.pale, skinS: PAL.light, hair: PAL.mid, hairS: PAL.dark, shirt: PAL.light, shirtS: PAL.mid, pants: PAL.mid, pantsS: PAL.dark, accent: PAL.dark }
};

/**
 * Front/back legs. Both feet stay on the ground line (y=18), while the stance
 * shifts sideways on the two walk frames. This reads as a step without the
 * detached feet the old single-pixel shoes produced.
 */
function drawFrontLegs(b, pal, step) {
  const shoe = PAL.dark;
  if (step === 1) {
    box(b, 4, 16, 3, 2, pal.pantsS);
    box(b, 8, 16, 3, 2, pal.pants);
    box(b, 3, 18, 4, 1, shoe);
    box(b, 8, 18, 4, 1, shoe);
  } else if (step === 2) {
    box(b, 5, 16, 3, 2, pal.pants);
    box(b, 9, 16, 3, 2, pal.pantsS);
    box(b, 5, 18, 4, 1, shoe);
    box(b, 9, 18, 4, 1, shoe);
  } else {
    box(b, 5, 16, 3, 2, pal.pants);
    box(b, 8, 16, 3, 2, pal.pantsS);
    box(b, 5, 18, 3, 1, shoe);
    box(b, 8, 18, 3, 1, shoe);
  }
}

/** Shared front/back torso, with the back view differentiated by a seam. */
function drawFrontTorso(b, pal, back) {
  // Arms sit behind the torso so only the sleeves and hands show.
  box(b, 2, 10, 2, 5, pal.shirtS);
  box(b, 12, 10, 2, 5, pal.shirtS);
  box(b, 2, 14, 2, 2, pal.skin);
  box(b, 12, 14, 2, 2, pal.skin);

  box(b, 4, 9, 8, 6, pal.shirt);
  box(b, 4, 9, 8, 1, pal.shirtS);
  box(b, 4, 14, 8, 1, pal.shirtS);
  box(b, 4, 15, 8, 1, pal.pantsS);
  box(b, 7, 15, 2, 1, PAL.pale);

  // Neck and collar keep pale skin from blending into pale clothing.
  box(b, 7, 8, 2, 1, pal.skinS);
  box(b, 6, 9, 4, 1, pal.shirtS);

  if (back) {
    box(b, 7, 10, 2, 4, pal.shirtS);
  } else {
    box(b, 4, 10, 1, 4, pal.shirtS);
    box(b, 11, 10, 1, 4, pal.shirtS);
  }
}

function drawFrontHead(b, pal, back) {
  const eye = PAL.dark;
  box(b, 5, 1, 6, 1, pal.hair);
  box(b, 4, 2, 8, 3, pal.hair);
  box(b, 5, 2, 6, 1, pal.hairS);

  if (back) {
    box(b, 4, 5, 8, 4, pal.hair);
    box(b, 5, 4, 6, 1, pal.hairS);
    box(b, 4, 7, 2, 1, pal.hairS);
    box(b, 10, 7, 2, 1, pal.hairS);
    return;
  }

  if (pal.hair === PAL.pale || pal.hair === PAL.light) {
    // A darker hairline keeps white/light hair from disappearing into pale skin.
    box(b, 4, 4, 8, 1, pal.hairS);
  }
  box(b, 4, 5, 1, 2, pal.hair);
  box(b, 11, 5, 1, 2, pal.hair);
  box(b, 5, 5, 6, 3, pal.skin);
  box(b, 6, 8, 4, 1, pal.skin);
  box(b, 6, 6, 1, 2, eye);
  box(b, 9, 6, 1, 2, eye);
  box(b, 7, 8, 2, 1, pal.skinS);
  box(b, 5, 7, 1, 1, pal.skinS);
}

function drawSideTorso(b, pal) {
  // Back arm, torso, then the near arm. The near arm is one pixel wider so the
  // body keeps a readable profile silhouette.
  box(b, 3, 10, 2, 5, pal.shirtS);
  box(b, 3, 14, 2, 2, pal.skin);

  box(b, 12, 10, 2, 5, pal.shirtS);
  box(b, 12, 14, 2, 2, pal.skin);

  box(b, 5, 9, 7, 6, pal.shirt);
  box(b, 5, 9, 7, 1, pal.shirtS);
  box(b, 5, 14, 7, 1, pal.shirtS);
  box(b, 5, 15, 7, 1, pal.pantsS);
  box(b, 8, 15, 2, 1, PAL.pale);

  box(b, 5, 10, 1, 4, pal.shirtS);
  box(b, 11, 10, 1, 3, pal.shirtS);
  box(b, 9, 8, 2, 1, pal.skinS);
}

function drawSideHead(b, pal) {
  const eye = PAL.dark;
  box(b, 6, 1, 6, 1, pal.hair);
  box(b, 4, 2, 8, 3, pal.hair);
  box(b, 5, 2, 5, 1, pal.hairS);
  if (pal.hair === PAL.pale || pal.hair === PAL.light) {
    box(b, 4, 4, 8, 1, pal.hairS);
  }
  box(b, 4, 5, 2, 2, pal.hair);

  box(b, 6, 5, 7, 3, pal.skin);
  box(b, 6, 8, 5, 1, pal.skin);
  box(b, 6, 5, 1, 3, pal.skinS);
  box(b, 10, 5, 1, 2, eye);
  box(b, 13, 6, 1, 2, pal.skin);
  box(b, 13, 7, 1, 1, pal.skinS);
  box(b, 10, 8, 2, 1, pal.skinS);
}

function drawSideLegs(b, pal, step) {
  const shoe = PAL.dark;
  if (step === 1) {
    box(b, 5, 16, 3, 2, pal.pantsS);
    box(b, 9, 16, 2, 2, pal.pants);
    box(b, 4, 18, 5, 1, shoe);
    box(b, 9, 18, 4, 1, shoe);
  } else if (step === 2) {
    box(b, 5, 16, 2, 2, pal.pantsS);
    box(b, 9, 16, 3, 2, pal.pants);
    box(b, 4, 18, 4, 1, shoe);
    box(b, 8, 18, 4, 1, shoe);
  } else {
    box(b, 5, 16, 3, 2, pal.pantsS);
    box(b, 9, 16, 3, 2, pal.pants);
    box(b, 4, 18, 4, 1, shoe);
    box(b, 9, 18, 4, 1, shoe);
  }
}

/**
 * Build the 16x20 character at its native orientation. Side views are authored
 * facing right and mirrored as a complete bitmap for the left view. Mirroring
 * individual boxes with `15 - x` was the old bug: it ignored each box's width,
 * shifting parts by several pixels and clipping them at the sprite edge.
 */
function drawCharBuffer(b, pal, dir, frame) {
  const step = frame === 1 ? 1 : frame === 2 ? 2 : 0;

  if (dir === 'left') {
    const right = makeBuf(b.w, b.h);
    drawCharBuffer(right, pal, 'right', frame);
    for (let y = 0; y < b.h; y++) {
      for (let x = 0; x < b.w; x++) {
        b.d[y * b.w + x] = right.d[y * b.w + (b.w - 1 - x)];
      }
    }
    return;
  }

  if (dir === 'right') {
    drawSideHead(b, pal);
    drawSideTorso(b, pal);
    drawSideLegs(b, pal, step);
    return;
  }

  const back = dir === 'up';
  drawFrontHead(b, pal, back);
  drawFrontTorso(b, pal, back);
  drawFrontLegs(b, pal, step);
}

export const CHARACTER_IDS = Object.freeze(Object.keys(CHAR_PALETTES));

/**
 * Pure pixel buffer for tests and tooling. Left is generated by mirroring the
 * finished right-facing bitmap, so the two facings are exact mirrors by
 * construction rather than per-part coordinate arithmetic.
 */
export function characterPixels(spriteId, dir, frame) {
  const pal = CHAR_PALETTES[spriteId] || CHAR_PALETTES.player;
  const b = makeBuf(16, 20);
  drawCharBuffer(b, pal, dir, frame);
  const edge = [];
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (at(b, x, y)) continue;
      if (at(b, x + 1, y) || at(b, x - 1, y) || at(b, x, y + 1) || at(b, x, y - 1)) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) px(b, x, y, OUTLINE);
  return b;
}

function buildChar(spriteId, dir, frame, scale) {
  const b = characterPixels(spriteId, dir, frame);
  const { cv, c } = newCanvas(16 * scale, 20 * scale);
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      const col = b.d[y * b.w + x];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return cv;
}

/** Draw a person. (cx, cyBottom) is the bottom-centre anchor. */
export function drawCharacter(r, cx, cyBottom, spriteId, dir = 'down', frame = 0, scale = 1) {
  const key = `${spriteId}:${dir}:${frame}:${scale}`;
  let cv = charCache.get(key);
  if (!cv) {
    cv = buildChar(spriteId, dir, frame, scale);
    charCache.set(key, cv);
  }
  r.sprite(cv, Math.round(cx - 8 * scale), Math.round(cyBottom - 20 * scale));
}

export function charPalette(spriteId) { return CHAR_PALETTES[spriteId] || CHAR_PALETTES.player; }

// ---------------------------------------------------------------------------
// Small map objects that are not people.
// ---------------------------------------------------------------------------
const OBJECT_SPRITES = new Set(['item', 'altar', 'pc']);

function buildObject(type) {
  const { cv, c } = newCanvas(16, 16);
  const fill = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  if (type === 'item') {
    fill(4, 4, 8, 8, PAL.dark);
    fill(5, 4, 6, 6, PAL.mid);
    fill(5, 5, 6, 3, PAL.light);
    fill(6, 4, 1, 6, PAL.pale);
    fill(4, 11, 8, 1, PAL.dark);
    fill(7, 2, 2, 2, PAL.dark);
    fill(7, 3, 2, 1, PAL.light);
  } else if (type === 'altar') {
    fill(2, 5, 12, 9, PAL.dark);
    fill(3, 4, 10, 8, PAL.mid);
    fill(4, 3, 8, 3, PAL.light);
    fill(6, 5, 4, 1, PAL.dark);
    fill(7, 6, 1, 5, PAL.dark);
    fill(5, 8, 2, 1, PAL.dark);
    fill(9, 10, 2, 1, PAL.dark);
    fill(3, 13, 10, 1, PAL.dark);
  } else if (type === 'pc') {
    fill(2, 3, 12, 10, PAL.dark);
    fill(3, 4, 10, 7, PAL.mid);
    fill(4, 5, 8, 4, PAL.pale);
    fill(5, 6, 6, 1, PAL.mid);
    fill(5, 7, 4, 1, PAL.mid);
    fill(5, 12, 6, 2, PAL.dark);
    fill(6, 11, 4, 1, PAL.light);
  }
  return cv;
}

export function drawObject(r, type, x, y) {
  if (!OBJECT_SPRITES.has(type)) return;
  let cv = objectCache.get(type);
  if (!cv) { cv = buildObject(type); objectCache.set(type, cv); }
  r.sprite(cv, x, y);
}

export function isObjectSprite(type) { return OBJECT_SPRITES.has(type); }

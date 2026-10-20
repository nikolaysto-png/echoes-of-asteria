import { TILE, PAL } from '../core/constants.js';

// Every tile is 16x16 and uses only the four DMG-green shades.
const P = PAL;

function offscreen(w = TILE, h = TILE) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  return { cv, c };
}

const cache = new Map();

function tileCanvas(key, draw) {
  if (cache.has(key)) return cache.get(key);
  const { cv, c } = offscreen();
  draw(c);
  cache.set(key, cv);
  return cv;
}

function fill(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function dot(c, x, y, color) {
  c.fillStyle = color;
  c.fillRect(x, y, 1, 1);
}

function dots(c, list, color) {
  c.fillStyle = color;
  for (const [x, y] of list) c.fillRect(x, y, 1, 1);
}

export const TILE_NAMES = {
  '.': 'grass', ',': 'tallgrass', '#': 'path', '~': 'water', 'T': 'tree', 'F': 'rock',
  'W': 'wall', '^': 'wood', ':': 'floor', 'D': 'door', 'B': 'building', 'R': 'roof',
  'S': 'sand', 'A': 'arena', 'P': 'pillar', 'C': 'cave', 'M': 'cavewall', '=': 'counter',
  '*': 'flowers', 'H': 'sign', 'X': 'void', '<': 'stairs', 'L': 'ledge', 'O': 'wateredge',
  'G': 'gate', 'V': 'grave'
};

export const SOLID_CHARS = new Set(['T', 'F', 'W', 'B', 'R', '~', 'P', 'M', '=', 'X', 'H', 'V', 'G']);
export const WATER_CHARS = new Set(['~', 'O']);

function grassBase(c, alternate = false) {
  fill(c, 0, 0, 16, 16, P.pale);
  const marks = alternate
    ? [[2, 4], [10, 2], [6, 11], [13, 8], [3, 14]]
    : [[3, 3], [12, 6], [8, 13], [1, 10], [14, 14]];
  dots(c, marks, P.light);
  dots(c, [[5, 7], [11, 12]], P.mid);
}

function drawGrass(c) {
  grassBase(c, false);
}

function drawTallGrass(c) {
  grassBase(c, true);
  const blades = [
    [2, 9, 4], [5, 6, 6], [8, 10, 5], [11, 7, 7], [14, 11, 4],
    [3, 13, 3], [7, 14, 2], [10, 14, 4], [13, 15, 2]
  ];
  for (const [x, y, h] of blades) {
    fill(c, x, y - h, 1, h, P.dark);
    dot(c, x - 1, y - h + 1, P.mid);
  }
  fill(c, 0, 14, 16, 2, P.mid);
}

function drawPath(c) {
  fill(c, 0, 0, 16, 16, P.light);
  const stones = [[1, 2, 5, 3], [8, 1, 6, 4], [2, 7, 7, 4], [10, 8, 5, 3], [4, 12, 9, 3]];
  for (const [x, y, w, h] of stones) {
    fill(c, x, y, w, h, P.pale);
    fill(c, x, y + h - 1, w, 1, P.mid);
  }
}

function drawWater(c, frame = 0) {
  fill(c, 0, 0, 16, 16, P.mid);
  fill(c, 0, 0, 16, 1, P.dark);
  const waves = frame % 2 === 0
    ? [[1, 5, 4], [8, 9, 5], [4, 13, 3], [11, 2, 3]]
    : [[4, 4, 4], [1, 10, 4], [9, 13, 4], [12, 6, 2]];
  for (const [x, y, w] of waves) {
    fill(c, x, y, w, 1, P.light);
    fill(c, x + 1, y + 1, Math.max(1, w - 2), 1, P.pale);
  }
}

function drawTree(c) {
  grassBase(c, false);
  fill(c, 7, 12, 3, 4, P.dark);
  fill(c, 3, 6, 10, 7, P.mid);
  fill(c, 2, 8, 12, 4, P.mid);
  fill(c, 5, 4, 7, 7, P.light);
  fill(c, 4, 7, 4, 3, P.light);
  fill(c, 10, 7, 3, 3, P.light);
  dots(c, [[7, 5], [11, 6], [5, 10], [9, 11]], P.mid);
  fill(c, 12, 10, 2, 2, P.dark);
}

function drawRock(c) {
  grassBase(c, true);
  fill(c, 3, 6, 10, 8, P.mid);
  fill(c, 5, 4, 7, 3, P.light);
  fill(c, 2, 9, 3, 4, P.mid);
  fill(c, 11, 8, 3, 5, P.dark);
  fill(c, 4, 6, 3, 2, P.pale);
  dot(c, 8, 11, P.dark);
}

function drawWall(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 0, 0, 16, 2, P.mid);
  fill(c, 0, 7, 16, 1, P.mid);
  fill(c, 0, 14, 16, 2, P.mid);
  fill(c, 4, 2, 1, 5, P.mid);
  fill(c, 11, 3, 1, 4, P.mid);
  fill(c, 7, 8, 1, 6, P.mid);
  fill(c, 13, 10, 1, 4, P.mid);
}

function drawWood(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 0, 4, 16, 1, P.mid);
  fill(c, 0, 10, 16, 1, P.mid);
  fill(c, 5, 0, 1, 4, P.mid);
  fill(c, 11, 5, 1, 5, P.mid);
  fill(c, 3, 11, 1, 5, P.mid);
  fill(c, 8, 12, 1, 4, P.mid);
  dots(c, [[2, 2], [13, 7], [7, 13]], P.pale);
}

function drawFloor(c) {
  fill(c, 0, 0, 16, 16, P.pale);
  fill(c, 0, 0, 1, 16, P.light);
  fill(c, 0, 0, 16, 1, P.light);
  fill(c, 8, 0, 1, 8, P.light);
  fill(c, 0, 8, 8, 1, P.light);
}

function drawDoor(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 2, 1, 12, 15, P.dark);
  fill(c, 4, 3, 8, 13, P.mid);
  fill(c, 6, 4, 4, 7, P.light);
  fill(c, 10, 9, 1, 1, P.pale);
  fill(c, 0, 14, 16, 2, P.mid);
}

function drawBuilding(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 0, 0, 16, 2, P.mid);
  fill(c, 0, 14, 16, 2, P.mid);
  fill(c, 2, 3, 1, 10, P.mid);
  fill(c, 13, 3, 1, 10, P.mid);
  fill(c, 5, 5, 6, 5, P.mid);
  fill(c, 6, 6, 4, 3, P.pale);
  fill(c, 7, 6, 1, 3, P.mid);
  fill(c, 5, 12, 6, 2, P.mid);
}

function drawRoof(c) {
  fill(c, 0, 0, 16, 16, P.mid);
  for (let y = 2; y < 16; y += 4) {
    fill(c, 0, y, 16, 1, P.dark);
    fill(c, 0, y + 1, 16, 1, P.light);
  }
  for (let x = 3; x < 16; x += 7) fill(c, x, 0, 1, 16, P.dark);
  fill(c, 0, 0, 16, 2, P.dark);
}

function drawSand(c) {
  fill(c, 0, 0, 16, 16, P.light);
  dots(c, [[2, 3], [9, 5], [13, 9], [5, 12], [11, 14], [3, 8]], P.pale);
  dots(c, [[7, 2], [12, 4], [6, 9], [14, 13], [2, 14]], P.mid);
}

function drawArena(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 0, 0, 16, 1, P.pale);
  fill(c, 0, 15, 16, 1, P.mid);
  fill(c, 0, 0, 1, 16, P.pale);
  fill(c, 15, 0, 1, 16, P.mid);
  dots(c, [[4, 4], [11, 7], [6, 12]], P.mid);
}

function drawPillar(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 2, 0, 12, 16, P.mid);
  fill(c, 0, 1, 16, 3, P.dark);
  fill(c, 0, 12, 16, 3, P.dark);
  fill(c, 5, 5, 2, 7, P.light);
  fill(c, 9, 5, 2, 7, P.pale);
}

function drawCave(c) {
  fill(c, 0, 0, 16, 16, P.mid);
  dots(c, [[2, 3], [9, 6], [13, 12], [5, 13]], P.dark);
  dots(c, [[7, 2], [12, 8], [3, 9], [10, 14]], P.light);
  fill(c, 0, 0, 16, 1, P.dark);
}

function drawCaveWall(c) {
  fill(c, 0, 0, 16, 16, P.dark);
  fill(c, 0, 0, 16, 3, P.mid);
  fill(c, 0, 12, 16, 4, P.mid);
  fill(c, 2, 5, 5, 5, P.mid);
  fill(c, 9, 4, 5, 6, P.mid);
  fill(c, 3, 5, 3, 2, P.light);
  fill(c, 10, 5, 2, 2, P.light);
  dot(c, 7, 8, P.dark);
}

function drawCounter(c) {
  fill(c, 0, 0, 16, 16, P.pale);
  fill(c, 0, 2, 16, 10, P.mid);
  fill(c, 0, 2, 16, 2, P.light);
  fill(c, 0, 11, 16, 2, P.dark);
  fill(c, 2, 5, 5, 4, P.light);
  fill(c, 9, 5, 4, 4, P.light);
  fill(c, 3, 6, 3, 2, P.pale);
  fill(c, 10, 6, 2, 2, P.pale);
}

function drawFlowers(c) {
  grassBase(c, false);
  const flowers = [[4, 5], [11, 4], [8, 10], [3, 12], [13, 11]];
  for (const [x, y] of flowers) {
    fill(c, x - 1, y, 3, 1, P.light);
    fill(c, x, y - 1, 1, 3, P.light);
    dot(c, x, y, P.mid);
  }
}

function drawSign(c) {
  grassBase(c, true);
  fill(c, 7, 8, 2, 7, P.dark);
  fill(c, 2, 4, 12, 6, P.light);
  fill(c, 2, 4, 12, 1, P.mid);
  fill(c, 2, 9, 12, 1, P.mid);
  fill(c, 4, 6, 8, 1, P.mid);
  fill(c, 4, 8, 5, 1, P.mid);
}

function drawStairs(c) {
  fill(c, 0, 0, 16, 16, P.mid);
  for (let y = 0; y < 16; y += 4) {
    fill(c, 0, y, 16, 2, P.light);
    fill(c, 0, y + 2, 16, 2, P.dark);
  }
}

function drawLedge(c) {
  grassBase(c, false);
  fill(c, 0, 8, 16, 8, P.mid);
  fill(c, 0, 8, 16, 3, P.light);
  fill(c, 0, 11, 16, 1, P.dark);
}

function drawWaterEdge(c, frame = 0) {
  grassBase(c, false);
  fill(c, 0, 13, 16, 3, P.mid);
  fill(c, 0, 14, 16, 1, P.light);
  const off = frame % 2;
  fill(c, 2 + off, 14, 4, 1, P.pale);
  fill(c, 10 - off, 13, 4, 1, P.pale);
}

function drawGate(c) {
  fill(c, 0, 0, 16, 16, P.light);
  fill(c, 2, 2, 12, 13, P.dark);
  fill(c, 4, 4, 8, 11, P.mid);
  fill(c, 5, 5, 2, 10, P.light);
  fill(c, 9, 5, 2, 10, P.light);
  fill(c, 6, 11, 4, 1, P.pale);
}

function drawGrave(c) {
  grassBase(c, false);
  fill(c, 4, 5, 8, 9, P.light);
  fill(c, 4, 4, 8, 3, P.light);
  fill(c, 6, 7, 4, 1, P.dark);
  fill(c, 6, 9, 3, 1, P.mid);
  fill(c, 4, 13, 8, 1, P.mid);
  fill(c, 7, 8, 1, 4, P.mid);
}

function drawVoid(c) {
  fill(c, 0, 0, 16, 16, P.dark);
  dots(c, [[2, 3], [9, 7], [14, 2], [5, 13], [12, 12]], P.mid);
}

const DRAWERS = {
  '.': drawGrass,
  ',': drawTallGrass,
  '#': drawPath,
  '~': (c, f) => drawWater(c, f),
  'T': drawTree,
  'F': drawRock,
  'W': drawWall,
  '^': drawWood,
  ':': drawFloor,
  'D': drawDoor,
  'B': drawBuilding,
  'R': drawRoof,
  'S': drawSand,
  'A': drawArena,
  'P': drawPillar,
  'C': drawCave,
  'M': drawCaveWall,
  '=': drawCounter,
  '*': drawFlowers,
  'H': drawSign,
  'X': drawVoid,
  '<': drawStairs,
  'L': drawLedge,
  'O': (c, f) => drawWaterEdge(c, f),
  'G': drawGate,
  'V': drawGrave
};

export function drawTile(r, ch, px, py, animFrame = 0) {
  const fn = DRAWERS[ch] || DRAWERS['.'];
  const animated = ch === '~' || ch === 'O';
  const key = (animated ? 'f' + (animFrame % 2) : 's') + ch;
  const cv = tileCanvas(key, c => fn(c, animFrame));
  r.sprite(cv, px, py);
}

export function tileAt(map, x, y) {
  if (!map || !map.tiles[y]) return 'X';
  return map.tiles[y][x] ?? 'X';
}

export function isSolidTile(ch) {
  return SOLID_CHARS.has(ch);
}

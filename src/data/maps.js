import { SCRIPTS } from './story.js';

// ---------------------------------------------------------------- builders
const g = (w, h, fill = '.') => Array.from({ length: h }, () => Array(w).fill(fill));
const set = (grid, x, y, ch) => { if (grid[y] && grid[y][x] != null) grid[y][x] = ch; };
const rect = (grid, x, y, w, h, ch) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(grid, x + i, y + j, ch); };
const border = (grid, ch = 'T') => {
  const h = grid.length, w = grid[0].length;
  for (let x = 0; x < w; x++) { set(grid, x, 0, ch); set(grid, x, h - 1, ch); }
  for (let y = 0; y < h; y++) { set(grid, 0, y, ch); set(grid, w - 1, y, ch); }
};
const building = (grid, x, y, w, h, doorX) => {
  rect(grid, x, y, w, 3, 'R');
  rect(grid, x, y + 3, w, h - 3, 'B');
  set(grid, doorX, y + h - 1, 'D');
};
const tree = (grid, x, y) => set(grid, x, y, 'T');
const treeLine = (grid, x, y, n) => { for (let i = 0; i < n; i++) tree(grid, x + i, y); };
const flowers = (grid, x, y, w, h) => rect(grid, x, y, w, h, '*');
const tall = (grid, x, y, w, h) => rect(grid, x, y, w, h, ',');
const rows = grid => grid.map(r => r.join(''));

// ---------------------------------------------------------------- interiors
const home = g(12, 9, '^');
border(home, 'W');
rect(home, 2, 2, 2, 1, 'B');
rect(home, 8, 2, 2, 1, 'B');
rect(home, 4, 4, 4, 1, '=');
flowers(home, 4, 6, 4, 1);
set(home, 6, 8, 'D');

const lab = g(14, 10, '^');
border(lab, 'W');
rect(lab, 2, 2, 2, 1, 'B');
rect(lab, 10, 2, 2, 1, 'B');
rect(lab, 4, 4, 6, 1, '=');
rect(lab, 4, 6, 6, 1, '=');
set(lab, 7, 9, 'D');

const clinic = g(12, 9, ':');
border(clinic, 'W');
rect(clinic, 2, 2, 3, 1, '=');
rect(clinic, 8, 2, 2, 1, '=');
flowers(clinic, 4, 6, 4, 1);
set(clinic, 6, 8, 'D');

const shop = g(12, 9, ':');
border(shop, 'W');
rect(shop, 2, 2, 6, 1, '=');
rect(shop, 2, 5, 2, 1, 'B');
rect(shop, 8, 5, 2, 1, 'B');
set(shop, 6, 8, 'D');

const arena = g(13, 11, 'A');
border(arena, 'W');
rect(arena, 3, 3, 1, 2, 'P');
rect(arena, 9, 3, 1, 2, 'P');
rect(arena, 2, 8, 9, 1, 'A');
set(arena, 6, 10, 'D');
set(arena, 6, 2, 'R');

const library = g(12, 9, '^');
border(library, 'W');
rect(library, 2, 2, 8, 1, 'B');
rect(library, 3, 4, 6, 1, '=');
set(library, 6, 8, 'D');

// ---------------------------------------------------------------- Lumen Bay
const bay = g(22, 18, '.');
border(bay, 'T');
building(bay, 4, 2, 5, 6, 6);     // home, door (6,7)
building(bay, 14, 2, 5, 6, 16);   // lab, door (16,7)
building(bay, 4, 10, 5, 5, 6);    // clinic, door (6,14)
building(bay, 14, 10, 5, 5, 16);  // shop, door (16,14)
rect(bay, 1, 8, 20, 2, '#');
rect(bay, 6, 8, 1, 7, '#');
rect(bay, 16, 8, 1, 7, '#');
rect(bay, 2, 15, 18, 1, '#');
rect(bay, 1, 16, 20, 1, 'S');
rect(bay, 1, 17, 20, 1, '~');
set(bay, 21, 8, '#');
set(bay, 21, 9, '#');
set(bay, 20, 8, '#');
set(bay, 20, 9, '#');
// garden and shoreline details
flowers(bay, 9, 5, 3, 2);
flowers(bay, 10, 11, 3, 2);
treeLine(bay, 11, 2, 2);
treeLine(bay, 2, 6, 1);
treeLine(bay, 19, 3, 1);
tree(bay, 18, 5); tree(bay, 2, 12); tree(bay, 19, 12);
set(bay, 12, 7, 'H');
set(bay, 20, 12, 'H');
set(bay, 3, 16, 'F'); set(bay, 18, 16, 'F');

// ---------------------------------------------------------------- Coast Road
const coast = g(26, 16, '.');
border(coast, 'T');
rect(coast, 1, 8, 24, 2, '#');
set(coast, 0, 8, '#'); set(coast, 0, 9, '#');
set(coast, 25, 8, '#'); set(coast, 25, 9, '#');
rect(coast, 1, 14, 24, 1, 'S');
rect(coast, 1, 15, 24, 1, '~');
tall(coast, 4, 3, 4, 3);
tall(coast, 11, 10, 4, 3);
tall(coast, 18, 3, 4, 3);
tall(coast, 21, 11, 3, 2);
set(coast, 8, 2, 'F'); set(coast, 9, 2, 'F'); set(coast, 9, 3, 'F');
set(coast, 15, 12, 'F'); set(coast, 16, 12, 'F');
set(coast, 22, 3, 'F');
treeLine(coast, 2, 2, 2);
treeLine(coast, 2, 5, 1);
treeLine(coast, 13, 2, 2);
treeLine(coast, 19, 13, 2);
treeLine(coast, 7, 12, 2);
set(coast, 5, 7, 'H');
set(coast, 23, 13, 'H');
flowers(coast, 12, 4, 2, 1);
flowers(coast, 3, 11, 2, 1);

// ---------------------------------------------------------------- Whisperwood
const wood = g(24, 18, '.');
border(wood, 'T');
rect(wood, 1, 8, 22, 2, '#');
set(wood, 0, 8, '#'); set(wood, 0, 9, '#');
set(wood, 23, 8, '#'); set(wood, 23, 9, '#');
rect(wood, 11, 1, 2, 8, '#');
tall(wood, 6, 3, 4, 3);
tall(wood, 16, 4, 4, 2);
tall(wood, 3, 12, 4, 3);
tall(wood, 17, 12, 3, 3);
tall(wood, 8, 14, 3, 2);
rect(wood, 1, 6, 8, 1, 'T');
rect(wood, 14, 6, 8, 1, 'T');
rect(wood, 1, 12, 1, 5, 'T');
rect(wood, 22, 12, 1, 5, 'T');
set(wood, 7, 2, 'F'); set(wood, 8, 2, 'F');
set(wood, 19, 2, 'F'); set(wood, 20, 2, 'F');
set(wood, 5, 6, 'F'); set(wood, 18, 6, 'F');
set(wood, 10, 7, 'H');
set(wood, 20, 14, 'F');
flowers(wood, 12, 5, 2, 1);
flowers(wood, 6, 10, 2, 1);
set(wood, 11, 1, 'C');
set(wood, 11, 0, 'C');

// ---------------------------------------------------------------- Tide Cave
const cave = g(20, 16, 'C');
border(cave, 'M');
rect(cave, 2, 2, 3, 2, 'M');
rect(cave, 15, 2, 3, 3, 'M');
rect(cave, 5, 5, 2, 5, 'M');
rect(cave, 12, 8, 3, 2, 'M');
rect(cave, 2, 11, 3, 2, 'M');
rect(cave, 15, 12, 3, 2, 'M');
set(cave, 10, 15, 'C');
set(cave, 10, 14, 'C');
set(cave, 10, 2, 'P');
set(cave, 4, 8, 'F'); set(cave, 16, 8, 'F');
set(cave, 9, 12, 'F');
set(cave, 7, 11, 'H');

// ---------------------------------------------------------------- Halvern
const halvern = g(22, 18, '.');
border(halvern, 'T');
building(halvern, 3, 2, 5, 6, 5);
building(halvern, 14, 2, 5, 6, 16);
rect(halvern, 1, 8, 20, 2, '#');
set(halvern, 0, 8, '#'); set(halvern, 0, 9, '#');
set(halvern, 21, 8, '#'); set(halvern, 21, 9, '#');
rect(halvern, 10, 8, 1, 6, '#'); // processional path to the Coiled Arena
set(halvern, 9, 12, 'P');
set(halvern, 11, 12, 'P');
rect(halvern, 2, 6, 3, 1, '*');
rect(halvern, 14, 9, 3, 1, '*');
treeLine(halvern, 2, 10, 1);
treeLine(halvern, 19, 3, 1);
tree(halvern, 19, 12); tree(halvern, 2, 14); tree(halvern, 19, 14);
set(halvern, 12, 7, 'H');
set(halvern, 18, 12, 'H');
set(halvern, 10, 13, 'D');
flowers(halvern, 11, 3, 2, 1);
flowers(halvern, 3, 15, 4, 1);

// ---------------------------------------------------------------- Emberfall
const emberfall = g(18, 14, '.');
border(emberfall, 'T');
building(emberfall, 6, 2, 7, 6, 9); // library
rect(emberfall, 1, 8, 16, 1, '#');
set(emberfall, 0, 8, '#');
rect(emberfall, 1, 12, 16, 1, 'S');
rect(emberfall, 1, 13, 16, 1, '~');
treeLine(emberfall, 2, 3, 1);
treeLine(emberfall, 15, 3, 1);
treeLine(emberfall, 2, 9, 2);
treeLine(emberfall, 13, 10, 2);
set(emberfall, 3, 11, 'F'); set(emberfall, 14, 11, 'F');
flowers(emberfall, 3, 5, 2, 2);
flowers(emberfall, 12, 5, 3, 1);
set(emberfall, 5, 9, 'H');

// ---------------------------------------------------------------- encounters
const encounters = {
  coast: {
    rate: 0.12,
    table: [
      { id: 'tidecrab', min: 3, max: 5, weight: 24 },
      { id: 'gustwing', min: 3, max: 6, weight: 24 },
      { id: 'pebbleton', min: 3, max: 5, weight: 20 },
      { id: 'leafkin', min: 4, max: 6, weight: 18 },
      { id: 'pufflet', min: 3, max: 6, weight: 14 }
    ]
  },
  wood: {
    rate: 0.14,
    table: [
      { id: 'leafkin', min: 5, max: 7, weight: 20 },
      { id: 'thornlet', min: 5, max: 8, weight: 18 },
      { id: 'sparkbit', min: 5, max: 7, weight: 16 },
      { id: 'shadowtail', min: 6, max: 8, weight: 16 },
      { id: 'venomite', min: 5, max: 7, weight: 14 },
      { id: 'bloomwing', min: 7, max: 9, weight: 8 },
      { id: 'gloommoth', min: 8, max: 10, weight: 8 }
    ]
  },
  cave: {
    rate: 0.16,
    table: [
      { id: 'stoneclaw', min: 8, max: 11, weight: 20 },
      { id: 'shellreef', min: 8, max: 10, weight: 16 },
      { id: 'frostnip', min: 8, max: 11, weight: 16 },
      { id: 'brawlfin', min: 9, max: 11, weight: 14 },
      { id: 'venomite', min: 8, max: 10, weight: 12 },
      { id: 'psyowl', min: 10, max: 12, weight: 10 },
      { id: 'drakeling', min: 10, max: 12, weight: 6 },
      { id: 'nocturne', min: 10, max: 12, weight: 6 }
    ]
  }
};

// ---------------------------------------------------------------- map records
export const MAPS = {
  home: {
    id: 'home', name: 'Your House', music: 'village', indoor: true,
    tiles: rows(home),
    warps: [{ x: 6, y: 8, to: 'lumen_bay', tx: 6, ty: 8, dir: 'down' }],
    events: [
      { id: 'mom', x: 8, y: 5, sprite: 'mom', name: 'Mara', dir: 'down', script: SCRIPTS.mom },
      { id: 'bed', x: 3, y: 2, sprite: null, solid: true, script: [{ say: ['Your bed, still warm. The tide charts on the wall have not changed since last night.'] }] },
      { id: 'desk', x: 9, y: 2, sprite: null, solid: true, script: [{ say: ['A folded note from Vale: "Come by the lab before noon. Bring your curiosity, not your laundry."'] }] },
      { id: 'table', x: 5, y: 4, sprite: null, solid: true, script: [{ say: ['Breakfast has gone cold. There is a second cup set out anyway.'] }] }
    ],
    onEnter: [{ if: { notFlag: 'intro_seen' }, then: SCRIPTS.home_intro }]
  },

  lab: {
    id: 'lab', name: "Vale's Laboratory", music: 'village', indoor: true,
    tiles: rows(lab),
    warps: [{ x: 7, y: 9, to: 'lumen_bay', tx: 16, ty: 8, dir: 'down' }],
    events: [
      { id: 'vale', x: 10, y: 5, sprite: 'vale', name: 'Professor Vale', dir: 'down', script: SCRIPTS.vale },
      { id: 'lab_table', x: 6, y: 6, sprite: null, solid: true, script: [{ if: { flag: 'got_starter' }, then: [{ say: ['Three cradles, one empty. Vale has already labelled the others with your name and a question mark.'] }], else: [{ say: ['Three Echo Balls, each holding a small sleeping shape. One of them is watching you back.'] }] }] },
      { id: 'lab_shelf', x: 3, y: 2, sprite: null, solid: true, script: [{ say: ['Sample jars of glowing fluid. The labels read: RESONANCE SAMPLE, SUBJECT 4, DO NOT OPEN.'] }] },
      { id: 'lab_forks', x: 11, y: 2, sprite: null, solid: true, script: [{ say: ['A tuning fork hums without being struck. The note is not in any book you have read.'] }] }
    ]
  },

  lumen_clinic: {
    id: 'lumen_clinic', name: 'Lumen Rest House', music: 'heal', indoor: true,
    tiles: rows(clinic),
    warps: [{ x: 6, y: 8, to: 'lumen_bay', tx: 6, ty: 15, dir: 'down' }],
    events: [
      { id: 'nurse', x: 5, y: 3, sprite: 'nurse', name: 'Nurse Alba', dir: 'down', script: SCRIPTS.lumen_nurse },
      { id: 'storage', x: 9, y: 2, sprite: 'pc', name: 'Storage Terminal', dir: 'down', script: SCRIPTS.storage },
      { id: 'beds', x: 4, y: 6, sprite: null, solid: true, script: [{ say: ['Three neat beds and a window full of sea light. You could sleep for a week.'] }] }
    ]
  },

  lumen_shop: {
    id: 'lumen_shop', name: 'Sundry Goods', music: 'village', indoor: true,
    tiles: rows(shop),
    warps: [{ x: 6, y: 8, to: 'lumen_bay', tx: 16, ty: 15, dir: 'down' }],
    events: [
      { id: 'shopkeep', x: 6, y: 4, sprite: 'shopkeep', name: 'Odile', dir: 'down', script: SCRIPTS.lumen_shopkeep },
      { id: 'crates', x: 9, y: 5, sprite: null, solid: true, script: [{ say: ['Crates stamped with tide-marks and one word: FRAGILE. Something inside is humming.'] }] }
    ]
  },

  lumen_bay: {
    id: 'lumen_bay', name: 'Lumen Bay', music: 'village', indoor: false,
    tiles: rows(bay),
    warps: [
      { x: 6, y: 7, to: 'home', tx: 6, ty: 7, dir: 'up' },
      { x: 16, y: 7, to: 'lab', tx: 7, ty: 8, dir: 'up' },
      { x: 6, y: 14, to: 'lumen_clinic', tx: 6, ty: 7, dir: 'up' },
      { x: 16, y: 14, to: 'lumen_shop', tx: 6, ty: 7, dir: 'up' },
      { x: 21, y: 8, to: 'coast_route', tx: 1, ty: 8, dir: 'right' }
    ],
    events: [
      { id: 'elder', x: 13, y: 7, sprite: 'elder', name: 'Elder Bram', dir: 'down', script: SCRIPTS.elder },
      { id: 'pip', x: 10, y: 9, sprite: 'girl', name: 'Pip', dir: 'down', script: SCRIPTS.pip },
      { id: 'tam', x: 18, y: 9, sprite: 'fisher', name: 'Old Tam', dir: 'left', script: SCRIPTS.tam },
      { id: 'sign_bay', x: 12, y: 7, sprite: null, solid: true, script: [{ say: ['LUMEN BAY\nA quiet fishing village on the western shore.', 'NORTH: Vale’s Laboratory\nEAST: The Coast Road\nSOUTH: Rest House and Sundry Goods'] }] },
      { id: 'sign_tide', x: 20, y: 12, sprite: null, solid: true, script: [{ say: ['The tide comes in fast here. Mind the wet stone.'] }] }
    ]
  },

  coast_route: {
    id: 'coast_route', name: 'Coast Road', music: 'route', indoor: false,
    tiles: rows(coast), encounters: encounters.coast,
    warps: [
      { x: 0, y: 8, to: 'lumen_bay', tx: 20, ty: 8, dir: 'left' },
      {
        x: 25, y: 8, to: 'whisperwood', tx: 1, ty: 8, dir: 'right',
        requires: { flag: 'road_open' },
        blocked: 'Captain Orin bars the way. “The coast is not proven safe yet.”'
      }
    ],
    events: [
      { id: 'orin', x: 15, y: 7, sprite: 'orin', name: 'Captain Orin', dir: 'down', sight: 2, trainer: 'orin', script: SCRIPTS.orin },
      { id: 'pell', x: 9, y: 11, sprite: 'boy', name: 'Scout Pell', dir: 'up', sight: 2, trainer: 'pell', script: SCRIPTS.pell },
      { id: 'sign_coast', x: 5, y: 7, sprite: null, solid: true, script: [{ say: ['COAST ROAD\nLumen Bay  <   >   Whisperwood', 'The old survey markers lean east. Something has been moving through the grass.'] }] },
      { id: 'sign_bird', x: 23, y: 13, sprite: null, solid: true, script: [{ say: ['Someone has carved a small bird into this post. It was not done with any tool you recognise.'] }] },
      { id: 'item_salve', x: 22, y: 12, sprite: 'item', solid: true, once: true, script: [{ say: ['A Salve, half-buried in the path.'] }, { giveItem: 'salve', qty: 1 }, { sfx: 'item' }] }
    ]
  },

  whisperwood: {
    id: 'whisperwood', name: 'The Whisperwood', music: 'forest', indoor: false,
    tiles: rows(wood), encounters: encounters.wood,
    warps: [
      { x: 0, y: 8, to: 'coast_route', tx: 24, ty: 8, dir: 'left' },
      { x: 23, y: 8, to: 'halvern', tx: 1, ty: 8, dir: 'right' },
      {
        x: 11, y: 1, to: 'tide_cave', tx: 10, ty: 14, dir: 'up',
        requires: { flag: 'mira_battle_done' },
        blocked: 'The cave mouth hums. Mira is still watching the path behind you. You should settle that first.'
      }
    ],
    events: [
      { id: 'mira', x: 14, y: 7, sprite: 'mira', name: 'Mira', dir: 'down', sight: 2, trainer: 'mira', script: SCRIPTS.mira },
      { id: 'selene', x: 18, y: 7, sprite: 'selene', name: 'Selene', dir: 'down', script: SCRIPTS.selene },
      { id: 'sign_wood', x: 10, y: 7, sprite: null, solid: true, script: [{ say: ['Beyond here the ground hums. Do not touch the black flowers.'] }] },
      { id: 'item_balls', x: 20, y: 14, sprite: 'item', solid: true, once: true, script: [{ say: ['Three Echo Balls, scattered in the moss.'] }, { giveItem: 'echoball', qty: 3 }, { sfx: 'item' }] }
    ]
  },

  tide_cave: {
    id: 'tide_cave', name: 'Tide Cave', music: 'ruins', indoor: true,
    tiles: rows(cave), encounters: encounters.cave,
    warps: [{ x: 10, y: 15, to: 'whisperwood', tx: 11, ty: 2, dir: 'down' }],
    events: [
      { id: 'altar', x: 10, y: 2, sprite: 'altar', name: 'Cracked Altar', dir: 'down', script: SCRIPTS.altar },
      { id: 'rook', x: 14, y: 9, sprite: 'fisher', name: 'Delver Rook', dir: 'left', sight: 3, trainer: 'rook', script: SCRIPTS.rook },
      { id: 'delver_nell', x: 5, y: 12, sprite: 'girl', name: 'Delver Nell', dir: 'right', script: SCRIPTS.delver },
      { id: 'cave_note', x: 7, y: 11, sprite: null, solid: true, script: SCRIPTS.cave_note },
      { id: 'item_balm', x: 3, y: 8, sprite: 'item', solid: true, once: true, script: [{ say: ['A Field Balm in a waterproof tin. Still good.'] }, { giveItem: 'balm', qty: 1 }, { sfx: 'item' }] }
    ]
  },

  halvern: {
    id: 'halvern', name: 'Halvern Market', music: 'village', indoor: false,
    tiles: rows(halvern),
    warps: [
      { x: 0, y: 8, to: 'whisperwood', tx: 22, ty: 8, dir: 'left' },
      { x: 5, y: 7, to: 'halvern_clinic', tx: 6, ty: 7, dir: 'up' },
      { x: 16, y: 7, to: 'halvern_shop', tx: 6, ty: 7, dir: 'up' },
      { x: 10, y: 13, to: 'arena', tx: 6, ty: 9, dir: 'up' },
      {
        x: 21, y: 8, to: 'emberfall', tx: 1, ty: 8, dir: 'right',
        requires: { flag: 'chapter_complete' },
        blocked: 'The east gate is sealed. A notice reads: “CLOSED UNTIL THE HUM QUIETS — BY ORDER OF THE ARENA.”'
      }
    ],
    events: [
      { id: 'tal', x: 11, y: 4, sprite: 'merchant', name: 'Merchant Tal', dir: 'down', script: SCRIPTS.tal },
      { id: 'bex', x: 8, y: 10, sprite: 'boy', name: 'Little Bex', dir: 'down', script: SCRIPTS.bex },
      { id: 'sign_halvern', x: 12, y: 7, sprite: null, solid: true, script: [{ say: ['HALVERN MARKET', '“Everything you need, and one thing you do not.”', 'The Coiled Arena lies south of the square.'] }] },
      { id: 'sign_arena', x: 18, y: 12, sprite: null, solid: true, script: [{ say: ['THE COILED ARENA', 'Challengers welcome. Losers welcome to watch.', 'Rowan has not lost in nine years.'] }] }
    ],
    onEnter: [{ if: { notFlag: 'halvern_seen' }, then: [{ say: ['Halvern Market opens around you: awnings, bells, the smell of salt and frying batter.', 'At the far end of the square, a stone arch leads down to the Coiled Arena.'] }, { set: { flag: 'halvern_seen', value: true } }] }]
  },

  halvern_clinic: {
    id: 'halvern_clinic', name: 'Halvern Clinic', music: 'heal', indoor: true,
    tiles: rows(clinic),
    warps: [{ x: 6, y: 8, to: 'halvern', tx: 5, ty: 8, dir: 'down' }],
    events: [
      { id: 'nurse', x: 5, y: 3, sprite: 'nurse', name: 'Nurse Ione', dir: 'down', script: SCRIPTS.halvern_nurse },
      { id: 'storage', x: 9, y: 2, sprite: 'pc', name: 'Storage Terminal', dir: 'down', script: SCRIPTS.storage },
      { id: 'beds', x: 4, y: 6, sprite: null, solid: true, script: [{ say: ['The clinic beds are full of trainers pretending not to be nervous about the arena.'] }] }
    ]
  },

  halvern_shop: {
    id: 'halvern_shop', name: 'Halvern Exchange', music: 'village', indoor: true,
    tiles: rows(shop),
    warps: [{ x: 6, y: 8, to: 'halvern', tx: 16, ty: 8, dir: 'down' }],
    events: [
      { id: 'shopkeep', x: 6, y: 4, sprite: 'shopkeep', name: 'Tamsin', dir: 'down', script: SCRIPTS.halvern_shopkeep },
      { id: 'crates', x: 9, y: 5, sprite: null, solid: true, script: [{ say: ['A crate of Great Balls with a handwritten warning: “NO REFUNDS FOR ADVENTURERS.”'] }] }
    ]
  },

  arena: {
    id: 'arena', name: 'The Coiled Arena', music: 'arena', indoor: true,
    tiles: rows(arena),
    warps: [{ x: 6, y: 10, to: 'halvern', tx: 10, ty: 14, dir: 'down' }],
    events: [
      { id: 'rowan', x: 6, y: 3, sprite: 'rowan', name: 'Rowan', dir: 'down', script: SCRIPTS.rowan },
      { id: 'arena_pillar_l', x: 3, y: 3, sprite: null, solid: true, script: [{ say: ['The pillar is warm. Deep inside it, something is keeping time.'] }] },
      { id: 'arena_pillar_r', x: 9, y: 3, sprite: null, solid: true, script: [{ say: ['Old scoring marks climb the stone. Nine years of them, all the same name.'] }] }
    ]
  },

  emberfall: {
    id: 'emberfall', name: 'Emberfall', music: 'village', indoor: false,
    tiles: rows(emberfall),
    warps: [
      { x: 0, y: 8, to: 'halvern', tx: 20, ty: 8, dir: 'left' },
      { x: 9, y: 7, to: 'emberfall_library', tx: 6, ty: 7, dir: 'up' }
    ],
    events: [
      { id: 'sign_ember', x: 5, y: 9, sprite: null, solid: true, script: [{ say: ['EMBERFALL', 'The eastern town of Asteria. The library keeps every record of the Resonance.', 'Quiet, please. The books are listening.'] }] },
      { id: 'fisher_ember', x: 13, y: 8, sprite: 'fisher', name: 'Harbour Watcher', dir: 'left', script: [{ say: ['You can see the whole bay from here. On clear days you can see the hum, too, if you know where to look.'] }] }
    ],
    onEnter: [{ if: { notFlag: 'emberfall_seen' }, then: [{ say: ['Emberfall is built on the last high stone before the eastern sea.', 'The library doors are open. Someone inside has been waiting a long time.'] }, { set: { flag: 'emberfall_seen', value: true } }] }]
  },

  emberfall_library: {
    id: 'emberfall_library', name: 'Emberfall Library', music: 'ruins', indoor: true,
    tiles: rows(library),
    warps: [{ x: 6, y: 8, to: 'emberfall', tx: 9, ty: 8, dir: 'down' }],
    events: [
      { id: 'archivist', x: 6, y: 4, sprite: 'archivist', name: 'The Archivist', dir: 'down', script: SCRIPTS.archivist },
      { id: 'shelves', x: 4, y: 2, sprite: null, solid: true, script: [{ say: ['Four hundred years of tide records. One page, near the end, is still wet.'] }] },
      { id: 'lectern', x: 6, y: 5, sprite: null, solid: true, script: [{ say: ['A ledger lies open: THE RESONANCE — LISTENING LOG. The last entry is dated today.'] }] }
    ]
  }
};

// ---------------------------------------------------------------- helpers
export const MAP_IDS = Object.keys(MAPS);

export function tileChar(map, x, y) {
  if (!map || !map.tiles[y]) return 'X';
  return map.tiles[y][x] ?? 'X';
}

// Kept in sync with render/tiles.js but duplicated here so map logic never
// depends on a canvas or on the render layer.
export const SOLID_TILES = new Set(['T', 'F', 'W', 'B', 'R', '~', 'P', 'M', '=', 'X', 'H', 'V', 'G']);

export function isWalkableTile(map, x, y) {
  return !SOLID_TILES.has(tileChar(map, x, y));
}

export function mapSize(map) {
  return { w: map.tiles[0].length, h: map.tiles.length };
}

export function findWarp(map, x, y) {
  return (map.warps || []).find(w => w.x === x && w.y === y) || null;
}

export function findEvent(map, x, y) {
  return (map.events || []).find(e => e.x === x && e.y === y) || null;
}

// Development-time validation. A malformed map fails loudly instead of
// producing an invisible wall half-way through a playthrough.
for (const id of MAP_IDS) {
  const m = MAPS[id];
  const w = m.tiles[0].length;
  if (!w) throw new Error(`Map ${id} has no tiles`);
  if (m.tiles.some(row => row.length !== w)) throw new Error(`Map ${id} has inconsistent row widths`);
  for (const warp of m.warps || []) {
    if (warp.x < 0 || warp.x >= w || warp.y < 0 || warp.y >= m.tiles.length) throw new Error(`Map ${id} warp out of bounds`);
    if (!MAPS[warp.to]) throw new Error(`Map ${id} warp targets missing map ${warp.to}`);
  }
  for (const e of m.events || []) {
    if (e.x < 0 || e.x >= w || e.y < 0 || e.y >= m.tiles.length) throw new Error(`Map ${id} event ${e.id} out of bounds`);
  }
}

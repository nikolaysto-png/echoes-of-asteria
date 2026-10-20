import { SAVE_KEY, SAVE_VERSION, MAX_STORAGE, DEFAULT_SETTINGS } from './constants.js';
import { CREATURES } from '../data/creatures.js';
import { ITEMS } from '../data/items.js';
import { MOVES } from '../data/moves.js';
import { createCreature, expForLevel } from '../systems/creature.js';
import { MAPS, isWalkableTile, tileChar } from '../data/maps.js';

export { SAVE_KEY, SAVE_VERSION };

export function createState() {
  return {
    version: SAVE_VERSION,
    playerName: 'WREN',
    map: 'home',
    x: 6,
    y: 7,
    dir: 'up',
    party: [],
    storage: [],
    bag: {},
    coins: 500,
    flags: {},
    seen: {},
    caught: {},
    defeatedTrainers: {},
    npcPos: {},
    mapEdits: {},
    respawn: { map: 'home', x: 6, y: 7 },
    settings: { ...DEFAULT_SETTINGS },
    playtime: 0,
    created: Date.now(),
    lastSaved: 0
  };
}

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function isUnsafeKey(key) {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

function safeInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function sanitizeCreature(raw) {
  if (!isObj(raw) || !CREATURES[raw.species]) return null;
  const species = CREATURES[raw.species];
  const level = safeInt(raw.level, 1, 100, 5);
  const growth = species.growth || 'medium';
  const minExp = expForLevel(level, growth);
  const maxExp = level >= 100 ? minExp : expForLevel(level + 1, growth) - 1;
  const exp = Number.isFinite(Number(raw.exp))
    ? Math.max(minExp, Math.min(maxExp, Math.floor(Number(raw.exp))))
    : minExp;
  const c = createCreature(raw.species, level, {
    dvs: isObj(raw.dvs) ? {
      atk: safeInt(raw.dvs.atk, 0, 15, 8), def: safeInt(raw.dvs.def, 0, 15, 8),
      spd: safeInt(raw.dvs.spd, 0, 15, 8), spc: safeInt(raw.dvs.spc, 0, 15, 8)
    } : undefined,
    statExp: isObj(raw.statExp) ? {
      hp: safeInt(raw.statExp.hp, 0, 65535, 0),
      atk: safeInt(raw.statExp.atk, 0, 65535, 0),
      def: safeInt(raw.statExp.def, 0, 65535, 0),
      spd: safeInt(raw.statExp.spd, 0, 65535, 0),
      spc: safeInt(raw.statExp.spc, 0, 65535, 0)
    } : undefined,
    exp,
    metMap: typeof raw.metMap === 'string' ? raw.metMap : null,
    originalTrainer: typeof raw.originalTrainer === 'string' ? raw.originalTrainer : 'You'
  });
  if (typeof raw.uid === 'string') c.uid = raw.uid.slice(0, 80);
  if (typeof raw.nickname === 'string' && raw.nickname) {
    c.nickname = raw.nickname.slice(0, 10);
    c.name = c.nickname;
  }
  c.hp = safeInt(raw.hp, 0, c.maxHp, c.maxHp);
  c.status = ['PSN', 'BRN', 'PAR', 'SLP', 'FRZ'].includes(raw.status) ? raw.status : null;
  c.statusTurns = safeInt(raw.statusTurns, 0, 9, 0);
  c.metLevel = safeInt(raw.metLevel, 1, 100, level);
  if (Array.isArray(raw.moves)) {
    const moves = raw.moves
      .filter(m => isObj(m) && typeof m.id === 'string')
      .slice(0, 4)
      .map(m => {
        const base = MOVES_PP[m.id];
        return base ? { id: m.id, maxPp: base, pp: safeInt(m.pp, 0, base, base) } : null;
      })
      .filter(Boolean);
    if (moves.length) c.moves = moves;
  }
  return c;
}

// Small PP lookup kept local to avoid scanning the move table for every slot.
const MOVES_PP = Object.fromEntries(Object.entries(MOVES).map(([id, m]) => [id, m.pp]));

function safeRecord(raw, valueCheck = v => typeof v === 'boolean' || typeof v === 'string' || Number.isFinite(v)) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(k) || isUnsafeKey(k)) continue;
    if (valueCheck(v)) out[k] = v;
  }
  return out;
}

function safePosition(map, x, y) {
  x = safeInt(x, 0, map.tiles[0].length - 1, 1);
  y = safeInt(y, 0, map.tiles.length - 1, 1);
  if (isWalkableTile(map, x, y)) return { x, y };
  for (let r = 1; r < 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.tiles[0].length || ny >= map.tiles.length) continue;
        if (isWalkableTile(map, nx, ny) && tileChar(map, nx, ny) !== 'D') return { x: nx, y: ny };
      }
    }
  }
  return { x: 1, y: 1 };
}

export function validateState(raw) {
  if (!isObj(raw) || raw.version !== SAVE_VERSION) return null;
  const base = createState();
  const s = { ...base };
  s.playerName = typeof raw.playerName === 'string' && /^[A-Za-z0-9 .'-]{0,10}$/.test(raw.playerName)
    ? raw.playerName.trim().slice(0, 10) || 'WREN'
    : 'WREN';

  s.party = Array.isArray(raw.party) ? raw.party.map(sanitizeCreature).filter(Boolean).slice(0, 6) : [];
  s.storage = Array.isArray(raw.storage) ? raw.storage.map(sanitizeCreature).filter(Boolean).slice(0, MAX_STORAGE) : [];
  s.bag = {};
  if (isObj(raw.bag)) {
    for (const [id, n] of Object.entries(raw.bag)) {
      if (ITEMS[id] && Number.isFinite(Number(n))) {
        const qty = Math.min(999, Math.floor(Number(n)));
        if (qty > 0) s.bag[id] = qty;
      }
    }
  }
  s.coins = safeInt(raw.coins, 0, 999999, 500);
  s.flags = safeRecord(raw.flags);
  s.seen = safeRecord(raw.seen, () => true);
  s.caught = safeRecord(raw.caught, v => Number.isFinite(Number(v)));
  s.defeatedTrainers = safeRecord(raw.defeatedTrainers);
  s.npcPos = {};
  if (isObj(raw.npcPos)) {
    for (const [k, v] of Object.entries(raw.npcPos)) {
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(k) || isUnsafeKey(k) || !isObj(v)) continue;
      if (MAPS[v.map]) {
        const pos = safePosition(MAPS[v.map], v.x, v.y);
        s.npcPos[k] = { map: v.map, x: pos.x, y: pos.y, dir: ['up', 'down', 'left', 'right'].includes(v.dir) ? v.dir : 'down' };
      }
    }
  }
  s.mapEdits = {};
  if (isObj(raw.mapEdits)) {
    for (const [id, edits] of Object.entries(raw.mapEdits)) {
      if (!MAPS[id] || !isObj(edits)) continue;
      const map = MAPS[id];
      const clean = {};
      for (const [key, ch] of Object.entries(edits)) {
        const m = /^(\d+),(\d+)$/.exec(key);
        if (!m || typeof ch !== 'string' || ch.length !== 1) continue;
        const x = Number(m[1]), y = Number(m[2]);
        if (x < 0 || y < 0 || x >= map.tiles[0].length || y >= map.tiles.length) continue;
        clean[key] = ch;
      }
      if (Object.keys(clean).length) s.mapEdits[id] = clean;
    }
  }
  const rawSettings = isObj(raw.settings) ? raw.settings : {};
  s.settings = {
    music: rawSettings.music !== false,
    sfx: rawSettings.sfx !== false,
    textSpeed: safeInt(rawSettings.textSpeed, 0, 2, 1),
    shake: rawSettings.shake !== false,
    mute: rawSettings.mute === true
  };
  s.playtime = Number.isFinite(Number(raw.playtime)) ? Math.max(0, Number(raw.playtime)) : 0;
  s.created = Number.isFinite(Number(raw.created)) ? Number(raw.created) : Date.now();
  s.lastSaved = Number.isFinite(Number(raw.lastSaved)) ? Math.max(0, Number(raw.lastSaved)) : 0;

  const validDir = ['up', 'down', 'left', 'right'].includes(raw.dir) ? raw.dir : 'down';
  if (MAPS[raw.map]) {
    const map = MAPS[raw.map];
    s.map = raw.map;
    const pos = safePosition(map, raw.x, raw.y);
    s.x = pos.x;
    s.y = pos.y;
    s.dir = validDir;
  } else {
    s.dir = validDir;
  }
  if (isObj(raw.respawn) && MAPS[raw.respawn.map]) {
    const map = MAPS[raw.respawn.map];
    const pos = safePosition(map, raw.respawn.x, raw.respawn.y);
    s.respawn = { map: raw.respawn.map, x: pos.x, y: pos.y };
  }
  return s;
}

export function hasSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data && data.version === SAVE_VERSION;
  } catch (e) {
    return false;
  }
}

export function saveState(state) {
  try {
    const payload = { ...state, version: SAVE_VERSION, lastSaved: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Could not write save data.' };
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return validateState(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
}

export function addItem(state, id, amount = 1) {
  if (!ITEMS[id] || amount <= 0) return;
  state.bag[id] = Math.min(999, (state.bag[id] || 0) + amount);
}

export function removeItem(state, id, amount = 1) {
  if (!state.bag[id] || state.bag[id] < amount) return false;
  state.bag[id] -= amount;
  if (state.bag[id] <= 0) delete state.bag[id];
  return true;
}

export function hasItem(state, id, amount = 1) {
  return (state.bag[id] || 0) >= amount;
}

export function bagEntries(state) {
  return Object.entries(state.bag).filter(([id, n]) => ITEMS[id] && n > 0);
}

export function markSeen(state, species) {
  if (CREATURES[species]) state.seen[species] = true;
}

export function markCaught(state, species) {
  if (CREATURES[species]) {
    state.seen[species] = true;
    state.caught[species] = (state.caught[species] || 0) + 1;
  }
}

export function partyLimit(party) { return party.length >= 6; }

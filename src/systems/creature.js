import { CREATURES } from '../data/creatures.js';
import { MOVES, getMove } from '../data/moves.js';
import { MAX_PARTY } from '../core/constants.js';

export const STAT_KEYS = ['hp', 'atk', 'def', 'spd', 'spc'];
export const GROWTH = {
  fast: n => Math.floor(0.8 * n * n * n),
  medium: n => n * n * n,
  slow: n => Math.floor(1.25 * n * n * n)
};

let uidCounter = 0;

export function expForLevel(level, group = 'medium') {
  if (level <= 1) return 0;
  return (GROWTH[group] || GROWTH.medium)(Math.min(100, level));
}

export function levelForExp(exp, group = 'medium') {
  let level = 1;
  while (level < 100 && exp >= expForLevel(level + 1, group)) level++;
  return level;
}

export function expToNext(creature) {
  const group = (CREATURES[creature.species] || {}).growth || 'medium';
  return Math.max(0, expForLevel(creature.level + 1, group) - creature.exp);
}

export function calcStat(base, dv, statExp, level, isHP = false) {
  const e = Math.min(255, Math.floor(Math.sqrt(Math.max(0, statExp)) / 4));
  const core = Math.floor(((base + dv) * 2 + e) * level / 100);
  return Math.max(1, isHP ? core + level + 10 : core + 5);
}

export function deriveHpDv(dvs) {
  return ((dvs.atk & 1) << 3) | ((dvs.def & 1) << 2) | ((dvs.spd & 1) << 1) | (dvs.spc & 1);
}

export function calcStats(speciesId, level, dvs, statExp) {
  const s = CREATURES[speciesId];
  if (!s) throw new Error('Unknown species: ' + speciesId);
  const exp = statExp || { hp: 0, atk: 0, def: 0, spd: 0, spc: 0 };
  const hpDv = deriveHpDv(dvs);
  return {
    hp: calcStat(s.base.hp, hpDv, exp.hp, level, true),
    atk: calcStat(s.base.atk, dvs.atk, exp.atk, level),
    def: calcStat(s.base.def, dvs.def, exp.def, level),
    spd: calcStat(s.base.spd, dvs.spd, exp.spd, level),
    spc: calcStat(s.base.spc, dvs.spc, exp.spc, level)
  };
}

export function randomDvs(rng = Math.random) {
  return {
    atk: Math.floor(rng() * 16),
    def: Math.floor(rng() * 16),
    spd: Math.floor(rng() * 16),
    spc: Math.floor(rng() * 16)
  };
}

export function movesForLevel(speciesId, level) {
  const s = CREATURES[speciesId];
  if (!s) return [];
  const seen = [];
  for (const [lv, id] of s.learnset) {
    if (lv <= level && MOVES[id] && !seen.includes(id)) seen.push(id);
  }
  return seen.slice(-4).map(id => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp }));
}

function makeUid(speciesId) {
  uidCounter = (uidCounter + 1) % 1679616;
  return `${speciesId}-${Date.now().toString(36)}-${uidCounter.toString(36)}`;
}

export function createCreature(speciesId, level = 5, opts = {}) {
  const s = CREATURES[speciesId];
  if (!s) throw new Error('Unknown species: ' + speciesId);
  level = Math.max(1, Math.min(100, Math.floor(level)));
  const rng = opts.rng || Math.random;
  const dvs = opts.dvs ? { ...opts.dvs } : randomDvs(rng);
  const statExp = opts.statExp
    ? { hp: 0, atk: 0, def: 0, spd: 0, spc: 0, ...opts.statExp }
    : { hp: 0, atk: 0, def: 0, spd: 0, spc: 0 };
  const stats = calcStats(speciesId, level, dvs, statExp);
  const c = {
    uid: makeUid(speciesId),
    species: speciesId,
    name: opts.nickname || s.name,
    nickname: opts.nickname || null,
    types: s.types.slice(),
    level,
    dvs,
    statExp,
    stats,
    maxHp: stats.hp,
    hp: opts.hp != null ? Math.max(0, Math.min(stats.hp, opts.hp)) : stats.hp,
    exp: opts.exp != null ? opts.exp : expForLevel(level, s.growth),
    moves: opts.moves || movesForLevel(speciesId, level),
    status: opts.status || null,
    statusTurns: opts.statusTurns || 0,
    stages: { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 },
    volatile: { flinch: false, confusion: 0, endure: false },
    metLevel: level,
    metMap: opts.metMap || null,
    originalTrainer: opts.originalTrainer || 'You'
  };
  return c;
}

export function expYield(speciesId, level) {
  const s = CREATURES[speciesId];
  if (!s) return 1;
  return Math.max(1, Math.floor(s.baseExp * level / 7));
}

export function awardStatExp(creature, defeatedSpeciesId) {
  const s = CREATURES[defeatedSpeciesId];
  if (!s || !creature) return;
  for (const key of ['hp', 'atk', 'def', 'spd', 'spc']) {
    creature.statExp[key] = Math.min(65535, (creature.statExp[key] || 0) + s.base[key]);
  }
}

/**
 * Give experience, recalculating stats and learning moves. Evolution happens at
 * the end of a level-up. Returns display messages for the battle UI.
 */
export function gainExperience(creature, amount, rng = Math.random) {
  const messages = [];
  const beforeLevel = creature.level;
  creature.exp += Math.max(0, Math.floor(amount));
  const s = CREATURES[creature.species];
  const newLevel = Math.min(100, levelForExp(creature.exp, s.growth));
  if (newLevel <= beforeLevel) return { messages, levels: 0, evolved: null };

  const oldMax = creature.maxHp;
  creature.level = newLevel;
  creature.stats = calcStats(creature.species, creature.level, creature.dvs, creature.statExp);
  creature.maxHp = creature.stats.hp;
  creature.hp = Math.min(creature.maxHp, creature.hp + (creature.maxHp - oldMax));
  messages.push(`${creature.name} grew to L${creature.level}!`);

  // Learn all moves unlocked by the new level, oldest move replaced if needed.
  for (const [lv, moveId] of s.learnset) {
    if (lv <= beforeLevel || lv > creature.level) continue;
    if (!MOVES[moveId] || creature.moves.some(m => m.id === moveId)) continue;
    const slot = { id: moveId, pp: MOVES[moveId].pp, maxPp: MOVES[moveId].pp };
    if (creature.moves.length < 4) {
      creature.moves.push(slot);
      messages.push(`${creature.name} learned ${MOVES[moveId].name}!`);
    } else {
      const forgotten = getMove(creature.moves[0].id);
      creature.moves.shift();
      creature.moves.push(slot);
      messages.push(`${creature.name} forgot ${forgotten ? forgotten.name : 'a move'} and learned ${MOVES[moveId].name}!`);
    }
  }

  const evolution = maybeEvolve(creature);
  if (evolution) {
    messages.push(`What? ${evolution.from} is evolving!`);
    messages.push(`${evolution.from} evolved into ${evolution.to}!`);
  }
  return { messages, levels: creature.level - beforeLevel, evolved: evolution ? evolution.to : null };
}

export function maybeEvolve(creature) {
  const s = CREATURES[creature.species];
  if (!s || !s.evolveTo || !s.evolveLevel) return null;
  if (creature.level < s.evolveLevel) return null;
  const next = CREATURES[s.evolveTo];
  if (!next) return null;
  const from = creature.name;
  const hpRatio = creature.maxHp > 0 ? creature.hp / creature.maxHp : 1;
  creature.species = s.evolveTo;
  creature.name = creature.nickname || next.name;
  creature.types = next.types.slice();
  creature.stats = calcStats(creature.species, creature.level, creature.dvs, creature.statExp);
  creature.maxHp = creature.stats.hp;
  creature.hp = Math.max(1, Math.round(creature.maxHp * hpRatio));
  return { from, to: creature.name };
}

export function healCreature(creature, amount) {
  if (!creature || creature.hp <= 0) return 0;
  const before = creature.hp;
  creature.hp = Math.min(creature.maxHp, creature.hp + Math.max(0, amount));
  return creature.hp - before;
}

export function healParty(party) {
  for (const c of party) {
    c.hp = c.maxHp;
    c.status = null;
    c.statusTurns = 0;
    c.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
    c.volatile = { flinch: false, confusion: 0, endure: false };
    for (const m of c.moves) m.pp = m.maxPp;
  }
}

export function reviveCreature(creature, ratio = 0.5) {
  if (!creature || creature.hp > 0) return false;
  creature.hp = Math.max(1, Math.round(creature.maxHp * ratio));
  creature.status = null;
  return true;
}

export function cureStatus(creature, allowed = null) {
  if (!creature || !creature.status) return false;
  if (allowed && !allowed.includes(creature.status)) return false;
  creature.status = null;
  creature.statusTurns = 0;
  return true;
}

export function firstAlive(party) {
  return party.find(c => c.hp > 0) || null;
}

export function aliveCount(party) {
  return party.filter(c => c.hp > 0).length;
}

export function hasUsableMove(creature) {
  return creature.moves.some(m => m.pp > 0);
}

export function restoreAll(creature) {
  creature.hp = creature.maxHp;
  creature.status = null;
  creature.statusTurns = 0;
  creature.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
  creature.volatile = { flinch: false, confusion: 0, endure: false };
  for (const m of creature.moves) m.pp = m.maxPp;
}

export function statusLabel(code) {
  return { BRN: 'BRN', PSN: 'PSN', SLP: 'SLP', PAR: 'PAR', FRZ: 'FRZ' }[code] || '';
}

export function canAddToParty(party) {
  return party.length < MAX_PARTY;
}

export function partySummary(party) {
  return party.map(c => `${c.name} L${c.level} ${c.hp}/${c.maxHp}`).join('\n');
}

// Lightweight test runner that works with both Node and macOS JavaScriptCore.
//   jsc -m tests/run-tests.mjs
//   node tests/run-tests.mjs
import {
  Battle, calcDamage, criticalCheck, effectiveStat
} from '../src/systems/battle.js';
import { createCreature } from '../src/systems/creature.js';
import { typeMultiplier } from '../src/data/types.js';
import { MOVES } from '../src/data/moves.js';
import { validateState, SAVE_VERSION } from '../src/core/state.js';
import { characterPixels, CHARACTER_IDS } from '../src/render/sprites.js';

const log = typeof print === 'function' ? print : (...args) => console.log(...args);
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Values differ'}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function near(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message || 'Values differ'}: expected ~${expected}, got ${actual}`);
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    log(`PASS  ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error });
    log(`FAIL  ${name}`);
    log(`      ${error.message}`);
  }
}

function makeCreature(species, level, name, moveId) {
  const c = createCreature(species, level, {
    nickname: name,
    originalTrainer: 'TESTER',
    dvs: { atk: 15, def: 15, spd: 15, spc: 15 },
    moves: [{ id: moveId, pp: 99, maxPp: 99 }]
  });
  // High HP keeps turn-order tests focused on move order rather than KOs.
  c.maxHp = 400;
  c.hp = 400;
  return c;
}

function makeDuel(playerSpeed = 100, foeSpeed = 10) {
  const player = makeCreature('pyrelisk', 20, 'ALPHA', 'scratch');
  const foe = makeCreature('tidelume', 20, 'BETA', 'tackle');
  player.stats.spd = playerSpeed;
  foe.stats.spd = foeSpeed;
  const battle = new Battle({
    kind: 'wild',
    playerParty: [player],
    foeParty: [foe],
    rng: () => 0.99
  });
  battle.drainQueue();
  return battle;
}

function texts(entries) {
  return entries.filter(entry => entry.type === 'text').map(entry => entry.text);
}

function indexOfText(lines, needle) {
  return lines.findIndex(line => line.indexOf(needle) !== -1);
}

// ---------------------------------------------------------------------------
// Damage and type chart
// ---------------------------------------------------------------------------
test('damage is positive and deterministic at a fixed roll', () => {
  const input = { level: 50, power: 80, atk: 120, def: 80, roll: 255 };
  const a = calcDamage(input);
  const b = calcDamage(input);
  assert(a > 1, 'damage should be above the minimum');
  equal(a, b, 'fixed inputs must produce fixed damage');
});

test('STAB, type effectiveness, and damage roll change damage', () => {
  const base = calcDamage({ level: 50, power: 80, atk: 120, def: 80, roll: 255 });
  const stab = calcDamage({ level: 50, power: 80, atk: 120, def: 80, stab: 1.5, roll: 255 });
  const weak = calcDamage({ level: 50, power: 80, atk: 120, def: 80, type: 0.5, roll: 255 });
  const strong = calcDamage({ level: 50, power: 80, atk: 120, def: 80, type: 2, roll: 255 });
  const lowRoll = calcDamage({ level: 50, power: 80, atk: 120, def: 80, roll: 217 });
  assert(stab > base, 'STAB must increase damage');
  assert(weak < base, 'resisted hits must deal less damage');
  assert(strong > base, 'super-effective hits must deal more damage');
  assert(lowRoll <= base, 'a low roll must not exceed the maximum roll');
  equal(calcDamage({ level: 50, power: 80, atk: 120, def: 80, type: 0, roll: 255 }), 0, 'immune types deal no damage');
});

test('critical hits double effective level and bypass burn', () => {
  const normal = calcDamage({ level: 50, power: 80, atk: 120, def: 80, roll: 255 });
  const critical = calcDamage({ level: 50, power: 80, atk: 120, def: 80, critical: true, roll: 255 });
  const burned = calcDamage({ level: 50, power: 80, atk: 120, def: 80, burned: true, roll: 255 });
  const burnedCrit = calcDamage({ level: 50, power: 80, atk: 120, def: 80, burned: true, critical: true, roll: 255 });
  assert(critical > normal, 'a critical hit must be stronger');
  assert(burned < normal, 'burn must reduce physical damage');
  equal(burnedCrit, critical, 'burn must not reduce a critical hit');
});

test('critical check uses Gen-I speed thresholds', () => {
  assert(criticalCheck(50, 24), 'rolls below half base speed crit');
  assert(!criticalCheck(50, 25), 'rolls at half base speed do not crit');
  assert(criticalCheck(50, 199, true), 'high-crit moves use an eightfold threshold');
  assert(!criticalCheck(50, 200, true), 'high-crit threshold is exclusive');
});

test('type chart handles immunities and dual-type stacking', () => {
  equal(typeMultiplier('FIRE', ['GRASS']), 2, 'Fire beats Grass');
  equal(typeMultiplier('ELECTRIC', ['GROUND']), 0, 'Electric cannot hit Ground');
  equal(typeMultiplier('NORMAL', ['GHOST']), 0, 'Normal cannot hit Ghost');
  equal(typeMultiplier('WATER', ['FIRE', 'ROCK']), 4, 'dual weaknesses stack');
  equal(typeMultiplier('GRASS', ['FIRE', 'FLYING']), 0.25, 'dual resistances stack');
});

test('burn and paralysis affect effective stats', () => {
  const c = {
    stats: { atk: 100, spd: 100, spc: 100 },
    stages: { atk: 0, spd: 0 },
    status: 'BRN'
  };
  equal(effectiveStat(c, 'atk', { physical: true }), 50, 'burn halves physical attack');
  equal(effectiveStat(c, 'spc'), 100, 'burn does not reduce special');
  c.status = 'PAR';
  equal(effectiveStat(c, 'spd'), 25, 'paralysis quarters speed');
  c.stages.spd = 2;
  equal(effectiveStat(c, 'spd'), 50, 'stat stages apply before paralysis');
});

// ---------------------------------------------------------------------------
// Turn order, switching, forced switching, residual damage
// ---------------------------------------------------------------------------
test('faster creature moves first', () => {
  const battle = makeDuel(120, 10);
  assert(battle.turn({ type: 'move', index: 0 }), 'turn should resolve');
  const lines = texts(battle.drainQueue());
  const player = indexOfText(lines, 'ALPHA used Scratch!');
  const foe = indexOfText(lines, 'BETA used Tackle!');
  assert(player >= 0 && foe >= 0, 'both actions should be reported');
  assert(player < foe, 'the faster player should act first');
});

test('slower creature moves second', () => {
  const battle = makeDuel(5, 120);
  assert(battle.turn({ type: 'move', index: 0 }), 'turn should resolve');
  const lines = texts(battle.drainQueue());
  const player = indexOfText(lines, 'ALPHA used Scratch!');
  const foe = indexOfText(lines, 'BETA used Tackle!');
  assert(player >= 0 && foe >= 0, 'both actions should be reported');
  assert(foe < player, 'the faster foe should act first');
});

test('switching changes the active creature and clears stages', () => {
  const battle = makeDuel(120, 10);
  const first = battle.player;
  const second = makeCreature('mossprig', 20, 'SECOND', 'tackle');
  battle.playerParty.push(second);
  first.stages.atk = 2;
  first.volatile.confusion = 2;

  assert(battle.turn({ type: 'switch', index: 1 }), 'switch turn should resolve');
  equal(battle.playerIndex, 1, 'second party member should be active');
  equal(battle.player.name, 'SECOND', 'active creature should be the new one');
  equal(first.stages.atk, 0, 'switching clears stat stages');
  equal(first.volatile.confusion, 0, 'switching clears volatile status');
  equal(first.hp, 400, 'first creature should not take the foe attack after switching out');
});

test('a fainted active creature forces a replacement', () => {
  const battle = makeDuel(120, 10);
  const second = makeCreature('mossprig', 20, 'SECOND', 'tackle');
  battle.playerParty.push(second);
  const first = battle.player;
  first.hp = 0;

  battle.handleFaint('player');
  battle.endOfTurn();
  equal(battle.phase, 'switch', 'fainted player should enter forced switch phase');
  equal(battle.playerNeedsSwitch, false, 'forced switch flag should be consumed by endOfTurn');
  equal(battle.turn({ type: 'move', index: 0 }), false, 'moves cannot be selected during forced switch');
  assert(battle.forceSwitch(1), 'forced switch to a living party member should succeed');
  equal(battle.playerIndex, 1, 'replacement should become active');
  equal(battle.phase, 'choose', 'normal turn selection should resume');
});

test('forced switch rejects a fainted replacement', () => {
  const battle = makeDuel(120, 10);
  const second = makeCreature('mossprig', 20, 'SECOND', 'tackle');
  const third = makeCreature('leafkin', 20, 'THIRD', 'tackle');
  second.hp = 0;
  battle.playerParty.push(second, third);
  battle.player.hp = 0;
  battle.handleFaint('player');
  battle.endOfTurn();
  equal(battle.forceSwitch(1), false, 'a fainted creature cannot be sent out');
  equal(battle.phase, 'switch', 'the battle should remain in forced switch');
});

test('poison deals 1/16 max HP at end of turn', () => {
  const battle = makeDuel();
  const player = battle.player;
  player.maxHp = 64;
  player.hp = 64;
  player.status = 'PSN';
  battle.endOfTurn();
  equal(player.hp, 60, '64 max HP poison should deal 4 damage');
  const lines = texts(battle.drainQueue());
  assert(indexOfText(lines, 'ALPHA is hurt by poison!') >= 0, 'poison message should be queued');
});

test('residual poison cannot leave a creature below zero HP', () => {
  const battle = makeDuel();
  battle.playerParty.push(makeCreature('mossprig', 20, 'SECOND', 'tackle'));
  const player = battle.player;
  player.maxHp = 64;
  player.hp = 2;
  player.status = 'PSN';
  battle.endOfTurn();
  equal(player.hp, 0, 'HP should clamp at zero');
  equal(battle.playerNeedsSwitch, false, 'endOfTurn should consume the pending switch request');
  equal(battle.phase, 'switch', 'poison faint should enter forced switch');
});

// ---------------------------------------------------------------------------
// Save validation
// ---------------------------------------------------------------------------
function validSave() {
  return {
    ...createStateForTests(),
    version: SAVE_VERSION
  };
}

function createStateForTests() {
  return {
    version: SAVE_VERSION,
    playerName: 'WREN',
    map: 'home',
    x: 6,
    y: 7,
    dir: 'down',
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
    settings: { music: true, sfx: true, textSpeed: 1, shake: true, mute: false },
    playtime: 0,
    created: 1,
    lastSaved: 0
  };
}

test('save validation rejects malformed payloads and versions', () => {
  equal(validateState(null), null, 'null save should be rejected');
  equal(validateState('not an object'), null, 'string save should be rejected');
  equal(validateState({ ...validSave(), version: 999 }), null, 'unknown version should be rejected');
});

test('save validation clamps creatures, items, and settings', () => {
  const raw = validSave();
  raw.playerName = '  <bad>  ';
  raw.coins = -100;
  raw.party = [
    {
      species: 'pyrelisk',
      level: 999,
      hp: 9999,
      dvs: { atk: 999, def: -5, spd: 5, spc: 15 },
      statExp: { hp: -100, atk: 1, def: 2, spd: 3, spc: 4 },
      moves: [{ id: 'tackle', pp: 9999 }, { id: 'not_a_move', pp: 1 }]
    },
    { species: 'not_a_species' }
  ];
  raw.bag = { salve: 2.9, balm: -4, nope: 5 };
  raw.settings = { music: false, sfx: true, textSpeed: 99, shake: 0, mute: true, evil: 'x' };
  raw.flags = JSON.parse('{"ok":true,"bad":{"x":1},"__proto__":{"polluted":true}}');
  raw.mapEdits = {
    home: { '1,1': 'X', '999,999': 'Y' },
    not_a_map: { '1,1': 'Z' }
  };
  raw.npcPos = {
    'npc:one': { map: 'home', x: 1, y: 1, dir: 'left' },
    'bad:key': { map: 'not_a_map', x: 1, y: 1, dir: 'down' }
  };
  raw.playtime = Number.POSITIVE_INFINITY;
  raw.created = Number.NaN;

  const state = validateState(raw);
  assert(state, 'sanitized save should be returned');
  equal(state.playerName, 'WREN', 'invalid names fall back to WREN');
  equal(state.coins, 0, 'coins clamp to the valid range');
  equal(state.party.length, 1, 'invalid party members are removed');
  equal(state.party[0].level, 100, 'levels clamp to 100');
  assert(Number.isFinite(state.party[0].stats.hp), 'clamped stats must be finite');
  assert(state.party[0].stats.hp > 0, 'clamped stats must be positive');
  assert(state.party[0].hp <= state.party[0].maxHp, 'HP must not exceed max HP');
  equal(state.party[0].dvs.atk, 15, 'DV values clamp to 0..15');
  equal(state.party[0].dvs.def, 0, 'negative DVs clamp to zero');
  equal(state.party[0].statExp.hp, 0, 'negative stat EXP clamps to zero');
  equal(state.party[0].moves.length, 1, 'unknown moves are removed');
  equal(state.party[0].moves[0].id, 'tackle', 'known move remains');
  assert(state.party[0].moves[0].pp <= MOVES.tackle.pp, 'move PP clamps to its maximum');
  equal(state.bag.salve, 2, 'fractional item counts floor');
  assert(!('balm' in state.bag), 'negative item counts are dropped');
  assert(!('nope' in state.bag), 'unknown items are dropped');
  equal(state.settings.textSpeed, 2, 'text speed clamps to its maximum');
  equal(state.settings.music, false, 'music setting is preserved');
  equal(state.settings.mute, true, 'mute setting is preserved');
  equal(state.settings.shake, true, 'non-false shake values use the default');
  assert(!('evil' in state.settings), 'unknown settings are removed');
  equal(state.flags.ok, true, 'boolean flags are preserved');
  assert(!('bad' in state.flags), 'object flag values are removed');
  assert(!Object.prototype.hasOwnProperty.call(state.flags, '__proto__'), 'prototype keys are removed');
  equal(Object.getPrototypeOf(state.flags), Object.prototype, 'flags object prototype is untouched');
  equal(state.mapEdits.home['1,1'], 'X', 'valid map edits are preserved');
  assert(!state.mapEdits.home['999,999'], 'out-of-bounds map edits are removed');
  assert(!state.mapEdits.not_a_map, 'edits for unknown maps are removed');
  equal(state.npcPos['npc:one'].dir, 'left', 'valid NPC positions are preserved');
  assert(!state.npcPos['bad:key'], 'NPC positions for unknown maps are removed');
  equal(state.playtime, 0, 'non-finite playtime falls back to zero');
  assert(Number.isFinite(state.created), 'created timestamp is finite');
});

test('save validation falls back for invalid maps and positions', () => {
  const raw = validSave();
  raw.map = 'missing-map';
  raw.x = 99999;
  raw.y = -5;
  raw.dir = 'sideways';
  raw.respawn = { map: 'missing-map', x: 0, y: 0 };
  const state = validateState(raw);
  assert(state, 'state should survive invalid location data');
  equal(state.map, 'home', 'invalid map falls back to the home map');
  assert(state.x >= 0 && state.y >= 0, 'coordinates must be non-negative');
  equal(state.dir, 'down', 'invalid facing falls back to down');
  equal(state.respawn.map, 'home', 'invalid respawn map falls back to the default');
});

// ---------------------------------------------------------------------------
// Character sprite regressions
// ---------------------------------------------------------------------------
test('every character has a complete set of facings and frames', () => {
  assert(CHARACTER_IDS.length >= 10, 'character palette list should be populated');
  for (const id of CHARACTER_IDS) {
    for (const dir of ['down', 'up', 'left', 'right']) {
      for (let frame = 0; frame < 3; frame++) {
        const buffer = characterPixels(id, dir, frame);
        equal(buffer.w, 16, `${id}/${dir}/${frame} width`);
        equal(buffer.h, 20, `${id}/${dir}/${frame} height`);
        let pixels = 0;
        for (const color of buffer.d) if (color) pixels++;
        assert(pixels > 80, `${id}/${dir}/${frame} should contain a visible sprite`);
      }
    }
  }
});

test('left-facing sprites are exact horizontal mirrors of right-facing sprites', () => {
  for (const id of CHARACTER_IDS) {
    for (let frame = 0; frame < 3; frame++) {
      const right = characterPixels(id, 'right', frame);
      const left = characterPixels(id, 'left', frame);
      for (let y = 0; y < right.h; y++) {
        for (let x = 0; x < right.w; x++) {
          equal(
            left.d[y * left.w + x],
            right.d[y * right.w + (right.w - 1 - x)],
            `${id} frame ${frame} mirrored at ${x},${y}`
          );
        }
      }
    }
  }
});

test('side walk frames change the leg poses', () => {
  for (const id of CHARACTER_IDS) {
    const a = characterPixels(id, 'right', 0);
    const b = characterPixels(id, 'right', 1);
    const c = characterPixels(id, 'right', 2);
    const diff = (p, q) => {
      let n = 0;
      for (let i = 0; i < p.d.length; i++) if (p.d[i] !== q.d[i]) n++;
      return n;
    };
    assert(diff(a, b) > 0, `${id} should animate between idle and step one`);
    assert(diff(b, c) > 0, `${id} should animate between step one and step two`);
  }
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Ran ${passed + failed} tests: ${passed} passed, ${failed} failed.`);
if (failed) {
  for (const failure of failures) {
    log(`  FAILED: ${failure.name} -> ${failure.error.message}`);
  }
  if (typeof quit === 'function') quit(1);
  else if (typeof process !== 'undefined') process.exitCode = 1;
} else if (typeof quit === 'function') {
  quit(0);
}

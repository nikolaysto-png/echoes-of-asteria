import { getMove } from '../data/moves.js';
import { CREATURES } from '../data/creatures.js';
import { ITEMS } from '../data/items.js';
import { isSpecialType, typeMultiplier, effectivenessText } from '../data/types.js';
import {
  awardStatExp, expYield, gainExperience, healCreature, reviveCreature, cureStatus,
  firstAlive
} from './creature.js';

export const STAT_LABEL = {
  atk: 'Attack', def: 'Defense', spd: 'Speed', spc: 'Special', acc: 'accuracy', eva: 'evasion'
};

export function stageMult(stage) {
  stage = Math.max(-6, Math.min(6, stage || 0));
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

export function accuracyMult(stage) {
  stage = Math.max(-6, Math.min(6, stage || 0));
  const table = { '-6': 0.33, '-5': 0.36, '-4': 0.43, '-3': 0.5, '-2': 0.6, '-1': 0.75, '0': 1, '1': 1.33, '2': 1.66, '3': 2, '4': 2.33, '5': 2.66, '6': 3 };
  return table[String(stage)] || 1;
}

export function effectiveStat(c, key, opts = {}) {
  let v = c.stats[key] * stageMult(c.stages[key] || 0);
  if (key === 'atk' && c.status === 'BRN' && opts.physical) v *= 0.5;
  if (key === 'spd' && c.status === 'PAR') v *= 0.25;
  return Math.max(1, Math.floor(v));
}

/** Gen-I base-Speed critical check, returned deterministically for tests. */
export function criticalCheck(baseSpeed, roll, highCrit = false) {
  const threshold = Math.min(255, Math.floor(baseSpeed / 2) * (highCrit ? 8 : 1));
  return roll < threshold;
}

/**
 * Pure Gen-I damage formula. `roll` is the 217..255 random byte. Critical hits
 * double the attacker's level (Gen-I behavior) and bypass stat stages/burn.
 */
export function calcDamage({ level, power, atk, def, stab = 1, type = 1, critical = false, roll = 255, burned = false }) {
  if (!power || type === 0) return 0;
  const L = critical ? Math.min(255, level * 2) : level;
  let a = Math.max(1, Math.floor(atk));
  const d = Math.max(1, Math.floor(def));
  if (burned && !critical) a = Math.max(1, Math.floor(a / 2));
  let base = Math.floor(Math.floor((2 * L / 5 + 2) * power * a / d) / 50) + 2;
  base = Math.min(997, base);
  let dmg = Math.floor(base * stab * type * roll / 255);
  return Math.max(1, dmg);
}

export function estimateDamage(attacker, defender, move) {
  if (!move || !move.power) return 0;
  const special = isSpecialType(move.type);
  const atk = effectiveStat(attacker, special ? 'spc' : 'atk', { physical: !special });
  const def = effectiveStat(defender, special ? 'spc' : 'def');
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const type = typeMultiplier(move.type, defender.types);
  return Math.round(calcDamage({ level: attacker.level, power: move.power, atk, def, stab, type }));
}

function rngInt(rng, n) { return Math.floor(rng() * n); }

export class Battle {
  constructor(cfg) {
    this.kind = cfg.kind || 'wild';
    this.trainer = cfg.trainer || null;
    this.playerParty = cfg.playerParty || [];
    this.foeParty = cfg.foeParty || (cfg.foe ? [cfg.foe] : []);
    this.bag = cfg.bag || {};
    this.rng = cfg.rng || Math.random;
    this.playerIndex = Math.max(0, this.playerParty.findIndex(c => c.hp > 0));
    if (this.playerIndex < 0) this.playerIndex = 0;
    this.foeIndex = 0;
    this.canRun = cfg.canRun != null ? cfg.canRun : this.kind === 'wild';
    this.canCatch = cfg.canCatch != null ? cfg.canCatch : this.kind === 'wild';
    this.queue = [];
    this.result = null;
    this.phase = 'choose';
    this.turnCount = 0;
    this.runAttempts = 0;
    this.caughtCreature = null;
    this.foeFainted = false;
    this.playerNeedsSwitch = false;
    this.lastAction = null;
    this.start();
  }

  get player() { return this.playerParty[this.playerIndex] || null; }
  get foe() { return this.foeParty[this.foeIndex] || null; }
  get playerAlive() { return this.playerParty.some(c => c.hp > 0); }
  get foeAlive() { return this.foeParty.some(c => c.hp > 0); }

  push(text) { this.queue.push({ type: 'text', text }); }
  anim(kind, side = 'foe') { this.queue.push({ type: 'anim', kind, side }); }

  drainQueue() { return this.queue.splice(0); }

  start() {
    for (const c of [...this.playerParty, ...this.foeParty]) c._faintQueued = false;
    if (this.kind === 'trainer' && this.trainer) {
      this.push(`${this.trainer.name} wants to battle!`);
      if (this.trainer.intro) this.push(this.trainer.intro);
      this.push(`${this.trainer.name} sent out ${this.foe.name}!`);
    } else {
      this.push(`A wild ${this.foe.name} appeared!`);
    }
    this.push(`Go! ${this.player.name}!`);
  }

  /** Player action entry point. */
  turn(action) {
    if (this.phase === 'ended' || this.phase === 'switch') return false;
    this.turnCount++;
    this.lastAction = action;
    const foeAction = this.chooseFoeAction();

    if (action.type === 'move') {
      this.resolveMoves(action, foeAction);
    } else if (action.type === 'switch') {
      if (!this.doSwitch(action.index, false)) return false;
      this.foeAttack(foeAction);
    } else if (action.type === 'item') {
      const itemResult = this.doItem(action);
      if (itemResult === 'ended') return true;
      if (itemResult === 'failed') return false;
      this.foeAttack(foeAction);
    } else if (action.type === 'ball') {
      const ballResult = this.doBall(action.itemId);
      if (ballResult === 'ended') return true;
      if (ballResult === 'failed') return false;
      this.foeAttack(foeAction);
    } else if (action.type === 'run') {
      if (this.doRun()) return true;
      this.foeAttack(foeAction);
    } else {
      return false;
    }

    if (this.result) return true;
    this.endOfTurn();
    return true;
  }

  resolveMoves(playerAction, foeAction) {
    const playerMove = this.moveForAction(playerAction, 'player');
    const foeMove = this.moveForAction(foeAction, 'foe');
    if (!playerMove && !foeMove) return;
    const pPrio = playerMove ? (playerMove.priority || 0) : -9;
    const fPrio = foeMove ? (foeMove.priority || 0) : -9;
    const pSpeed = this.player ? effectiveStat(this.player, 'spd') : 0;
    const fSpeed = this.foe ? effectiveStat(this.foe, 'spd') : 0;
    let playerFirst;
    if (pPrio !== fPrio) playerFirst = pPrio > fPrio;
    else if (pSpeed !== fSpeed) playerFirst = pSpeed > fSpeed;
    else playerFirst = this.rng() < 0.5;

    if (playerFirst) {
      this.executeMove('player', playerAction);
      if (this.result || this.foeFainted) return;
      this.executeMove('foe', foeAction);
    } else {
      this.executeMove('foe', foeAction);
      if (this.result || this.playerNeedsSwitch || !this.player || this.player.hp <= 0) return;
      this.executeMove('player', playerAction);
    }
  }

  moveForAction(action, side) {
    if (!action || action.type !== 'move') return null;
    if (action.index == null || action.index < 0) {
      return { id: 'struggle', name: 'Struggle', type: 'NORMAL', power: 50, acc: 100, pp: 1, struggle: true };
    }
    const actor = side === 'player' ? this.player : this.foe;
    if (!actor) return null;
    const slot = actor.moves[action.index];
    if (!slot) return null;
    return getMove(slot.id);
  }

  executeMove(side, action) {
    const attacker = side === 'player' ? this.player : this.foe;
    const defender = side === 'player' ? this.foe : this.player;
    if (!attacker || !defender || attacker.hp <= 0 || defender.hp <= 0) return;
    if (side === 'foe' && this.foeFainted) return;

    let slot = null;
    let move = null;
    if (action && action.type === 'move' && action.index >= 0) {
      slot = attacker.moves[action.index];
      if (!slot) return;
      move = getMove(slot.id);
      if (!move) return;
      if (slot.pp <= 0) {
        this.push(`${attacker.name} has no energy left for ${move.name}!`);
        move = { id: 'struggle', name: 'Struggle', type: 'NORMAL', power: 50, acc: 100, pp: 1, struggle: true };
        slot = null;
      }
    } else {
      move = { id: 'struggle', name: 'Struggle', type: 'NORMAL', power: 50, acc: 100, pp: 1, struggle: true };
    }

    // Flinch is consumed before status checks.
    if (attacker.volatile && attacker.volatile.flinch) {
      attacker.volatile.flinch = false;
      this.push(`${attacker.name} flinched and couldn't move!`);
      return;
    }

    // Sleep counter lands on zero this turn: wake up, but skip the action.
    if (attacker.status === 'SLP') {
      attacker.statusTurns = Math.max(0, (attacker.statusTurns || 1) - 1);
      if (attacker.statusTurns <= 0) {
        attacker.status = null;
        this.push(`${attacker.name} woke up!`);
      } else {
        this.push(`${attacker.name} is fast asleep.`);
      }
      this.anim('status', side);
      return;
    }
    if (attacker.status === 'FRZ') {
      if (this.rng() < 0.2) {
        attacker.status = null;
        this.push(`${attacker.name} thawed out!`);
      } else {
        this.push(`${attacker.name} is frozen solid!`);
        this.anim('status', side);
        return;
      }
    }
    if (attacker.status === 'PAR' && this.rng() < 0.25) {
      this.push(`${attacker.name} is paralysed and can't move!`);
      this.anim('status', side);
      return;
    }
    if (attacker.volatile && attacker.volatile.confusion > 0) {
      attacker.volatile.confusion--;
      if (this.rng() < 0.33) {
        const dmg = Math.max(1, Math.floor(calcDamage({
          level: attacker.level, power: 40, atk: effectiveStat(attacker, 'atk', { physical: true }),
          def: effectiveStat(attacker, 'def'), roll: 217 + rngInt(this.rng, 39)
        }) * 0.5));
        attacker.hp = Math.max(0, attacker.hp - dmg);
        this.push(`${attacker.name} is confused!`);
        this.push(`It hurt itself in its confusion!`);
        this.anim('hit', side);
        if (attacker.hp <= 0) this.handleFaint(side);
        return;
      }
      this.push(`${attacker.name} is confused!`);
    }

    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    this.push(`${attacker.name} used ${move.name}!`);
    this.anim('move', side);

    // Accuracy uses stage multipliers. Swift still uses 100 here.
    const acc = Math.min(100, (move.acc || 100) * accuracyMult(attacker.stages.acc || 0) / accuracyMult(defender.stages.eva || 0));
    if (this.rng() * 100 >= acc) {
      this.push(`${attacker.name}'s attack missed!`);
      this.anim('miss', side);
      return;
    }

    if (move.power && move.fixedDamage == null) {
      this.dealDamage(side, attacker, defender, move);
    } else if (move.fixedDamage != null) {
      const amount = move.fixedDamage === 'level' ? attacker.level : Number(move.fixedDamage);
      this.applyDamage(side, defender, amount, { fixed: true });
      this.push(`${defender.name} lost ${amount} HP.`);
      if (defender.hp <= 0) this.handleFaint(side === 'player' ? 'foe' : 'player');
    } else {
      this.applyMoveEffect(side, attacker, defender, move);
    }

    if (move.effect && move.power) this.applyMoveEffect(side, attacker, defender, move, true);
    if (move.struggle && attacker.hp > 0) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp / 4));
      attacker.hp = Math.max(0, attacker.hp - recoil);
      this.push(`${attacker.name} is hit with recoil!`);
      if (attacker.hp <= 0) this.handleFaint(side);
    }
  }

  dealDamage(side, attacker, defender, move) {
    const special = isSpecialType(move.type);
    const baseSpeed = (CREATURES[attacker.species] && CREATURES[attacker.species].base.spd) || 50;
    const critical = criticalCheck(baseSpeed, this.rng() * 256, !!move.highCrit);
    const atk = critical ? attacker.stats[special ? 'spc' : 'atk'] : effectiveStat(attacker, special ? 'spc' : 'atk', { physical: !special });
    const def = critical ? defender.stats[special ? 'spc' : 'def'] : effectiveStat(defender, special ? 'spc' : 'def');
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const type = typeMultiplier(move.type, defender.types);
    if (type === 0) {
      this.push(`It doesn't affect ${defender.name}...`);
      this.anim('miss', side);
      return;
    }
    const hits = move.multi ? move.multi[0] + rngInt(this.rng, move.multi[1] - move.multi[0] + 1) : 1;
    let total = 0;
    for (let i = 0; i < hits; i++) {
      total += calcDamage({
        level: attacker.level,
        power: move.power,
        atk,
        def,
        stab,
        type,
        critical,
        roll: 217 + rngInt(this.rng, 39)
      });
    }
    total = Math.max(1, total);
    if (defender.volatile && defender.volatile.endure && total >= defender.hp) {
      total = Math.max(1, defender.hp - 1);
      defender.volatile.endure = false;
      this.push(`${defender.name} endured the hit!`);
    }
    this.applyDamage(side, defender, total, { critical, hits });
    if (critical) this.push('A critical hit!');
    const eff = effectivenessText(type);
    if (eff) this.push(eff);
    if (hits > 1) this.push(`Hit ${hits} times!`);
    this.push(`${defender.name} lost ${total} HP.`);
    if (move.effect && move.effect.flinch && defender.hp > 0) {
      if (this.rng() * 100 < move.effect.flinch) {
        defender.volatile.flinch = true;
        this.push(`${defender.name} flinched!`);
      }
    }
    this.afterDamage(attacker, defender, total, move, side);
    if (defender.hp <= 0) this.handleFaint(side === 'player' ? 'foe' : 'player');
  }

  applyDamage(side, defender, amount, meta = {}) {
    defender.hp = Math.max(0, defender.hp - Math.max(0, Math.floor(amount)));
    this.anim('hit', side === 'player' ? 'foe' : 'player');
    if (meta.critical) this.anim('critical', side === 'player' ? 'foe' : 'player');
  }

  afterDamage(attacker, defender, damage, move, side) {
    const effect = move.effect || {};
    if (effect.drain && attacker.hp > 0) {
      const healed = Math.max(1, Math.floor(damage * effect.drain));
      const got = healCreature(attacker, healed);
      if (got > 0) this.push(`${attacker.name} drained ${got} HP.`);
    }
    if (defender.hp <= 0) return;
    if (effect.status && this.rng() * 100 < (effect.chance || 100)) {
      this.inflictStatus(attacker, defender, effect.status, move.type);
    }
    if (effect.stat && this.rng() * 100 < (effect.chance || 100)) {
      this.applyStatChange(attacker, defender, effect.stat, side);
    }
    if (effect.confuse && this.rng() * 100 < (effect.chance || 100)) {
      this.inflictConfusion(attacker, defender, side);
    }
  }

  applyMoveEffect(side, attacker, defender, move, secondary = false) {
    const e = move.effect || {};
    if (e.heal && attacker.hp > 0) {
      const amount = Math.max(1, Math.floor(attacker.maxHp * e.heal));
      const got = healCreature(attacker, amount);
      if (got > 0) this.push(`${attacker.name} recovered ${got} HP!`);
      else this.push(`${attacker.name}'s HP is already full.`);
    }
    if (e.stat && (!secondary || this.rng() * 100 < (e.chance || 100))) {
      this.applyStatChange(attacker, defender, e.stat, side);
    }
    if (e.extraStat) {
      this.applyStatChange(attacker, attacker, { ...e.extraStat, target: 'self' }, side);
    }
    if (e.status && (!secondary || this.rng() * 100 < (e.chance || 100))) {
      this.inflictStatus(attacker, defender, e.status, move.type);
    }
    if (e.confuse && (!secondary || this.rng() * 100 < (e.chance || 100))) {
      this.inflictConfusion(attacker, defender, side);
    }
    if (e.endure) {
      attacker.volatile.endure = true;
      this.push(`${attacker.name} braced itself!`);
    }
    if (!e.heal && !e.stat && !e.extraStat && !e.status && !e.confuse && !e.endure && !e.flinch && !e.drain) {
      this.push('But nothing happened!');
    }
  }

  applyStatChange(attacker, defender, spec, side) {
    const who = spec.target === 'self' ? attacker : defender;
    const labelSide = spec.target === 'self' ? side : (side === 'player' ? 'foe' : 'player');
    const key = spec.stat;
    if (!(key in who.stages)) return;
    const before = who.stages[key] || 0;
    const after = Math.max(-6, Math.min(6, before + spec.stages));
    if (after === before) {
      this.push(`${who.name}'s ${STAT_LABEL[key]} won't go any ${spec.stages > 0 ? 'higher' : 'lower'}!`);
      return;
    }
    who.stages[key] = after;
    const word = Math.abs(spec.stages) > 1
      ? (spec.stages > 0 ? 'sharply rose' : 'sharply fell')
      : (spec.stages > 0 ? 'rose' : 'fell');
    this.push(`${who.name}'s ${STAT_LABEL[key]} ${word}!`);
    this.anim('stat', labelSide);
  }

  inflictStatus(attacker, target, status, sourceType) {
    if (!target || target.hp <= 0) return;
    if (target.status) {
      this.push(`${target.name} is already affected.`);
      return;
    }
    if ((status === 'PSN' && target.types.includes('POISON')) ||
        (status === 'BRN' && target.types.includes('FIRE')) ||
        (status === 'FRZ' && target.types.includes('ICE')) ||
        (status === 'PAR' && target.types.includes('GROUND') && sourceType === 'ELECTRIC')) {
      this.push(`It doesn't affect ${target.name}...`);
      return;
    }
    target.status = status;
    if (status === 'SLP') {
      target.statusTurns = 1 + rngInt(this.rng, 3);
      this.push(`${target.name} fell asleep!`);
    } else if (status === 'PAR') {
      this.push(`${target.name} is paralysed! It may be unable to move!`);
    } else if (status === 'BRN') {
      this.push(`${target.name} was burned!`);
    } else if (status === 'PSN') {
      this.push(`${target.name} was poisoned!`);
    } else if (status === 'FRZ') {
      this.push(`${target.name} was frozen solid!`);
    }
    this.anim('status', target === this.player ? 'player' : 'foe');
  }

  inflictConfusion(attacker, target, side) {
    if (target.volatile.confusion > 0) {
      this.push(`${target.name} is already confused.`);
      return;
    }
    target.volatile.confusion = 1 + rngInt(this.rng, 4);
    this.push(`${target.name} became confused!`);
    this.anim('status', target === this.player ? 'player' : 'foe');
  }

  handleFaint(side) {
    if (side === 'foe') {
      const foe = this.foe;
      if (!foe || this.foeFainted) return;
      this.push(`${foe.name} fainted!`);
      this.anim('faint', 'foe');
      this.foeFainted = true;
      if (this.player && this.player.hp > 0) {
        awardStatExp(this.player, foe.species);
        let amount = expYield(foe.species, foe.level);
        if (this.kind === 'trainer') amount = Math.floor(amount * 1.5);
        const res = gainExperience(this.player, amount, this.rng);
        this.push(`${this.player.name} gained ${amount} EXP.`);
        for (const msg of res.messages) this.push(msg);
      }
      if (this.kind === 'wild') {
        this.result = 'win';
        this.phase = 'ended';
        this.push('You won the battle!');
      } else if (!this.foeAlive) {
        this.result = 'win';
        this.phase = 'ended';
        if (this.trainer) this.push(`You defeated ${this.trainer.name}!`);
      }
    } else {
      const player = this.player;
      if (!player || player.hp > 0) return;
      // Avoid repeating the faint message.
      if (player._faintQueued) return;
      player._faintQueued = true;
      this.push(`${player.name} fainted!`);
      this.anim('faint', 'player');
      if (!this.playerAlive) {
        this.result = 'lose';
        this.phase = 'ended';
        this.push('You have no creatures left...');
      } else {
        this.playerNeedsSwitch = true;
      }
    }
  }

  endOfTurn() {
    if (this.result) return;
    // Residual damage.
    for (const side of ['player', 'foe']) {
      const c = side === 'player' ? this.player : this.foe;
      if (!c || c.hp <= 0) continue;
      if (c.status === 'PSN' || c.status === 'BRN') {
        const dmg = Math.max(1, Math.floor(c.maxHp / 16));
        c.hp = Math.max(0, c.hp - dmg);
        this.push(`${c.name} is hurt by ${c.status === 'BRN' ? 'its burn' : 'poison'}!`);
        this.anim('hit', side);
        if (c.hp <= 0) this.handleFaint(side);
      }
    }
    if (this.result) return;

    // Clear one-turn volatiles.
    for (const c of this.playerParty) if (c.volatile) c.volatile.flinch = false;
    for (const c of this.foeParty) if (c.volatile) c.volatile.flinch = false;
    for (const c of this.playerParty) if (c.volatile) c.volatile.endure = false;

    // Trainer replacement.
    if (this.foeFainted && this.kind === 'trainer' && this.foeParty.some(c => c.hp > 0)) {
      const next = this.foeParty.findIndex(c => c.hp > 0);
      this.foeIndex = next;
      this.foeFainted = false;
      const c = this.foe;
      c.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
      c.volatile = { flinch: false, confusion: 0, endure: false };
      this.push(`${this.trainer.name} sent out ${c.name}!`);
    }

    if (this.playerNeedsSwitch) {
      this.playerNeedsSwitch = false;
      this.phase = 'switch';
    } else {
      this.phase = 'choose';
    }
  }

  doSwitch(index, forced = true) {
    if (index === this.playerIndex) {
      this.push(`${this.player.name} is already in battle!`);
      return false;
    }
    const c = this.playerParty[index];
    if (!c || c.hp <= 0) {
      this.push('That creature cannot battle.');
      return false;
    }
    const old = this.player;
    old.stages = { atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 };
    old.volatile = { flinch: false, confusion: 0, endure: false };
    this.playerIndex = index;
    c._faintQueued = false;
    this.push(`${old.name}, come back!`);
    this.push(`Go! ${c.name}!`);
    if (forced) this.phase = 'choose';
    return true;
  }

  forceSwitch(index) {
    if (this.phase !== 'switch') return false;
    const ok = this.doSwitch(index, true);
    return ok;
  }

  chooseFoeAction() {
    const foe = this.foe;
    if (!foe || foe.hp <= 0) return null;
    const usable = foe.moves.map((m, i) => ({ slot: m, move: getMove(m.id), index: i })).filter(x => x.move && x.slot.pp > 0);
    if (!usable.length) return { type: 'move', index: -1 };
    const attacker = foe;
    const defender = this.player;
    const scored = usable.map(x => {
      let score = 0;
      if (x.move.power) score = estimateDamage(attacker, defender, x.move) * 8;
      else {
        score = 25;
        if (x.move.effect && x.move.effect.status && defender.status) score = 1;
        if (x.move.effect && x.move.effect.heal && attacker.hp >= attacker.maxHp * 0.7) score = 1;
        if (x.move.effect && x.move.effect.stat) score = 18;
      }
      if (x.move.acc && x.move.acc < 80) score *= 0.7;
      return { ...x, score };
    }).sort((a, b) => b.score - a.score);
    const smart = this.trainer ? this.trainer.smart !== false : false;
    let chosen;
    if (smart && this.rng() < 0.78) chosen = scored[0];
    else chosen = scored[rngInt(this.rng, scored.length)];
    return { type: 'move', index: chosen.index };
  }

  foeAttack(foeAction) {
    if (!foeAction || this.result || !this.foe || this.foe.hp <= 0) return;
    this.executeMove('foe', foeAction);
  }

  doRun() {
    if (!this.canRun) {
      this.push("No! There's no running from a trainer battle!");
      return false;
    }
    const p = effectiveStat(this.player, 'spd');
    const f = effectiveStat(this.foe, 'spd');
    this.runAttempts++;
    let chance;
    if (p >= f) chance = 255;
    else chance = Math.min(255, Math.floor(p * 128 / Math.max(1, f)) + 30 * this.runAttempts);
    if (this.rng() * 256 < chance) {
      this.result = 'fled';
      this.phase = 'ended';
      this.push('Got away safely!');
      return true;
    }
    this.push("Can't escape!");
    return false;
  }

  doBall(itemId) {
    if (!this.canCatch) {
      this.push("You can't catch another trainer's creature!");
      return 'failed';
    }
    const item = ITEMS[itemId];
    if (!item || item.kind !== 'ball' || !this.bag[itemId]) {
      this.push('You have none of those!');
      return 'failed';
    }
    this.bag[itemId]--;
    if (this.bag[itemId] <= 0) delete this.bag[itemId];
    this.push(`You used ${item.name}!`);
    this.anim('ball', 'foe');
    const foe = this.foe;
    const statusBonus = foe.status === 'SLP' || foe.status === 'FRZ' ? 25 : (foe.status ? 12 : 0);
    const rate = Math.min(255, Math.max(1,
      Math.floor(((3 * foe.maxHp - 2 * foe.hp) * (CREATURES[foe.species].catchRate || 45) * item.ball) / (3 * foe.maxHp)) + statusBonus
    ));
    let shakes = 0;
    for (let i = 0; i < 3; i++) {
      if (this.rng() * 256 < rate) shakes++;
      else break;
    }
    if (shakes >= 3) {
      this.caughtCreature = foe;
      this.result = 'caught';
      this.phase = 'ended';
      this.push(`Gotcha! ${foe.name} was caught!`);
      return 'ended';
    }
    this.push(shakes === 0 ? 'Oh no! The creature broke free!' : `Aww! It appeared to be caught!`);
    return 'ok';
  }

  doItem(action) {
    const item = ITEMS[action.itemId];
    if (!item) return 'failed';
    if (!this.bag[action.itemId]) {
      this.push('You have none of those!');
      return 'failed';
    }
    const target = this.playerParty[action.targetIndex] || this.player;
    if (!target) return 'failed';
    if (item.kind === 'heal') {
      if (target.hp <= 0) { this.push('It will not have any effect on a fainted creature!'); return 'failed'; }
      if (target.hp >= target.maxHp) { this.push('It will not have any effect.'); return 'failed'; }
      const got = healCreature(target, item.hp);
      this.push(`${target.name} recovered ${got} HP!`);
    } else if (item.kind === 'cure') {
      if (!cureStatus(target, item.status)) { this.push('It will not have any effect.'); return 'failed'; }
      this.push(`${target.name} was cured!`);
    } else if (item.kind === 'revive') {
      if (!reviveCreature(target, item.hpRatio)) { this.push('It will not have any effect.'); return 'failed'; }
      target._faintQueued = false;
      this.push(`${target.name} was revived!`);
    } else {
      this.push("That can't be used here!");
      return 'failed';
    }
    this.bag[action.itemId]--;
    if (this.bag[action.itemId] <= 0) delete this.bag[action.itemId];
    this.anim('heal', target === this.player ? 'player' : 'foe');
    return 'ok';
  }

  // UI helper: current move list for the active player.
  playerMoves() {
    return this.player.moves.map((slot, index) => ({ slot, move: getMove(slot.id), index }));
  }

  forceEnd(result) {
    this.result = result;
    this.phase = 'ended';
  }
}

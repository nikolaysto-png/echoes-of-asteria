import { TRAINERS, SHOP_STOCKS } from '../data/story.js';
import { ITEMS } from '../data/items.js';
import { addItem, removeItem } from '../core/state.js';
import { createCreature, healParty } from './creature.js';

// ---------------------------------------------------------------------------
// Data-driven event interpreter.
//
// A script is an array of commands. The interpreter is async, so dialogue,
// shops, storage and battles can all pause the script without any scene
// hard-coding the quest logic.
// ---------------------------------------------------------------------------

export function conditionMet(game, cond) {
  if (cond == null) return true;
  if (Array.isArray(cond)) return cond.every(c => conditionMet(game, c));
  if (typeof cond === 'function') return !!cond(game);
  if (cond.all) return cond.all.every(c => conditionMet(game, c));
  if (cond.any) return cond.any.some(c => conditionMet(game, c));
  if (cond.not) return !conditionMet(game, cond.not);
  const st = game.state;
  if (cond.flag != null) return !!st.flags[cond.flag];
  if (cond.notFlag != null) return !st.flags[cond.notFlag];
  if (cond.trainerDefeated != null) return !!st.defeatedTrainers[cond.trainerDefeated];
  if (cond.trainerNotDefeated != null) return !st.defeatedTrainers[cond.trainerNotDefeated];
  if (cond.item != null) {
    const spec = typeof cond.item === 'string' ? { id: cond.item, qty: 1 } : cond.item;
    return (st.bag[spec.id] || 0) >= (spec.qty || 1);
  }
  if (cond.noItem != null) {
    const id = typeof cond.noItem === 'string' ? cond.noItem : cond.noItem.id;
    return !st.bag[id];
  }
  if (cond.partyHas != null) return st.party.some(c => c.species === cond.partyHas);
  if (cond.map != null) return st.map === cond.map;
  if (cond.coinsAtLeast != null) return st.coins >= cond.coinsAtLeast;
  if (cond.chance != null) return game.rng ? game.rng() < Number(cond.chance) : Math.random() < Number(cond.chance);
  return true;
}

function linesOf(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value == null) return [];
  return [String(value)];
}

function normalizeCommands(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export class ScriptInterpreter {
  constructor(game) {
    this.game = game;
  }

  async run(script, ctx = {}) {
    for (const command of normalizeCommands(script)) {
      const stop = await this.execute(command, ctx);
      if (stop) return;
    }
  }

  /** Returns true when a command ends the script immediately. */
  async execute(command, ctx) {
    if (command == null) return false;
    if (Array.isArray(command)) {
      await this.run(command, ctx);
      return false;
    }
    if (typeof command === 'string') {
      await this.game.say([command]);
      return false;
    }
    const game = this.game;
    const st = game.state;

    if (command.if != null) {
      await this.run(conditionMet(game, command.if) ? command.then : command.else, ctx);
      return false;
    }

    if (command.say != null) {
      const lines = linesOf(command.say);
      // Some scripts may be triggered while the player is standing on the
      // target; sync position before a long dialogue so a save is coherent.
      game.world?.syncState();
      await game.say(lines, command.speaker || ctx.speaker);
      return false;
    }

    if (command.choice != null) {
      const choice = command.choice;
      const options = (choice.options || []).map(o => o.label || String(o));
      const index = await game.choose(choice.prompt || '', options);
      const picked = (choice.options || [])[index];
      if (picked) await this.run(picked.commands, ctx);
      return false;
    }

    if (command.set != null) {
      const spec = command.set;
      if (typeof spec === 'string') st.flags[spec] = true;
      else {
        for (const [key, value] of Object.entries(spec)) {
          if (key === 'flag') st.flags[spec.flag] = spec.value !== undefined ? spec.value : true;
          else if (key !== 'value') st.flags[key] = value;
        }
      }
      game.world?.refreshState();
      return false;
    }

    if (command.clearFlag != null) {
      delete st.flags[command.clearFlag];
      return false;
    }

    if (command.giveItem != null) {
      const qty = Math.max(1, Number(command.qty || command.amount || 1));
      addItem(st, command.giveItem, qty);
      game.audio.sfx('item');
      return false;
    }

    if (command.removeItem != null) {
      removeItem(st, command.removeItem, Math.max(1, Number(command.qty || 1)));
      return false;
    }

    if (command.giveCreature != null) {
      const spec = typeof command.giveCreature === 'string'
        ? { species: command.giveCreature, level: command.level || 5 }
        : command.giveCreature;
      const c = createCreature(spec.species, spec.level || 5, {
        nickname: spec.nickname,
        metMap: st.map,
        originalTrainer: st.playerName
      });
      if (command.storage || st.party.length >= 6) st.storage.push(c);
      else st.party.push(c);
      st.seen[c.species] = true;
      st.caught[c.species] = (st.caught[c.species] || 0) + 1;
      game.audio.sfx('levelup');
      return false;
    }

    if (command.starter) {
      const species = await game.chooseStarter();
      if (species) {
        const c = createCreature(species, 5, { metMap: 'lab', originalTrainer: st.playerName });
        st.party.push(c);
        st.flags.got_starter = true;
        st.seen[species] = true;
        st.caught[species] = (st.caught[species] || 0) + 1;
        game.audio.sfx('levelup');
        await game.say([`${c.name} joined your party!`]);
      }
      return false;
    }

    if (command.battle != null) {
      let result;
      if (typeof command.battle === 'string') {
        result = await this.trainerBattle(command.battle);
        if (result === 'win') {
          await this.run(command.win, ctx);
        } else if (result === 'lose' && command.lose) {
          await this.run(command.lose, ctx);
        } else if (result === 'fled' && command.fled) {
          await this.run(command.fled, ctx);
        }
      } else {
        result = await this.wildBattle(command.battle);
        if (result === 'win' && command.win) await this.run(command.win, ctx);
        if (result === 'lose' && command.lose) await this.run(command.lose, ctx);
      }
      return false;
    }

    if (command.heal) {
      healParty(st.party);
      if (command.respawn) st.respawn = { ...command.respawn };
      game.audio.sfx('heal');
      return false;
    }

    if (command.shop != null) {
      await game.openShop(command.shop, game.shopStock ? game.shopStock(command.shop) : SHOP_STOCKS[command.shop]);
      return false;
    }

    if (command.storage) {
      await game.openStorage();
      return false;
    }

    if (command.ending) {
      await game.startEnding();
      return true;
    }

    if (command.warp != null) {
      const w = command.warp;
      await game.warpPlayer({ map: w.map || w.to, x: w.x, y: w.y, dir: w.dir || 'down' });
      return false;
    }

    if (command.move != null) {
      const spec = typeof command.move === 'string' ? { event: command.move } : command.move;
      if (game.world) {
        if (spec.event) await game.world.moveEventScript(spec.event, spec.dir || 'down', spec.steps || 1);
        else await game.world.movePlayerScript(spec.dir || 'down', spec.steps || 1);
      }
      return false;
    }

    if (command.face != null) {
      const spec = typeof command.face === 'string' ? { event: command.face } : command.face;
      game.world?.faceActor(spec.event, spec.dir || 'down');
      return false;
    }

    if (command.wait != null) {
      const ms = Math.max(0, Number(command.wait) || 0);
      await new Promise(resolve => setTimeout(resolve, ms));
      return false;
    }

    if (command.sfx != null) {
      game.audio.sfx(command.sfx);
      return false;
    }

    if (command.music != null) {
      if (command.music === 'map') game.refreshMusic();
      else game.audio.playMusic(command.music);
      return false;
    }

    if (command.shake != null) {
      game.r.addShake(Number(command.shake) || 2);
      return false;
    }

    if (command.setTile != null) {
      const spec = command.setTile;
      const mapId = spec.map || st.map;
      if (!game.setMapTile(mapId, spec.x, spec.y, spec.char || spec.tile)) {
        console.warn('[event] invalid setTile', spec);
      }
      return false;
    }

    if (command.hide != null) {
      game.world?.hideEvent(command.hide);
      return false;
    }

    console.warn('[event] unknown command', command);
    return false;
  }

  async trainerBattle(id) {
    const trainer = TRAINERS[id];
    const game = this.game;
    const st = game.state;
    if (!trainer) throw new Error(`Unknown trainer: ${id}`);
    // Repeating a trainer who has already been beaten should never trap the
    // player in a battle script without a win branch.
    if (st.defeatedTrainers[id]) {
      await game.say([`${trainer.name} has already been beaten.`, 'There is nothing left to prove here.'], trainer.name);
      return 'already';
    }
    const result = await game.startTrainerBattle(trainer);
    if (result === 'win') {
      st.defeatedTrainers[id] = true;
      const reward = trainer.reward || {};
      if (reward.money) st.coins = Math.min(999999, st.coins + reward.money);
      for (const item of reward.items || []) addItem(st, item.id, item.amount || 1);
      game.audio.sfx('save');
    }
    return result;
  }

  async wildBattle(spec) {
    const game = this.game;
    const cfg = typeof spec === 'string' ? { species: spec } : spec;
    const level = cfg.level || 5;
    const foe = createCreature(cfg.species, level, { metMap: game.state.map });
    game.state.seen[cfg.species] = true;
    return game.startWildBattle(foe, { canRun: cfg.canRun !== false });
  }
}

export async function runEventScript(game, map, event, runtime = null) {
  if (!event || !event.script) return;
  if (game.scriptActive) return;
  const key = `evt:${map.id}:${event.id}`;
  if (event.once && game.state.flags[key]) return;

  game.scriptActive = true;
  const interpreter = new ScriptInterpreter(game);
  try {
    await interpreter.run(event.script, { map, event });
    if (event.once) {
      game.state.flags[key] = true;
      if (runtime && runtime.hideEvent) runtime.hideEvent(event.id);
      else game.world?.hideEvent(event.id);
    }
  } catch (err) {
    console.error('[event] script failed', map.id, event.id, err);
    game.scriptActive = false;
    await game.say(['The world stumbles for a moment. Try that again.']);
  } finally {
    game.scriptActive = false;
    if (game.world) game.world.interactCooldown = 0.25;
  }
}

export async function runMapEnter(game, map) {
  if (!map || !map.onEnter || game.scriptActive) return;
  game.scriptActive = true;
  const interpreter = new ScriptInterpreter(game);
  try {
    await interpreter.run(map.onEnter, { map });
  } catch (err) {
    console.error('[event] onEnter failed', map.id, err);
  } finally {
    game.scriptActive = false;
  }
}

export async function runScriptList(game, script, ctx = {}) {
  const interpreter = new ScriptInterpreter(game);
  return interpreter.run(script, ctx);
}

export function shopStock(id) {
  return SHOP_STOCKS[id] || null;
}

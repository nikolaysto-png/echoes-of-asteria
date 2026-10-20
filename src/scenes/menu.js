import { W, H, PAL } from '../core/constants.js';
import { drawBox, hpBar, expBar, clockText } from '../render/ui.js';
import { drawCreature } from '../render/sprites.js';
import { CREATURES, DEX_ORDER } from '../data/creatures.js';
import { ITEMS } from '../data/items.js';
import { getMove } from '../data/moves.js';
import { MAPS } from '../data/maps.js';
import { expForLevel } from '../systems/creature.js';
import { removeItem } from '../core/state.js';

const MAIN = [
  { label: 'ECHOES', mode: 'party' },
  { label: 'BAG', mode: 'bag' },
  { label: 'BESTIARY', mode: 'dex' },
  { label: 'TRAINER', mode: 'trainer' },
  { label: 'SAVE', mode: 'save' },
  { label: 'OPTIONS', mode: 'options' },
  { label: 'CLOSE', mode: 'close' }
];

const OPTION_ROWS = [
  { key: 'music', label: 'MUSIC', kind: 'bool' },
  { key: 'sfx', label: 'SOUND FX', kind: 'bool' },
  { key: 'textSpeed', label: 'TEXT SPEED', kind: 'speed' },
  { key: 'shake', label: 'SCREEN SHAKE', kind: 'bool' },
  { key: 'mute', label: 'MUTE ALL', kind: 'bool' }
];

const isA = inp => inp.anyOf('z', 'enter');
const isB = inp => inp.anyOf('x', 'escape', 'backspace');

function expProgress(c) {
  const def = CREATURES[c.species];
  if (!def) return 0;
  const group = def.growth || 'medium';
  const lo = expForLevel(c.level, group);
  const hi = expForLevel(c.level + 1, group);
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(1, (c.exp - lo) / (hi - lo)));
}

function optionValue(settings, row) {
  const v = settings[row.key];
  if (row.kind === 'speed') return ['SLOW', 'NORMAL', 'FAST'][v] || 'NORMAL';
  return v ? 'ON' : 'OFF';
}

function changeOption(settings, row, direction) {
  if (row.kind === 'speed') {
    settings.textSpeed = Math.max(0, Math.min(2, (settings.textSpeed ?? 1) + direction));
  } else {
    settings[row.key] = !settings[row.key];
  }
}

function drawBackground(r, title, game) {
  r.rect(0, 0, W, H, PAL.pale);
  r.dither(0, 0, W, H, PAL.light, 4);
  drawBox(r, 1, 1, W - 2, H - 2, { fill: PAL.pale, inner: false });
  r.rect(2, 2, W - 4, 12, PAL.dark);
  r.text(title, 6, 5, { color: PAL.pale });
  if (game) {
    const map = MAPS[game.state.map];
    const place = map ? map.name.toUpperCase() : 'ASTERIA';
    r.text(place, W - 6, 5, { color: PAL.light, align: 'right', maxWidth: 82 });
  }
  r.rect(4, 15, W - 8, 1, PAL.mid);
}

function drawMessage(r, text, t) {
  if (!text) return;
  const lines = String(text).split('\n');
  const h = 12 + Math.min(2, lines.length) * 8;
  drawBox(r, 4, H - h - 3, W - 8, h);
  r.text(lines.slice(0, 2).join('\n'), 8, H - h + 1, {
    color: PAL.dark, maxWidth: W - 16, lineHeight: 8
  });
}

/** The in-game start menu. It is always an overlay so the world stays paused. */
export class MenuScene {
  constructor() {
    this.mode = 'main';
    this.index = 0;
    this.sel = 0;
    this.target = 0;
    this.pendingItem = null;
    this.message = '';
    this.messageT = 0;
    this.confirm = 0;
    this.t = 0;
  }

  enter(game) {
    this.game = game;
    game.audio.sfx('select');
  }

  setMessage(text, seconds = 2.2) {
    this.message = text;
    this.messageT = seconds;
  }

  bagList() {
    const st = this.game.state;
    const order = { heal: 0, cure: 1, revive: 2, ball: 3, key: 4 };
    return Object.keys(st.bag)
      .filter(id => ITEMS[id] && st.bag[id] > 0)
      .map(id => ({ id, item: ITEMS[id], count: st.bag[id] }))
      .sort((a, b) => {
        const ak = order[a.item.kind] ?? 9;
        const bk = order[b.item.kind] ?? 9;
        if (ak !== bk) return ak - bk;
        return a.item.name.localeCompare(b.item.name);
      });
  }

  dexList() {
    const st = this.game.state;
    return DEX_ORDER.filter(id => st.seen[id] || st.caught[id]);
  }

  update(game, dt) {
    this.t += dt;
    if (this.messageT > 0) {
      this.messageT = Math.max(0, this.messageT - dt);
      if (this.messageT === 0) this.message = '';
    }
    const inp = game.input;
    switch (this.mode) {
      case 'main': return this.updateMain(game, inp);
      case 'party': return this.updateParty(game, inp);
      case 'summary': return this.updateSummary(game, inp);
      case 'bag': return this.updateBag(game, inp);
      case 'target': return this.updateTarget(game, inp);
      case 'dex': return this.updateDex(game, inp);
      case 'dexDetail': return this.updateDexDetail(game, inp);
      case 'trainer': return this.updateTrainer(game, inp);
      case 'save': return this.updateSave(game, inp);
      case 'options': return this.updateOptions(game, inp);
      default: return;
    }
  }

  // --------------------------------------------------------------- updates
  updateMain(game, inp) {
    if (inp.anyOf('arrowdown', 's')) {
      this.index = (this.index + 1) % MAIN.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.index = (this.index - 1 + MAIN.length) % MAIN.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      game.closeOverlay(this);
      return;
    }
    if (!isA(inp)) return;
    game.audio.sfx('select');
    const mode = MAIN[this.index].mode;
    if (mode === 'close') {
      game.closeOverlay(this);
      return;
    }
    if (mode === 'options') this.sel = 0;
    else if (mode === 'save') this.confirm = 0;
    else this.sel = 0;
    this.mode = mode;
  }

  updateParty(game, inp) {
    const party = game.state.party;
    if (inp.anyOf('arrowdown', 's')) {
      if (party.length) this.sel = (this.sel + 1) % party.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      if (party.length) this.sel = (this.sel - 1 + party.length) % party.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
      return;
    }
    if (isA(inp)) {
      if (!party[this.sel]) {
        game.audio.sfx('error');
        this.setMessage('You have no Echoes yet.');
        return;
      }
      game.audio.sfx('select');
      this.mode = 'summary';
    }
  }

  updateSummary(game, inp) {
    if (isA(inp) || isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'party';
    }
  }

  updateBag(game, inp) {
    const list = this.bagList();
    if (list.length) this.sel = Math.max(0, Math.min(this.sel, list.length - 1));
    if (inp.anyOf('arrowdown', 's')) {
      if (list.length) this.sel = (this.sel + 1) % list.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      if (list.length) this.sel = (this.sel - 1 + list.length) % list.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
      return;
    }
    if (!isA(inp)) return;
    const entry = list[this.sel];
    if (!entry) {
      game.audio.sfx('error');
      this.setMessage('Your bag is empty.');
      return;
    }
    const item = entry.item;
    if (item.kind === 'key') {
      game.audio.sfx('cursor');
      this.setMessage(item.desc);
      return;
    }
    if (item.kind === 'ball') {
      game.audio.sfx('error');
      this.setMessage('Echo Balls can only be used in battle.');
      return;
    }
    if (item.kind === 'heal' || item.kind === 'cure' || item.kind === 'revive') {
      game.audio.sfx('select');
      this.pendingItem = entry.id;
      this.target = Math.max(0, game.state.party.findIndex(c => item.kind === 'revive' ? c.hp <= 0 : c.hp > 0));
      this.mode = 'target';
      return;
    }
    game.audio.sfx('error');
    this.setMessage('That item cannot be used here.');
  }

  updateTarget(game, inp) {
    const party = game.state.party;
    if (!party.length) { this.mode = 'bag'; return; }
    if (inp.anyOf('arrowdown', 's')) {
      this.target = (this.target + 1) % party.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.target = (this.target - 1 + party.length) % party.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'bag';
      return;
    }
    if (!isA(inp)) return;
    const item = ITEMS[this.pendingItem];
    const c = party[this.target];
    if (!item || !c) { game.audio.sfx('error'); return; }
    const result = this.applyItem(game.state, item, c);
    if (!result.ok) {
      game.audio.sfx('error');
      this.setMessage(result.text);
      return;
    }
    removeItem(game.state, this.pendingItem, 1);
    game.audio.sfx(item.kind === 'revive' ? 'levelup' : 'heal');
    this.setMessage(result.text);
    this.mode = 'bag';
    this.sel = 0;
    this.pendingItem = null;
  }

  applyItem(st, item, c) {
    if (item.kind === 'heal') {
      if (c.hp <= 0) return { ok: false, text: 'It will not affect a fainted Echo.' };
      if (c.hp >= c.maxHp) return { ok: false, text: `${c.name}'s HP is already full.` };
      const amount = Math.min(item.hp === 999 ? c.maxHp : item.hp, c.maxHp - c.hp);
      c.hp += amount;
      return { ok: true, text: `${c.name} recovered ${amount} HP.` };
    }
    if (item.kind === 'cure') {
      if (!c.status || !(item.status || []).includes(c.status)) {
        return { ok: false, text: 'It will not have any effect.' };
      }
      c.status = null;
      c.statusTurns = 0;
      return { ok: true, text: `${c.name} was cured.` };
    }
    if (item.kind === 'revive') {
      if (c.hp > 0) return { ok: false, text: 'It will not affect an Echo that is still standing.' };
      c.hp = Math.max(1, Math.round(c.maxHp * (item.hpRatio || 0.5)));
      c.status = null;
      c.statusTurns = 0;
      return { ok: true, text: `${c.name} was revived.` };
    }
    return { ok: false, text: 'It will not have any effect.' };
  }

  updateDex(game, inp) {
    const list = this.dexList();
    if (list.length) this.sel = Math.max(0, Math.min(this.sel, list.length - 1));
    if (inp.anyOf('arrowdown', 's')) {
      if (list.length) this.sel = (this.sel + 1) % list.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      if (list.length) this.sel = (this.sel - 1 + list.length) % list.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
      return;
    }
    if (!isA(inp)) return;
    if (!list[this.sel]) {
      game.audio.sfx('error');
      this.setMessage('You have not met any Echoes yet.');
      return;
    }
    game.audio.sfx('select');
    this.mode = 'dexDetail';
  }

  updateDexDetail(game, inp) {
    if (isA(inp) || isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'dex';
    }
  }

  updateTrainer(game, inp) {
    if (isA(inp) || isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
    }
  }

  updateSave(game, inp) {
    if (inp.anyOf('arrowleft', 'a') || inp.anyOf('arrowright', 'd') ||
        inp.anyOf('arrowup', 'w') || inp.anyOf('arrowdown', 's')) {
      this.confirm = 1 - this.confirm;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
      return;
    }
    if (!isA(inp)) return;
    if (this.confirm === 0) {
      const res = game.save();
      game.audio.sfx(res.ok ? 'save' : 'error');
      this.setMessage(res.ok ? 'Your journey has been recorded.' : `Could not save: ${res.error || 'unknown error'}`);
    } else {
      game.audio.sfx('cancel');
    }
    this.mode = 'main';
  }

  updateOptions(game, inp) {
    const s = game.state.settings;
    if (inp.anyOf('arrowdown', 's')) {
      this.sel = (this.sel + 1) % OPTION_ROWS.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.sel = (this.sel - 1 + OPTION_ROWS.length) % OPTION_ROWS.length;
      game.audio.sfx('cursor');
    }
    let changed = false;
    if (inp.anyOf('arrowleft', 'a')) {
      changeOption(s, OPTION_ROWS[this.sel], -1);
      changed = true;
    }
    if (inp.anyOf('arrowright', 'd')) {
      changeOption(s, OPTION_ROWS[this.sel], 1);
      changed = true;
    }
    if (isA(inp)) {
      const row = OPTION_ROWS[this.sel];
      if (row.kind === 'bool') {
        changeOption(s, row, 1);
        changed = true;
      }
    }
    if (changed) {
      game.applySettings();
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'main';
    }
  }

  // --------------------------------------------------------------- drawing
  draw(game, r) {
    switch (this.mode) {
      case 'party': return this.drawParty(game, r);
      case 'summary': return this.drawSummary(game, r);
      case 'bag': return this.drawBag(game, r);
      case 'target': return this.drawTarget(game, r);
      case 'dex': return this.drawDex(game, r);
      case 'dexDetail': return this.drawDexDetail(game, r);
      case 'trainer': return this.drawTrainer(game, r);
      case 'save': return this.drawSave(game, r);
      case 'options': return this.drawOptions(game, r);
      default: return this.drawMain(game, r);
    }
  }

  drawMain(game, r) {
    drawBackground(r, 'MENU', game);
    const st = game.state;
    r.text(st.playerName || 'WREN', 6, 19, { color: PAL.dark });
    r.text(`${st.coins} COINS`, W - 6, 19, { color: PAL.mid, align: 'right' });
    r.rect(4, 27, W - 8, 1, PAL.mid);

    MAIN.forEach((row, i) => {
      const y = 32 + i * 13;
      const on = i === this.index;
      if (on) {
        r.rect(4, y - 1, W - 8, 11, PAL.light);
        r.text('>', 7, y, { color: PAL.dark });
      }
      r.text(row.label, 16, y, { color: on ? PAL.dark : PAL.mid });
    });

    const party = st.party;
    const p = party[0];
    drawBox(r, 4, 124, W - 8, 16, { fill: PAL.pale });
    if (p) {
      r.text(`${p.name} L${p.level}`, 7, 128, { color: PAL.dark, maxWidth: 58 });
      hpBar(r, 70, 128, 32, 3, p.hp / Math.max(1, p.maxHp));
      r.text(`${p.hp}/${p.maxHp}`, 152, 127, { color: PAL.mid, align: 'right' });
    } else {
      r.text('No Echoes yet.', 7, 128, { color: PAL.mid });
    }
    drawMessage(r, this.message, this.t);
  }

  drawParty(game, r) {
    drawBackground(r, 'ECHOES', game);
    const party = game.state.party;
    if (!party.length) {
      r.text('Your party is empty.', 8, 40, { color: PAL.mid });
    }
    party.forEach((c, i) => {
      const y = 22 + i * 16;
      const on = i === this.sel;
      if (on) {
        r.rect(4, y - 1, W - 8, 14, PAL.light);
        r.text('>', 6, y + 1, { color: PAL.dark });
      }
      r.text(c.name, 15, y + 1, { color: c.hp <= 0 ? PAL.mid : PAL.dark, maxWidth: 52 });
      r.text(`L${c.level}`, 71, y + 1, { color: PAL.dark });
      if (c.status) r.text(c.status, 92, y + 1, { color: PAL.mid });
      hpBar(r, 15, y + 9, 60, 3, c.hp / Math.max(1, c.maxHp));
      r.text(`${c.hp}/${c.maxHp}`, 152, y + 7, { color: PAL.mid, align: 'right' });
      if (i === 0) r.text('*', 118, y + 1, { color: PAL.mid });
    });
    r.rect(4, 120, W - 8, 1, PAL.mid);
    r.text('A: DETAILS   B: BACK', 6, 126, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawSummary(game, r) {
    const c = game.state.party[this.sel];
    drawBackground(r, 'ECHO DETAILS', game);
    if (!c) {
      r.text('No Echo selected.', 8, 40, { color: PAL.mid });
      return;
    }
    drawCreature(r, 26, 49, c.species, { scale: 1 });
    r.text(c.name, 46, 20, { color: PAL.dark });
    r.text(`L${c.level}`, 148, 20, { color: PAL.mid, align: 'right' });
    r.text(c.types.join('/'), 46, 29, { color: PAL.mid });
    r.text('HP', 46, 39, { color: PAL.mid });
    hpBar(r, 59, 39, 54, 4, c.hp / Math.max(1, c.maxHp));
    r.text(`${c.hp}/${c.maxHp}`, 148, 38, { color: PAL.dark, align: 'right' });
    r.text('EXP', 46, 48, { color: PAL.mid });
    expBar(r, 59, 48, 54, 3, expProgress(c));
    r.text(`ATK ${c.stats.atk}`, 46, 56, { color: PAL.dark });
    r.text(`DEF ${c.stats.def}`, 103, 56, { color: PAL.dark });
    r.text(`SPD ${c.stats.spd}`, 46, 65, { color: PAL.dark });
    r.text(`SPC ${c.stats.spc}`, 103, 65, { color: PAL.dark });
    r.rect(4, 75, W - 8, 1, PAL.mid);
    r.text('MOVES', 6, 78, { color: PAL.mid });
    c.moves.forEach((slot, i) => {
      const mv = getMove(slot.id);
      const y = 87 + i * 10;
      r.text(mv ? mv.name : slot.id, 8, y, { color: PAL.dark, maxWidth: 82 });
      r.text(`${slot.pp}/${slot.maxPp}`, 96, y, { color: PAL.mid });
      r.text(mv ? mv.type : '', 122, y, { color: PAL.mid, maxWidth: 34 });
    });
    r.text('A/B: BACK', 6, 134, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawBag(game, r) {
    drawBackground(r, 'BAG', game);
    r.text(`${game.state.coins}C`, W - 6, 20, { color: PAL.mid, align: 'right' });
    const list = this.bagList();
    if (!list.length) r.text('Your bag is empty.', 8, 30, { color: PAL.mid });
    const visible = 6;
    const start = Math.max(0, Math.min(this.sel - 2, list.length - visible));
    list.slice(start, start + visible).forEach((entry, i) => {
      const index = start + i;
      const y = 27 + i * 14;
      const on = index === this.sel;
      if (on) {
        r.rect(4, y - 1, W - 8, 12, PAL.light);
        r.text('>', 6, y + 1, { color: PAL.dark });
      }
      r.text(entry.item.name, 15, y + 1, { color: PAL.dark, maxWidth: 82 });
      r.text(`x${entry.count}`, 152, y + 1, { color: PAL.dark, align: 'right' });
    });
    const entry = list[this.sel];
    if (entry) {
      drawBox(r, 4, 106, W - 8, 22, { fill: PAL.pale });
      r.text(entry.item.desc, 7, 110, { color: PAL.mid, maxWidth: W - 14, lineHeight: 8 });
    }
    r.text('A: USE   B: BACK', 6, 134, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawTarget(game, r) {
    drawBackground(r, 'USE ITEM', game);
    const item = ITEMS[this.pendingItem];
    r.text(item ? item.name : 'ITEM', 6, 20, { color: PAL.dark });
    r.text('ON WHICH ECHO?', W - 6, 20, { color: PAL.mid, align: 'right' });
    const party = game.state.party;
    party.slice(0, 6).forEach((c, i) => {
      const y = 30 + i * 14;
      const on = i === this.target;
      if (on) {
        r.rect(4, y - 1, W - 8, 12, PAL.light);
        r.text('>', 6, y + 1, { color: PAL.dark });
      }
      r.text(c.name, 15, y + 1, { color: c.hp <= 0 ? PAL.mid : PAL.dark, maxWidth: 54 });
      r.text(`L${c.level}`, 72, y + 1, { color: PAL.dark });
      if (c.status) r.text(c.status, 94, y + 1, { color: PAL.mid });
      hpBar(r, 120, y + 3, 20, 3, c.hp / Math.max(1, c.maxHp));
      r.text(`${c.hp}`, 152, y + 1, { color: PAL.mid, align: 'right' });
    });
    r.rect(4, 120, W - 8, 1, PAL.mid);
    r.text('A: USE   B: BACK', 6, 126, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawDex(game, r) {
    drawBackground(r, 'BESTIARY', game);
    const list = this.dexList();
    const caught = Object.keys(game.state.caught).length;
    r.text(`${list.length}/41 SEEN`, 6, 20, { color: PAL.mid });
    r.text(`${caught} CAUGHT`, W - 6, 20, { color: PAL.mid, align: 'right' });
    if (!list.length) {
      r.text('You have not met any Echoes yet.', 8, 36, { color: PAL.mid });
    }
    const visible = 7;
    const start = Math.max(0, Math.min(this.sel - 3, list.length - visible));
    list.slice(start, start + visible).forEach((id, i) => {
      const index = start + i;
      const def = CREATURES[id];
      const y = 28 + i * 13;
      const on = index === this.sel;
      if (on) {
        r.rect(4, y - 1, W - 8, 11, PAL.light);
        r.text('>', 6, y, { color: PAL.dark });
      }
      r.text(`#${String(def.dexNo).padStart(3, '0')}`, 15, y, { color: PAL.mid });
      r.text(def.name, 52, y, { color: PAL.dark, maxWidth: 74 });
      r.text(game.state.caught[id] ? 'CAUGHT' : 'SEEN', 152, y, {
        color: PAL.mid, align: 'right'
      });
    });
    r.text('A: VIEW   B: BACK', 6, 134, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawDexDetail(game, r) {
    const list = this.dexList();
    const id = list[this.sel];
    drawBackground(r, 'BESTIARY', game);
    if (!id) return;
    const def = CREATURES[id];
    r.text(def.name, 6, 20, { color: PAL.dark });
    r.text(`NO.${String(def.dexNo).padStart(3, '0')}`, W - 6, 20, { color: PAL.mid, align: 'right' });
    drawCreature(r, 30, 51, id, { scale: 1 });
    r.text(`TYPE ${def.types.join('/')}`, 52, 31, { color: PAL.mid });
    r.text(`HP ${def.base.hp}  ATK ${def.base.atk}`, 52, 41, { color: PAL.dark });
    r.text(`DEF ${def.base.def}  SPC ${def.base.spc}`, 52, 50, { color: PAL.dark });
    r.text(`SPD ${def.base.spd}`, 52, 59, { color: PAL.dark });
    const status = game.state.caught[id] ? 'CAUGHT' : 'SEEN';
    r.text(status, 52, 69, { color: PAL.mid });
    r.rect(4, 78, W - 8, 1, PAL.mid);
    r.text(def.dex, 6, 83, { color: PAL.dark, maxWidth: W - 12, lineHeight: 9 });
    r.text(def.evolveTo
      ? `EVOLVES: ${CREATURES[def.evolveTo].name} L${def.evolveLevel}`
      : 'DOES NOT EVOLVE', 6, 118, { color: PAL.mid, maxWidth: W - 12 });
    r.text('A/B: BACK', 6, 134, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawTrainer(game, r) {
    drawBackground(r, 'TRAINER CARD', game);
    const st = game.state;
    const map = MAPS[st.map];
    const rows = [
      ['NAME', st.playerName || 'WREN'],
      ['LOCATION', map ? map.name : 'Asteria'],
      ['COINS', `${st.coins}`],
      ['PLAYTIME', clockText(st.playtime)],
      ['PARTY', `${st.party.length}`],
      ['SEEN', `${Object.keys(st.seen).length} / 41`],
      ['CAUGHT', `${Object.keys(st.caught).length} / 41`],
      ['TRAINERS', `${Object.keys(st.defeatedTrainers).length} beaten`],
      ['CHAPTER', st.flags.chapter_complete ? 'ONE COMPLETE' : 'ONE IN PROGRESS']
    ];
    rows.forEach(([label, value], i) => {
      const y = 22 + i * 11;
      r.text(label, 6, y, { color: PAL.mid });
      r.text(String(value), W - 6, y, { color: PAL.dark, align: 'right', maxWidth: 102 });
    });
    r.rect(4, 124, W - 8, 1, PAL.mid);
    r.text('A/B: BACK', 6, 130, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }

  drawSave(game, r) {
    drawBackground(r, 'SAVE', game);
    drawBox(r, 8, 32, W - 16, 92, { fill: PAL.pale });
    r.text('SAVE YOUR JOURNEY?', W / 2, 41, { color: PAL.dark, align: 'center' });
    r.rect(18, 52, W - 36, 1, PAL.mid);
    const st = game.state;
    const map = MAPS[st.map];
    r.text(st.playerName || 'WREN', 20, 59, { color: PAL.dark });
    r.text(map ? map.name : 'Asteria', 20, 69, { color: PAL.mid, maxWidth: 120 });
    r.text(`PLAYTIME ${clockText(st.playtime)}`, 20, 80, { color: PAL.mid });
    r.text(`PARTY ${st.party.length}   COINS ${st.coins}`, 20, 91, { color: PAL.mid });
    const yesX = 44, noX = 104, y = 106;
    [['YES', yesX], ['NO', noX]].forEach(([label, x], i) => {
      if (i === this.confirm) {
        r.rect(x - 7, y - 2, 32, 10, PAL.light);
        r.text('>', x - 5, y, { color: PAL.dark });
      }
      r.text(label, x + 5, y, { color: PAL.dark });
    });
    drawMessage(r, this.message, this.t);
  }

  drawOptions(game, r) {
    drawBackground(r, 'OPTIONS', game);
    const s = game.state.settings;
    OPTION_ROWS.forEach((row, i) => {
      const y = 25 + i * 19;
      const on = i === this.sel;
      if (on) {
        r.rect(4, y - 2, W - 8, 16, PAL.light);
        r.text('>', 6, y + 1, { color: PAL.dark });
      }
      r.text(row.label, 15, y + 1, { color: PAL.dark });
      r.text(optionValue(s, row), W - 8, y + 1, { color: PAL.mid, align: 'right' });
    });
    r.rect(4, 120, W - 8, 1, PAL.mid);
    r.text('LEFT/RIGHT: CHANGE   B: BACK', 6, 127, { color: PAL.mid });
    drawMessage(r, this.message, this.t);
  }
}

/** Settings screen shown from the title (a full scene rather than an overlay). */
export class SettingsScene {
  constructor(onClose) {
    this.onClose = onClose || (() => {});
    this.sel = 0;
    this.t = 0;
    this.done = false;
  }

  enter(game) {
    this.game = game;
  }

  update(game, dt) {
    this.t += dt;
    const inp = game.input;
    const s = game.state.settings;
    if (inp.anyOf('arrowdown', 's')) {
      this.sel = (this.sel + 1) % OPTION_ROWS.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.sel = (this.sel - 1 + OPTION_ROWS.length) % OPTION_ROWS.length;
      game.audio.sfx('cursor');
    }
    let changed = false;
    if (inp.anyOf('arrowleft', 'a')) {
      changeOption(s, OPTION_ROWS[this.sel], -1);
      changed = true;
    }
    if (inp.anyOf('arrowright', 'd')) {
      changeOption(s, OPTION_ROWS[this.sel], 1);
      changed = true;
    }
    if (isA(inp)) {
      const row = OPTION_ROWS[this.sel];
      if (row.kind === 'bool') {
        changeOption(s, row, 1);
        changed = true;
      }
    }
    if (changed) {
      game.applySettings();
      game.audio.sfx('cursor');
    }
    if (isB(inp) || (isA(inp) && this.sel === OPTION_ROWS.length - 1)) {
      game.audio.sfx('cancel');
      this.done = true;
      this.onClose();
    }
  }

  draw(game, r) {
    drawBackground(r, 'OPTIONS', null);
    const s = game.state.settings;
    OPTION_ROWS.forEach((row, i) => {
      const y = 27 + i * 19;
      const on = i === this.sel;
      if (on) {
        r.rect(4, y - 2, W - 8, 16, PAL.light);
        r.text('>', 6, y + 1, { color: PAL.dark });
      }
      r.text(row.label, 15, y + 1, { color: PAL.dark });
      r.text(optionValue(s, row), W - 8, y + 1, { color: PAL.mid, align: 'right' });
    });
    r.rect(4, 112, W - 8, 1, PAL.mid);
    r.text('LEFT/RIGHT: CHANGE', 6, 118, { color: PAL.mid });
    r.text('B: BACK TO TITLE', 6, 128, { color: PAL.mid });
  }
}

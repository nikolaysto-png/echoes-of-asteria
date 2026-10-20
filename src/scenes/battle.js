import { W, H, PAL, MAX_PARTY, MAX_STORAGE } from '../core/constants.js';
import { wrapText } from '../core/font.js';
import { drawBox, hpBar, expBar } from '../render/ui.js';
import { drawCreature } from '../render/sprites.js';
import { Battle } from '../systems/battle.js';
import { getMove } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { CREATURES } from '../data/creatures.js';
import { expForLevel } from '../systems/creature.js';

const A_KEYS = ['z', 'enter'];
const B_KEYS = ['x', 'escape', 'backspace'];
const COMMANDS = ['FIGHT', 'ECHOES', 'BAG', 'RUN'];
const PANEL_Y = 104;
const PANEL_H = H - PANEL_Y;

const isA = inp => inp.anyOf(...A_KEYS);
const isB = inp => inp.anyOf(...B_KEYS);

/**
 * The Gen-I battle presentation. The mechanical work lives in
 * systems/battle.js; this scene owns input, pacing, messages and the result
 * hand-off back to the Game.
 */
export class BattleScene {
  constructor(cfg = {}) {
    this.cfg = cfg;
    this.onFinish = cfg.onFinish || (() => {});
    this.phase = 'message';
    this.battle = null;
    this.log = [];
    this.msgIndex = 0;
    this.commandIndex = 0;
    this.moveIndex = 0;
    this.partyIndex = 0;
    this.bagIndex = 0;
    this.targetIndex = 0;
    this.forcedSwitch = false;
    this.flash = { player: 0, foe: 0 };
    this.fainted = { player: false, foe: false };
    this.anim = { t: 0, side: null, kind: null };
    this.ballAnim = null;
    this.t = 0;
    this.typeAcc = 0;
    this.resultEntered = false;
    this.resultDelay = 0;
    this.finished = false;
    this.outcome = null;
  }

  enter(game) {
    this.game = game;
    const st = game.state;
    this.battle = new Battle({
      kind: this.cfg.kind,
      trainer: this.cfg.trainer || null,
      playerParty: st.party,
      foeParty: this.cfg.foeParty || [],
      bag: st.bag,
      canRun: this.cfg.canRun,
      canCatch: this.cfg.canCatch,
      rng: game.rng
    });
    this.log = [];
    this.msgIndex = 0;
    this.pushQueue();
    this.phase = 'message';
    game.audio.sfx('encounter');
    game.playMusicNow(this.cfg.music || 'battle');
  }

  // ------------------------------------------------------------------ messages
  addMessage(text) {
    const raw = String(text == null ? '' : text);
    const wrapped = wrapText(raw, 146, 1);
    const pages = [];
    for (let i = 0; i < wrapped.length; i += 3) pages.push(wrapped.slice(i, i + 3).join('\n'));
    if (!pages.length) pages.push('');
    this.log.push({ pages, page: 0, shown: 0 });
    if (/sent out|sent out/i.test(raw)) this.fainted.foe = false;
    if (/^Go!|come back!/i.test(raw)) this.fainted.player = false;
  }

  pushQueue() {
    if (!this.battle) return;
    for (const ev of this.battle.drainQueue()) {
      if (ev.type === 'text') {
        this.addMessage(ev.text);
      } else if (ev.type === 'anim') {
        this.playAnim(ev);
      }
    }
  }

  playAnim(ev) {
    const side = ev.side === 'player' ? 'player' : 'foe';
    switch (ev.kind) {
      case 'hit':
        this.flash[side] = 0.16;
        this.game.audio.sfx('hit');
        break;
      case 'critical':
        this.flash[side] = 0.28;
        this.game.r.addShake(5);
        this.game.audio.sfx('superhit');
        break;
      case 'miss':
        this.game.audio.sfx('miss');
        break;
      case 'faint':
        this.fainted[side] = true;
        this.game.audio.sfx('faint');
        break;
      case 'status':
        this.game.audio.sfx('cursor');
        break;
      case 'ball':
        this.ballAnim = { t: 0, shakes: 0 };
        this.game.audio.sfx('ball');
        break;
      case 'heal':
        this.game.audio.sfx('heal');
        break;
      case 'stat':
        this.game.audio.sfx('cursor');
        break;
      default:
        break;
    }
  }

  currentMessage() {
    return this.log[this.msgIndex] || null;
  }

  updateMessage(dt) {
    const entry = this.currentMessage();
    if (!entry) {
      this.log = [];
      this.msgIndex = 0;
      this.afterMessages();
      return;
    }
    const page = entry.pages[entry.page] || '';
    if (entry.shown < page.length) {
      if (isA(this.game.input) || isB(this.game.input)) {
        entry.shown = page.length;
      } else {
        const speeds = [32, 62, 110];
        const speed = speeds[Math.min(2, this.game.state.settings.textSpeed ?? 1)];
        const before = Math.floor(entry.shown);
        entry.shown = Math.min(page.length, entry.shown + speed * dt);
        if (Math.floor(entry.shown) > before) {
          this.typeAcc++;
          if (this.typeAcc % 4 === 0) this.game.audio.sfx('text');
        }
      }
      return;
    }
    if (isA(this.game.input) || isB(this.game.input)) {
      this.game.audio.sfx('cursor');
      if (entry.page < entry.pages.length - 1) {
        entry.page++;
        entry.shown = 0;
        return;
      }
      this.msgIndex++;
      if (this.msgIndex >= this.log.length) {
        this.log = [];
        this.msgIndex = 0;
        this.afterMessages();
      }
    }
  }

  afterMessages() {
    const b = this.battle;
    if (!b) return;
    if (b.result) {
      this.enterResult();
      return;
    }
    if (b.phase === 'switch') {
      this.forcedSwitch = true;
      this.phase = 'party';
      this.partyIndex = this.firstUsablePartyIndex();
      return;
    }
    this.forcedSwitch = false;
    this.phase = 'command';
  }

  // ------------------------------------------------------------------ input
  update(game, dt) {
    this.t += dt;
    this.flash.player = Math.max(0, this.flash.player - dt);
    this.flash.foe = Math.max(0, this.flash.foe - dt);
    if (this.ballAnim) {
      this.ballAnim.t += dt;
      if (this.ballAnim.t > 1.2) this.ballAnim = null;
    }
    if (this.resultDelay > 0) this.resultDelay = Math.max(0, this.resultDelay - dt);

    if (!this.battle) return;
    switch (this.phase) {
      case 'message': return this.updateMessage(dt);
      case 'command': return this.updateCommand(game);
      case 'move': return this.updateMove(game);
      case 'party': return this.updateParty(game);
      case 'bag': return this.updateBag(game);
      case 'target': return this.updateTarget(game);
      case 'result': return this.updateResult(game);
      default: return;
    }
  }

  updateCommand(game) {
    const inp = game.input;
    const col = this.commandIndex % 2;
    const row = Math.floor(this.commandIndex / 2);
    let nc = col, nr = row;
    if (inp.anyOf('arrowleft', 'a')) nc = (col + 1) % 2;
    else if (inp.anyOf('arrowright', 'd')) nc = (col + 1) % 2;
    else if (inp.anyOf('arrowup', 'w')) nr = (row + 1) % 2;
    else if (inp.anyOf('arrowdown', 's')) nr = (row + 1) % 2;
    const next = nr * 2 + nc;
    if (next !== this.commandIndex) {
      this.commandIndex = next;
      game.audio.sfx('cursor');
    }

    if (isA(inp)) {
      game.audio.sfx('select');
      switch (COMMANDS[this.commandIndex]) {
        case 'FIGHT':
          this.moveIndex = 0;
          this.phase = 'move';
          break;
        case 'ECHOES':
          this.forcedSwitch = false;
          this.partyIndex = this.battle.playerIndex;
          this.phase = 'party';
          break;
        case 'BAG':
          this.bagIndex = 0;
          this.phase = 'bag';
          break;
        case 'RUN':
          this.submit({ type: 'run' });
          break;
        default:
          break;
      }
    }
  }

  updateMove(game) {
    const inp = game.input;
    const moves = this.battle.player ? this.battle.player.moves : [];
    const count = Math.max(1, moves.length);
    if (inp.anyOf('arrowleft', 'a') || inp.anyOf('arrowright', 'd')) {
      this.moveIndex = (this.moveIndex + 1) % count;
      game.audio.sfx('cursor');
    } else if (inp.anyOf('arrowup', 'w') || inp.anyOf('arrowdown', 's')) {
      this.moveIndex = (this.moveIndex + 1) % count;
      game.audio.sfx('cursor');
    }
    if (isA(inp)) {
      const slot = moves[this.moveIndex];
      if (!slot) {
        game.audio.sfx('error');
        return;
      }
      game.audio.sfx('select');
      this.submit({ type: 'move', index: this.moveIndex });
      return;
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.phase = 'command';
    }
  }

  updateParty(game) {
    const inp = game.input;
    const party = this.battle.playerParty;
    if (!party.length) return;
    if (inp.anyOf('arrowdown', 's')) {
      this.partyIndex = (this.partyIndex + 1) % party.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.partyIndex = (this.partyIndex - 1 + party.length) % party.length;
      game.audio.sfx('cursor');
    }
    if (isA(inp)) {
      const c = party[this.partyIndex];
      if (!c || c.hp <= 0) {
        game.audio.sfx('error');
        return;
      }
      if (this.partyIndex === this.battle.playerIndex) {
        game.audio.sfx('error');
        return;
      }
      game.audio.sfx('select');
      if (this.forcedSwitch) {
        this.submitForcedSwitch(this.partyIndex);
      } else {
        this.submit({ type: 'switch', index: this.partyIndex });
      }
      return;
    }
    if (isB(inp)) {
      if (this.forcedSwitch) {
        game.audio.sfx('error');
      } else {
        game.audio.sfx('cancel');
        this.phase = 'command';
      }
    }
  }

  submitForcedSwitch(index) {
    this.log = [];
    this.msgIndex = 0;
    const ok = this.battle.forceSwitch(index);
    this.pushQueue();
    this.forcedSwitch = false;
    if (ok) this.phase = this.log.length ? 'message' : 'command';
    else this.phase = 'party';
  }

  bagItems() {
    const bag = this.game ? this.game.state.bag : {};
    return Object.keys(bag)
      .filter(id => ITEMS[id] && ITEMS[id].kind !== 'key' && bag[id] > 0)
      .map(id => ({ id, count: bag[id], item: ITEMS[id] }))
      .sort((a, b) => {
        const ak = a.item.kind === 'ball' ? 0 : 1;
        const bk = b.item.kind === 'ball' ? 0 : 1;
        if (ak !== bk) return ak - bk;
        return a.item.name.localeCompare(b.item.name);
      });
  }

  usableInBattle(item) {
    return item && (item.kind === 'ball' || item.kind === 'heal' || item.kind === 'cure' || item.kind === 'revive');
  }

  updateBag(game) {
    const inp = game.input;
    const items = this.bagItems();
    if (!items.length) {
      if (isA(inp)) game.audio.sfx('error');
      if (isB(inp)) {
        game.audio.sfx('cancel');
        this.phase = 'command';
      }
      return;
    }
    this.bagIndex = Math.max(0, Math.min(this.bagIndex, items.length - 1));
    if (inp.anyOf('arrowdown', 's')) {
      this.bagIndex = (this.bagIndex + 1) % items.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.bagIndex = (this.bagIndex - 1 + items.length) % items.length;
      game.audio.sfx('cursor');
    }
    if (isA(inp)) {
      const entry = items[this.bagIndex];
      if (!this.usableInBattle(entry.item)) {
        game.audio.sfx('error');
        return;
      }
      game.audio.sfx('select');
      if (entry.item.kind === 'ball') {
        if (!this.battle.canCatch) {
          game.audio.sfx('error');
          return;
        }
        this.submit({ type: 'ball', itemId: entry.id });
      } else {
        this.targetIndex = this.battle.playerIndex;
        this.pendingItem = entry.id;
        this.phase = 'target';
      }
      return;
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.phase = 'command';
    }
  }

  updateTarget(game) {
    const inp = game.input;
    const party = this.battle.playerParty;
    if (!party.length) { this.phase = 'bag'; return; }
    if (inp.anyOf('arrowdown', 's')) {
      this.targetIndex = (this.targetIndex + 1) % party.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.targetIndex = (this.targetIndex - 1 + party.length) % party.length;
      game.audio.sfx('cursor');
    }
    if (isA(inp)) {
      game.audio.sfx('select');
      this.submit({ type: 'item', itemId: this.pendingItem, targetIndex: this.targetIndex });
      return;
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.phase = 'bag';
    }
  }

  submit(action) {
    this.log = [];
    this.msgIndex = 0;
    const b = this.battle;
    const ok = b.turn(action);
    this.pushQueue();
    if (this.log.length) {
      this.phase = 'message';
      return;
    }
    if (b.result) {
      this.enterResult();
      return;
    }
    if (b.phase === 'switch') {
      this.forcedSwitch = true;
      this.partyIndex = this.firstUsablePartyIndex();
      this.phase = 'party';
      return;
    }
    this.phase = 'command';
    if (!ok) this.game.audio.sfx('error');
  }

  firstUsablePartyIndex() {
    const idx = this.battle.playerParty.findIndex(c => c.hp > 0 && c !== this.battle.player);
    return idx >= 0 ? idx : 0;
  }

  // ------------------------------------------------------------------ result
  enterResult() {
    if (this.resultEntered) return;
    this.resultEntered = true;
    this.phase = 'result';
    this.outcome = this.battle.result || 'lose';
    this.resultDelay = 0.35;
    this.applyOutcome();
    if (this.outcome === 'win' || this.outcome === 'caught') {
      this.game.playMusicNow('victory');
    }
  }

  applyOutcome() {
    const b = this.battle;
    const st = this.game.state;
    for (const c of st.party) if (c && c.species) st.seen[c.species] = true;

    if (this.outcome === 'caught' && b.caughtCreature && !this.captureApplied) {
      this.captureApplied = true;
      const c = b.caughtCreature;
      st.seen[c.species] = true;
      st.caught[c.species] = (st.caught[c.species] || 0) + 1;
      this.caughtSummary = { name: c.name, level: c.level, species: c.species };
      if (st.party.length < MAX_PARTY) {
        st.party.push(c);
        this.captureDestination = 'party';
      } else if (st.storage.length < MAX_STORAGE) {
        st.storage.push(c);
        this.captureDestination = 'storage';
      } else {
        this.captureDestination = 'nowhere';
      }
    }
  }

  updateResult(game) {
    if (this.resultDelay > 0) return;
    if (isA(game.input) || isB(game.input)) {
      game.audio.sfx('select');
      this.finish();
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.onFinish(this.outcome || 'lose');
  }

  // ------------------------------------------------------------------ drawing
  draw(game, r) {
    this.drawArena(r);
    if (this.battle) {
      this.drawActors(r);
      // The ball belongs to the battlefield, not to the menus drawn on top.
      this.drawBall(r);
      this.drawInfoPanels(r);
      if (this.phase === 'message') this.drawMessagePanel(r);
      else if (this.phase === 'command') this.drawCommandPanel(r);
      else if (this.phase === 'move') this.drawMovePanel(r);
      else if (this.phase === 'party') this.drawPartyPanel(r);
      else if (this.phase === 'bag') this.drawBagPanel(r);
      else if (this.phase === 'target') this.drawPartyPanel(r, true);
      else if (this.phase === 'result') this.drawResultPanel(r);
    }
  }

  drawArena(r) {
    r.rect(0, 0, W, H, PAL.pale);
    // Cool morning sky, then a band of field and two low platforms.
    r.rect(0, 0, W, 52, PAL.pale);
    r.dither(0, 0, W, 52, PAL.light, 3);
    r.rect(0, 52, W, 92, PAL.light);
    r.rect(0, 72, W, 72, PAL.mid);
    r.rect(0, 92, W, 52, PAL.mid);
    r.dither(0, 92, W, 30, PAL.dark, 4);
    r.ellipse(112, 87, 38, 9, PAL.dark);
    r.ellipse(112, 85, 34, 7, PAL.mid);
    r.ellipse(42, 106, 40, 10, PAL.dark);
    r.ellipse(42, 104, 36, 8, PAL.mid);
    // A few blades of grass, all in the darkest shade.
    for (let i = 0; i < 14; i++) {
      const x = (i * 13 + 5) % W;
      const y = 116 + ((i * 7) % 24);
      r.rect(x, y, 1, 4, PAL.dark);
      r.rect(x + 2, y + 1, 1, 3, PAL.dark);
    }
    // Horizon marks.
    for (let x = 2; x < W; x += 11) r.rect(x, 68 + (x % 3), 4, 1, PAL.mid);
  }

  drawActors(r) {
    const b = this.battle;
    const foe = b.foe;
    const player = b.player;
    const hidingFoe = this.ballAnim && this.ballAnim.t < 0.9;

    if (foe && !hidingFoe) {
      const jitter = this.flash.foe > 0 ? (Math.floor(this.t * 60) % 2 ? 2 : -2) : 0;
      const drop = this.fainted.foe ? 6 : 0;
      drawCreature(r, 113 + jitter, 55 + drop, foe.species, { scale: 2 });
      if (this.flash.foe > 0) this.drawImpact(r, 113, 50);
    }
    if (player) {
      const jitter = this.flash.player > 0 ? (Math.floor(this.t * 60) % 2 ? 2 : -2) : 0;
      const drop = this.fainted.player ? 5 : 0;
      drawCreature(r, 43 + jitter, 77 + drop, player.species, { scale: 2, back: true });
      if (this.flash.player > 0) this.drawImpact(r, 43, 73);
    }
  }

  drawImpact(r, cx, cy) {
    const cols = [PAL.dark, PAL.pale];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const x = cx + Math.cos(a) * 21;
      const y = cy + Math.sin(a) * 17;
      r.rect(x, y, 2, 2, cols[i % 2]);
    }
  }

  drawInfoPanels(r) {
    const b = this.battle;
    const foe = b.foe;
    if (foe) {
      drawBox(r, 3, 3, 79, 31);
      r.text(foe.name, 7, 6, { color: PAL.dark, maxWidth: 44 });
      r.text(`L${foe.level}`, 71, 6, { color: PAL.dark, align: 'right' });
      if (foe.status) r.text(foe.status, 55, 6, { color: PAL.mid, maxWidth: 18 });
      hpBar(r, 7, 16, 52, 4, foe.hp / Math.max(1, foe.maxHp));
      r.text(`${foe.hp}/${foe.maxHp}`, 62, 15, { color: PAL.dark });
      const foesLeft = b.kind === 'trainer'
        ? b.foeParty.filter(c => c.hp > 0).length + ' LEFT'
        : 'WILD';
      r.text(foesLeft, 7, 24, { color: PAL.mid });
    }

    const p = b.player;
    if (p) {
      drawBox(r, 79, 70, 78, 33);
      r.text(p.name, 83, 73, { color: PAL.dark, maxWidth: 45 });
      r.text(`L${p.level}`, 148, 73, { color: PAL.dark, align: 'right' });
      if (p.status) r.text(p.status, 131, 73, { color: PAL.mid, maxWidth: 18 });
      hpBar(r, 83, 83, 51, 4, p.hp / Math.max(1, p.maxHp));
      r.text(`${p.hp}/${p.maxHp}`, 136, 82, { color: PAL.dark });
      r.text('EXP', 83, 91, { color: PAL.mid });
      expBar(r, 100, 91, 55, 3, expProgress(p));
    }
  }

  drawMessagePanel(r) {
    drawBox(r, 0, PANEL_Y, W, PANEL_H);
    const entry = this.currentMessage();
    if (!entry) return;
    const page = entry.pages[entry.page] || '';
    r.text(page.slice(0, Math.floor(entry.shown)), 6, PANEL_Y + 5, {
      color: PAL.dark,
      maxWidth: W - 12,
      lineHeight: 9
    });
    if (entry.shown >= page.length) {
      const bob = Math.sin(this.t * 7) > 0 ? 0 : 1;
      r.text('v', W - 9, PANEL_Y + PANEL_H - 10 + bob, { color: PAL.dark });
    }
  }

  drawCommandPanel(r) {
    drawBox(r, 0, PANEL_Y, W, PANEL_H);
    COMMANDS.forEach((label, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 9 + col * 76;
      const y = PANEL_Y + 7 + row * 15;
      if (i === this.commandIndex) {
        r.rect(x - 5, y - 1, 69, 10, PAL.light);
        r.text('>', x - 3, y, { color: PAL.dark });
        r.text(label, x + 6, y, { color: PAL.dark });
      } else {
        r.text(label, x + 6, y, { color: PAL.mid });
      }
    });
  }

  drawMovePanel(r) {
    drawBox(r, 0, 88, W, H - 88);
    const moves = this.battle.player ? this.battle.player.moves : [];
    moves.forEach((slot, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 5 + col * 78;
      const y = 92 + row * 25;
      const mv = getMove(slot.id);
      if (i === this.moveIndex) {
        r.rect(x, y - 1, 74, 23, PAL.light);
        r.text('>', x + 1, y + 2, { color: PAL.dark });
      }
      r.text(mv ? mv.name : slot.id, x + 9, y + 2, {
        color: PAL.dark,
        maxWidth: 48
      });
      r.text(`${slot.pp}/${slot.maxPp}`, x + 70, y + 2, { color: PAL.dark, align: 'right' });
      r.text(mv ? mv.type : '', x + 9, y + 12, { color: PAL.mid, maxWidth: 62 });
    });
    if (!moves.length) r.text('STRUGGLE', 8, 96, { color: PAL.dark });
    r.text('A: USE   B: BACK', 5, 137, { color: PAL.mid });
  }

  drawPartyPanel(r, target = false) {
    drawBox(r, 2, 2, W - 4, H - 4);
    r.text(target ? 'USE ITEM ON WHO?' : (this.forcedSwitch ? 'SEND OUT WHO?' : 'YOUR ECHOES'), 7, 7, {
      color: PAL.dark
    });
    r.rect(5, 17, W - 10, 1, PAL.mid);
    const party = this.battle.playerParty;
    const visible = 5;
    const start = Math.max(0, Math.min(this.partyIndex - 2, party.length - visible));
    const selected = target ? this.targetIndex : this.partyIndex;
    party.slice(start, start + visible).forEach((c, i) => {
      const index = start + i;
      const y = 23 + i * 21;
      const on = index === selected;
      const active = index === this.battle.playerIndex;
      if (on) {
        r.rect(5, y - 1, W - 10, 19, PAL.light);
        r.text('>', 7, y + 2, { color: PAL.dark });
      }
      r.text(c.name, 16, y + 2, { color: c.hp <= 0 ? PAL.mid : PAL.dark, maxWidth: 54 });
      r.text(`L${c.level}`, 73, y + 2, { color: PAL.dark });
      if (active) r.text('*', 91, y + 2, { color: PAL.dark });
      if (c.status) r.text(c.status, 100, y + 2, { color: PAL.mid });
      hpBar(r, 16, y + 11, 63, 3, c.hp / Math.max(1, c.maxHp));
      r.text(`${c.hp}/${c.maxHp}`, 150, y + 9, { color: PAL.mid, align: 'right' });
    });
    r.rect(5, 130, W - 10, 1, PAL.mid);
    r.text(this.forcedSwitch ? 'A: SEND OUT' : 'A: CHOOSE   B: BACK', 7, 134, { color: PAL.mid });
  }

  drawBagPanel(r) {
    drawBox(r, 2, 2, W - 4, H - 4);
    r.text('BAG', 7, 7, { color: PAL.dark });
    r.rect(5, 17, W - 10, 1, PAL.mid);
    const items = this.bagItems();
    if (!items.length) {
      r.text('Nothing usable here.', 8, 28, { color: PAL.mid });
    } else {
      const visible = 5;
      const start = Math.max(0, Math.min(this.bagIndex - 2, items.length - visible));
      items.slice(start, start + visible).forEach((entry, i) => {
        const index = start + i;
        const y = 22 + i * 15;
        const on = index === this.bagIndex;
        if (on) {
          r.rect(5, y - 1, W - 10, 13, PAL.light);
          r.text('>', 7, y + 1, { color: PAL.dark });
        }
        r.text(entry.item.name, 16, y + 1, { color: PAL.dark, maxWidth: 94 });
        r.text(`x${entry.count}`, 150, y + 1, { color: PAL.dark, align: 'right' });
      });
      const entry = items[this.bagIndex];
      if (entry) {
        r.rect(5, 102, W - 10, 1, PAL.mid);
        r.text(entry.item.desc, 7, 107, { color: PAL.mid, maxWidth: W - 14, lineHeight: 9 });
      }
    }
    r.text('A: USE   B: BACK', 7, 134, { color: PAL.mid });
  }

  drawResultPanel(r) {
    r.rect(0, 0, W, H, PAL.dark);
    drawBox(r, 8, 24, W - 16, 96);
    const title = this.outcome === 'win' ? 'VICTORY!'
      : this.outcome === 'caught' ? 'GOTCHA!'
        : this.outcome === 'fled' ? 'ESCAPED!'
          : 'DEFEATED...';
    r.text(title, W / 2, 32, { color: PAL.dark, align: 'center' });
    r.rect(20, 43, W - 40, 1, PAL.mid);

    let lines = [];
    if (this.outcome === 'win') {
      if (this.battle.kind === 'trainer' && this.battle.trainer) {
        lines = [`${this.battle.trainer.name} is defeated.`, 'Your Echoes will remember this battle.'];
      } else {
        lines = [`The wild ${this.battle.foe ? this.battle.foe.name : 'Echo'} was defeated.`, 'Your Echoes grow stronger.'];
      }
    } else if (this.outcome === 'caught' && this.caughtSummary) {
      lines = [`${this.caughtSummary.name} L${this.caughtSummary.level} was caught!`];
      if (this.captureDestination === 'party') lines.push('It joined your party.');
      else if (this.captureDestination === 'storage') lines.push('It was sent to storage.');
      else lines.push('There was no room. It returned to the wild.');
    } else if (this.outcome === 'fled') {
      lines = ['You got away safely.', 'The tall grass closes behind you.'];
    } else {
      lines = ['Your last Echo cannot continue.', 'You return to safety...'];
    }
    lines.forEach((line, i) => {
      r.text(line, 16, 52 + i * 11, { color: PAL.dark, maxWidth: W - 32 });
    });
    if (this.outcome === 'caught' && this.caughtSummary) {
      drawCreature(r, W / 2, 84, this.caughtSummary.species, { scale: 1 });
    }
    if (this.resultDelay <= 0) {
      const bob = Math.sin(this.t * 7) > 0 ? 0 : 1;
      r.text('Z: CONTINUE', W / 2, 105 + bob, { color: PAL.mid, align: 'center' });
    }
  }

  drawBall(r) {
    if (!this.ballAnim) return;
    const t = this.ballAnim.t;
    const shake = t < 0.55 ? 0 : (Math.floor(t * 18) % 2 ? 2 : -2);
    const y = 55 + Math.max(0, Math.sin(Math.min(1, t * 6) * Math.PI) * -10);
    const x = 113 + shake;
    r.ellipse(x, y, 6, 6, PAL.dark);
    r.rect(x - 5, y - 4, 10, 4, PAL.pale);
    r.rect(x - 5, y, 10, 5, PAL.dark);
    r.rect(x - 4, y - 3, 8, 2, PAL.light);
    r.rect(x - 2, y - 1, 4, 3, PAL.pale);
    r.rect(x - 1, y, 2, 1, PAL.dark);
  }
}

function expProgress(c) {
  const group = (CREATURES[c.species] || {}).growth || 'medium';
  const lo = expForLevel(c.level, group);
  const hi = expForLevel(c.level + 1, group);
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(1, ((c.exp ?? lo) - lo) / (hi - lo)));
}

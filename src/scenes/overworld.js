import { W, H, TILE, PAL } from '../core/constants.js';
import { MAPS, SOLID_TILES } from '../data/maps.js';
import { drawTile } from '../render/tiles.js';
import { drawCharacter, drawObject, isObjectSprite } from '../render/sprites.js';
import { drawBox } from '../render/ui.js';
import { runEventScript, runMapEnter } from '../systems/events.js';
import { createCreature } from '../systems/creature.js';

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
const STEP_TIME = 0.16;

function faceDir(from, to) {
  if (to.y > from.y) return 'down';
  if (to.y < from.y) return 'up';
  if (to.x > from.x) return 'right';
  if (to.x < from.x) return 'left';
  return 'down';
}

export class OverworldScene {
  constructor() {
    this.initialized = false;
    this.mapId = null;
    this.map = null;
    this.p = {
      tx: 6, ty: 7, fromX: 6, fromY: 7, toX: 6, toY: 7,
      dir: 'down', moving: false, progress: 0, frame: 0
    };
    this.eventPos = {};
    this.eventDir = {};
    this.hidden = new Set();
    this.scriptMotion = null;
    this.pendingSight = null;
    this.encounterCooldown = 0;
    this.interactCooldown = 0;
    this.blockCooldown = 0;
    this.banner = 0;
    this.t = 0;
    this.camX = 0;
    this.camY = 0;
  }

  enter(game) {
    this.game = game;
    game.world = this;
    if (!this.initialized) {
      this.initialized = true;
      this.loadMap(game, true);
    } else {
      this.loadMap(game, false);
    }
  }

  // ---------------------------------------------------------------- map load
  loadMap(game, runEnter) {
    const id = game.state.map;
    const map = MAPS[id] || MAPS.home;
    this.mapId = map.id;
    this.map = map;
    const p = this.p;
    p.tx = game.state.x;
    p.ty = game.state.y;
    p.fromX = p.tx;
    p.fromY = p.ty;
    p.toX = p.tx;
    p.toY = p.ty;
    p.dir = game.state.dir || 'down';
    p.moving = false;
    p.progress = 0;
    p.frame = 0;

    this.eventPos = {};
    this.eventDir = {};
    this.hidden = new Set();
    for (const e of map.events || []) {
      const saved = game.state.npcPos[`${map.id}:${e.id}`];
      if (saved && saved.map === map.id) {
        this.eventPos[e.id] = { x: saved.x, y: saved.y };
        this.eventDir[e.id] = saved.dir || e.dir || 'down';
      } else {
        this.eventPos[e.id] = { x: e.x, y: e.y };
        this.eventDir[e.id] = e.dir || 'down';
      }
      if (e.once && game.state.flags[`evt:${map.id}:${e.id}`]) this.hidden.add(e.id);
    }

    this.scriptMotion = null;
    this.pendingSight = null;
    this.encounterCooldown = 0.55;
    this.interactCooldown = 0.25;
    this.blockCooldown = 0;
    this.banner = 2.6;
    this.t = 0;
    this.syncState();
    this.updateCamera();

    game.lastMapMusic = null;
    game.refreshMusic();
    if (runEnter) {
      runMapEnter(game, map).catch(err => console.error('[map enter]', err));
    }
  }

  teleportInstant(mapId, x, y, dir = 'down', runEnter = true) {
    const game = this.game;
    if (!game || !MAPS[mapId]) return;
    game.state.map = mapId;
    game.state.x = x;
    game.state.y = y;
    game.state.dir = dir;
    this.loadMap(game, runEnter);
  }

  async teleport(mapId, x, y, dir = 'down', useFade = true) {
    if (!this.game || !MAPS[mapId]) return;
    if (!useFade) {
      this.teleportInstant(mapId, x, y, dir, true);
      return;
    }
    await this.game.transitionTo(() => {
      this.teleportInstant(mapId, x, y, dir, true);
    });
  }

  syncState() {
    if (!this.game || !this.mapId) return;
    const st = this.game.state;
    st.map = this.mapId;
    st.x = this.p.tx;
    st.y = this.p.ty;
    st.dir = this.p.dir;
  }

  refreshState() {
    for (const e of this.map.events || []) {
      if (e.once && this.game.state.flags[`evt:${this.mapId}:${e.id}`]) this.hidden.add(e.id);
    }
  }

  hideEvent(id) {
    this.hidden.add(id);
  }

  // ---------------------------------------------------------------- tile/actor helpers
  tileAt(x, y) {
    const edits = this.game && this.game.state.mapEdits[this.mapId];
    if (edits) {
      const ch = edits[`${x},${y}`];
      if (ch) return ch;
    }
    if (!this.map.tiles[y]) return 'X';
    return this.map.tiles[y][x] ?? 'X';
  }

  eventAt(x, y) {
    for (const e of this.map.events || []) {
      if (this.hidden.has(e.id)) continue;
      const pos = this.eventPos[e.id];
      if (pos && pos.x === x && pos.y === y) return e;
    }
    return null;
  }

  isWalkable(x, y, ignoreEvent = null) {
    if (x < 0 || y < 0 || y >= this.map.tiles.length || x >= this.map.tiles[0].length) return false;
    const ch = this.tileAt(x, y);
    if (SOLID_TILES.has(ch)) return false;
    const e = this.eventAt(x, y);
    if (e && e.id !== ignoreEvent && e.solid !== false) return false;
    return true;
  }

  actorPos(id) {
    if (id == null) return { x: this.p.tx, y: this.p.ty };
    return this.eventPos[id] || null;
  }

  actorDir(id) {
    if (id == null) return this.p.dir;
    return this.eventDir[id] || 'down';
  }

  faceActor(id, dir) {
    if (!DIRS[dir]) return;
    if (id == null) this.p.dir = dir;
    else if (this.eventPos[id]) {
      this.eventDir[id] = dir;
      this.game.state.npcPos[`${this.mapId}:${id}`] = {
        map: this.mapId, x: this.eventPos[id].x, y: this.eventPos[id].y, dir
      };
    }
  }

  // ---------------------------------------------------------------- update
  update(game, dt) {
    this.t += dt;
    this.banner = Math.max(0, this.banner - dt);
    this.interactCooldown = Math.max(0, this.interactCooldown - dt);
    this.encounterCooldown = Math.max(0, this.encounterCooldown - dt);
    this.blockCooldown = Math.max(0, this.blockCooldown - dt);
    this.updateScriptMotion(dt);
    this.updateCamera();

    if (game.scriptActive) return;

    if (this.pendingSight) {
      this.pendingSight.t -= dt;
      if (this.pendingSight.t <= 0) {
        const event = this.pendingSight.event;
        this.pendingSight = null;
        this.runEvent(game, event);
      }
      return;
    }

    const p = this.p;
    if (p.moving) {
      p.progress += dt / STEP_TIME;
      p.frame = p.progress < 0.5 ? 1 : 2;
      if (p.progress >= 1) {
        p.tx = p.toX;
        p.ty = p.toY;
        p.fromX = p.tx;
        p.fromY = p.ty;
        p.moving = false;
        p.progress = 0;
        p.frame = 0;
        this.syncState();
        this.onStep(game);
      }
      return;
    }

    p.frame = 0;
    const inp = game.input;
    if (inp.anyOf('c', 'm')) {
      game.openMenu();
      return;
    }
    if (inp.anyOf('z', 'enter')) {
      this.interact(game);
      return;
    }
    const d = inp.dir();
    if (d.dx || d.dy) {
      const dir = d.dx > 0 ? 'right' : d.dx < 0 ? 'left' : d.dy > 0 ? 'down' : 'up';
      p.dir = dir;
      this.tryMove(dir);
      this.syncState();
    }
  }

  tryMove(dir) {
    const p = this.p;
    const d = DIRS[dir];
    const nx = p.tx + d.x;
    const ny = p.ty + d.y;
    if (!this.isWalkable(nx, ny)) return false;
    p.fromX = p.tx;
    p.fromY = p.ty;
    p.toX = nx;
    p.toY = ny;
    p.moving = true;
    p.progress = 0;
    p.frame = 1;
    this.pendingSight = null;
    return true;
  }

  onStep(game) {
    const p = this.p;
    const warp = (this.map.warps || []).find(w => w.x === p.tx && w.y === p.ty);
    if (warp) {
      if (warp.requires && !game.state.flags[warp.requires.flag]) {
        if (this.blockCooldown <= 0) {
          this.blockCooldown = 2.0;
          game.audio.sfx('error');
          game.say([warp.blocked || 'The way ahead is closed.']);
        }
        return;
      }
      this.doWarp(game, warp);
      return;
    }

    if (this.checkSight(game)) return;

    if (this.tileAt(p.tx, p.ty) === ',') this.tryEncounter(game);
  }

  async doWarp(game, warp) {
    if (this.warping) return;
    this.warping = true;
    this.syncState();
    game.audio.sfx('door');
    await game.transitionTo(() => {
      game.state.map = warp.to;
      game.state.x = warp.tx;
      game.state.y = warp.ty;
      game.state.dir = warp.dir || 'down';
      this.teleportInstant(warp.to, warp.tx, warp.ty, warp.dir || 'down', true);
    });
    this.warping = false;
  }

  checkSight(game) {
    if (this.pendingSight) return false;
    for (const e of this.map.events || []) {
      if (!e.trainer || !e.sight || this.hidden.has(e.id)) continue;
      if (game.state.defeatedTrainers[e.trainer]) continue;
      const pos = this.eventPos[e.id];
      const dir = this.eventDir[e.id] || e.dir || 'down';
      const d = DIRS[dir];
      for (let step = 1; step <= e.sight; step++) {
        const x = pos.x + d.x * step;
        const y = pos.y + d.y * step;
        if (!this.map.tiles[y] || !this.map.tiles[y][x]) break;
        if (SOLID_TILES.has(this.tileAt(x, y))) break;
        const other = this.eventAt(x, y);
        if (other && other.id !== e.id) break;
        if (this.p.tx === x && this.p.ty === y) {
          this.faceActor(e.id, faceDir(pos, this.p));
          this.pendingSight = { event: e, t: 0.55 };
          game.audio.sfx('cursor');
          return true;
        }
      }
    }
    return false;
  }

  tryEncounter(game) {
    const enc = this.map.encounters;
    if (!enc || this.encounterCooldown > 0) return;
    if (!game.state.party.some(c => c.hp > 0)) return;
    if (game.rng() >= enc.rate) return;
    const total = enc.table.reduce((sum, e) => sum + e.weight, 0);
    let roll = game.rng() * total;
    let pick = enc.table[0];
    for (const entry of enc.table) {
      roll -= entry.weight;
      if (roll <= 0) { pick = entry; break; }
    }
    const level = pick.min + Math.floor(game.rng() * (pick.max - pick.min + 1));
    const foe = createCreature(pick.id, level, { metMap: this.mapId });
    this.encounterCooldown = 1.6;
    game.audio.sfx('encounter');
    game.startWildBattle(foe).catch(err => console.error('[wild battle]', err));
  }

  interact(game) {
    if (this.interactCooldown > 0 || game.scriptActive) return;
    const d = DIRS[this.p.dir] || DIRS.down;
    const x = this.p.tx + d.x;
    const y = this.p.ty + d.y;
    const event = this.eventAt(x, y);
    if (!event) return;
    this.runEvent(game, event);
  }

  runEvent(game, event) {
    if (!event || game.scriptActive) return;
    const pos = this.eventPos[event.id];
    if (pos) {
      this.faceActor(event.id, faceDir(pos, { x: this.p.tx, y: this.p.ty }));
    }
    runEventScript(game, this.map, event, this).catch(err => console.error('[event]', err));
  }

  // ---------------------------------------------------------------- scripted movement
  updateScriptMotion(dt) {
    const m = this.scriptMotion;
    if (!m) return;
    m.t = Math.min(1, m.t + dt / STEP_TIME);
    if (m.t < 1) return;
    if (m.kind === 'event') {
      const pos = this.eventPos[m.id];
      if (pos) {
        pos.x += m.dx;
        pos.y += m.dy;
        this.eventDir[m.id] = m.dir;
        this.game.state.npcPos[`${this.mapId}:${m.id}`] = {
          map: this.mapId, x: pos.x, y: pos.y, dir: m.dir
        };
      }
    } else {
      const p = this.p;
      p.tx += m.dx;
      p.ty += m.dy;
      p.fromX = p.tx;
      p.fromY = p.ty;
      p.toX = p.tx;
      p.toY = p.ty;
      p.dir = m.dir;
      this.syncState();
    }
    const resolve = m.resolve;
    this.scriptMotion = null;
    if (resolve) resolve();
  }

  moveEventScript(id, dir, steps = 1) {
    const game = this.game;
    return new Promise(resolve => {
      const pos = this.eventPos[id];
      const d = DIRS[dir];
      if (!pos || !d) { resolve(); return; }
      let left = Math.max(1, Number(steps) || 1);
      const next = () => {
        if (left-- <= 0) { resolve(); return; }
        if (!this.isWalkable(pos.x + d.x, pos.y + d.y, id)) { resolve(); return; }
        this.scriptMotion = {
          kind: 'event', id, dir, dx: d.x, dy: d.y, t: 0,
          resolve: () => { next(); }
        };
      };
      game.audio.sfx('cursor');
      next();
    });
  }

  movePlayerScript(dir, steps = 1) {
    return new Promise(resolve => {
      const d = DIRS[dir];
      if (!d) { resolve(); return; }
      let left = Math.max(1, Number(steps) || 1);
      const next = () => {
        if (left-- <= 0) { resolve(); return; }
        if (!this.isWalkable(this.p.tx + d.x, this.p.ty + d.y)) { resolve(); return; }
        this.scriptMotion = {
          kind: 'player', id: null, dir, dx: d.x, dy: d.y, t: 0,
          resolve: () => { next(); }
        };
      };
      next();
    });
  }

  // ---------------------------------------------------------------- drawing
  renderPos() {
    const p = this.p;
    if (this.scriptMotion && this.scriptMotion.kind === 'player') {
      const m = this.scriptMotion;
      return { x: p.tx + m.dx * m.t, y: p.ty + m.dy * m.t };
    }
    if (p.moving) {
      return {
        x: p.fromX + (p.toX - p.fromX) * p.progress,
        y: p.fromY + (p.toY - p.fromY) * p.progress
      };
    }
    return { x: p.tx, y: p.ty };
  }

  updateCamera() {
    if (!this.map) return;
    const mw = this.map.tiles[0].length * TILE;
    const mh = this.map.tiles.length * TILE;
    const pos = this.renderPos();
    const cx = pos.x * TILE + TILE / 2;
    const cy = pos.y * TILE + TILE / 2;
    this.camX = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, cx - W / 2));
    this.camY = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, cy - H / 2));
  }

  draw(game, r) {
    if (!this.map) {
      r.rect(0, 0, W, H, PAL.dark);
      return;
    }
    this.updateCamera();
    const camX = Math.round(this.camX);
    const camY = Math.round(this.camY);
    const mw = this.map.tiles[0].length;
    const mh = this.map.tiles.length;

    r.pushClip(0, 0, W, H);
    r.rect(0, 0, W, H, PAL.dark);
    const startX = Math.max(0, Math.floor(camX / TILE));
    const startY = Math.max(0, Math.floor(camY / TILE));
    const endX = Math.min(mw, Math.ceil((camX + W) / TILE));
    const endY = Math.min(mh, Math.ceil((camY + H) / TILE));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        drawTile(r, this.tileAt(x, y), x * TILE - camX, y * TILE - camY, Math.floor(this.t * 2));
      }
    }

    const drawables = [];
    for (const e of this.map.events || []) {
      if (this.hidden.has(e.id) || !e.sprite) continue;
      const pos = this.eventPos[e.id];
      if (!pos) continue;
      drawables.push({ kind: 'event', e, pos, depth: pos.y });
    }
    const pp = this.renderPos();
    drawables.push({ kind: 'player', depth: pp.y + 0.1 });

    drawables.sort((a, b) => a.depth - b.depth);
    for (const item of drawables) {
      let x, y, dir, frame = 0;
      if (item.kind === 'player') {
        x = pp.x;
        y = pp.y;
        dir = this.p.dir;
        frame = this.p.frame;
        if (this.scriptMotion && this.scriptMotion.kind === 'player') {
          frame = this.scriptMotion.t < 0.5 ? 1 : 2;
        }
        const px = Math.round(x * TILE + TILE / 2 - camX);
        const py = Math.round(y * TILE + TILE - 2 - camY);
        drawCharacter(r, px, py, 'player', dir, frame, 1);
      } else {
        const e = item.e;
        let pos = item.pos;
        if (this.scriptMotion && this.scriptMotion.kind === 'event' && this.scriptMotion.id === e.id) {
          pos = {
            x: pos.x + this.scriptMotion.dx * this.scriptMotion.t,
            y: pos.y + this.scriptMotion.dy * this.scriptMotion.t
          };
          frame = this.scriptMotion.t < 0.5 ? 1 : 2;
        }
        const px = Math.round(pos.x * TILE - camX);
        const py = Math.round(pos.y * TILE - camY);
        dir = this.eventDir[e.id] || e.dir || 'down';
        if (isObjectSprite(e.sprite)) {
          drawObject(r, e.sprite, px, py);
        } else {
          drawCharacter(r, px + TILE / 2, py + TILE - 2, e.sprite, dir, frame, 1);
        }
      }
    }

    if (this.pendingSight) {
      const pos = this.eventPos[this.pendingSight.event.id];
      if (pos) {
        const bx = Math.round(pos.x * TILE + TILE / 2 - camX) - 5;
        const by = Math.round(pos.y * TILE - camY) - 17;
        drawBox(r, bx, by, 11, 14);
        r.text('!', bx + 3, by + 2, { color: PAL.dark });
      }
    }

    r.popClip();

    if (this.banner > 0) {
      const label = this.map.name.toUpperCase();
      const w = Math.min(W - 4, r.measure(label, 1) + 8);
      drawBox(r, 2, 2, w, 12);
      r.text(label, 6, 4, { color: PAL.dark, maxWidth: w - 8 });
    }
  }
}

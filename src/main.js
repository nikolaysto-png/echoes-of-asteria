import { W, H, TILE, DEFAULT_SETTINGS } from './core/constants.js';
import { Renderer } from './render/renderer.js';
import { Input } from './core/input.js';
import { audio } from './core/audio.js';
import {
  createState, loadState, saveState, hasSave, clearSave, addItem
} from './core/state.js';
import { MAPS } from './data/maps.js';
import { SHOP_STOCKS } from './data/story.js';
import { createCreature, healParty } from './systems/creature.js';
import { TitleScene } from './scenes/title.js';
import { NameScene } from './scenes/name.js';
import { OverworldScene } from './scenes/overworld.js';
import { DialogueScene } from './scenes/dialogue.js';
import { BattleScene } from './scenes/battle.js';
import { MenuScene, SettingsScene } from './scenes/menu.js';
import { ShopScene, StorageScene } from './scenes/shop.js';
import { EndingScene } from './scenes/ending.js';

const FIXED = 1 / 60;

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.r = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = audio;
    this.rng = Math.random;
    this.state = createState();
    this.scene = null;
    this.overlay = null;
    this.world = null;
    this.fade = null;
    this.scriptActive = false;
    this.lastMapMusic = null;
    this.time = 0;
    this.anim = 0;
    this.applySettings();
    this.go(new TitleScene());
  }

  // ---- scene management -------------------------------------------------
  go(scene) {
    if (this.overlay) this.closeOverlay();
    if (this.scene && this.scene.exit) this.scene.exit(this);
    this.scene = scene;
    if (scene && scene.enter) scene.enter(this);
  }

  openOverlay(scene) {
    if (this.overlay) {
      console.warn('[overlay] opening over an existing overlay');
      this.closeOverlay();
    }
    this.overlay = scene;
    if (scene.enter) scene.enter(this);
  }

  closeOverlay(scene = null) {
    if (scene && this.overlay !== scene) return;
    const old = this.overlay;
    this.overlay = null;
    if (old && old.exit) old.exit(this);
  }

  /** Fade out, run callback, fade back in. Resolves at the midpoint. */
  transitionTo(callback) {
    return new Promise(resolve => {
      this.fade = {
        phase: 'out',
        t: 0,
        callback: () => {
          try { if (callback) callback(); }
          finally { resolve(); }
        }
      };
    });
  }

  // ---- data / save -------------------------------------------------------
  newGame() {
    // A new file resets progress, not the player's audio/display preferences.
    const settings = { ...this.state.settings };
    clearSave();
    this.state = createState();
    this.state.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.applySettings();
    this.lastMapMusic = null;
    this.world = null;
    this.go(new NameScene());
  }

  continueGame() {
    const loaded = loadState();
    if (!loaded) return false;
    this.state = loaded;
    this.applySettings();
    this.lastMapMusic = null;
    this.world = new OverworldScene();
    this.go(this.world);
    return true;
  }

  beginJourney(name) {
    this.state.playerName = (name || 'WREN').trim().slice(0, 10).toUpperCase() || 'WREN';
    this.lastMapMusic = null;
    this.world = new OverworldScene();
    this.go(this.world);
  }

  save() {
    if (this.world) this.world.syncState();
    const res = saveState(this.state);
    if (this.audio.started) this.audio.sfx(res.ok ? 'save' : 'error');
    return res;
  }

  applySettings() {
    this.r.shakeEnabled = this.state.settings.shake !== false;
    this.audio.applySettings(this.state.settings);
  }

  // ---- music -------------------------------------------------------------
  musicForScene() {
    if (this.scene instanceof TitleScene) return 'title';
    if (this.scene instanceof EndingScene) return 'victory';
    if (!this.world) return null;
    const map = MAPS[this.state.map];
    return map && map.music ? map.music : 'village';
  }

  startMusic(name) {
    if (!name) return;
    if (this.lastMapMusic === name && this.audio.currentName === name) return;
    this.lastMapMusic = name;
    this.audio.playMusic(name);
  }

  refreshMusic() {
    const name = this.musicForScene();
    if (!name) return;
    this.lastMapMusic = null;
    this.startMusic(name);
  }

  playMusicNow(name) {
    this.lastMapMusic = null;
    this.audio.playMusic(name);
  }

  // ---- modal APIs used by the event interpreter -------------------------
  say(lines, speaker = null) {
    const pages = (Array.isArray(lines) ? lines : [lines]).filter(v => v != null).map(String);
    if (!pages.length) return Promise.resolve();
    return new Promise(resolve => {
      this.openOverlay(new DialogueScene({
        lines: pages,
        speaker,
        onDone: resolve
      }));
    });
  }

  choose(prompt, options) {
    const labels = (options || []).map(o => typeof o === 'string' ? o : o.label);
    return new Promise(resolve => {
      this.openOverlay(new DialogueScene({
        lines: prompt ? [prompt] : [''],
        choices: labels,
        onChoice: index => resolve(index)
      }));
    });
  }

  chooseStarter() {
    return new Promise(resolve => {
      this.openOverlay(new DialogueScene({
        starterSelect: true,
        onStarter: species => resolve(species)
      }));
    });
  }

  async startTrainerBattle(trainer) {
    if (!trainer) return 'lose';
    const st = this.state;
    const foeParty = trainer.party.map(p => {
      const c = createCreature(p.species, p.level, {
        metMap: st.map,
        originalTrainer: trainer.name
      });
      st.seen[c.species] = true;
      return c;
    });
    return this.runBattle({
      kind: 'trainer',
      trainer,
      foeParty,
      canRun: false,
      canCatch: false,
      music: trainer.music || 'battle'
    });
  }

  async startWildBattle(foe, opts = {}) {
    if (!foe) return 'lose';
    this.state.seen[foe.species] = true;
    return this.runBattle({
      kind: 'wild',
      foeParty: [foe],
      canRun: opts.canRun !== false,
      canCatch: opts.canCatch !== false,
      music: 'battle'
    });
  }

  runBattle(cfg) {
    const alive = this.state.party.some(c => c.hp > 0);
    if (!alive) {
      return this.say(['You have no Echoes able to battle.']).then(() => 'lose');
    }
    return new Promise(resolve => {
      let settled = false;
      const finish = async result => {
        if (settled) return;
        settled = true;
        this.closeOverlay();
        this.lastMapMusic = null;
        this.refreshMusic();
        if (result === 'lose') await this.whiteout();
        resolve(result);
      };
      const scene = new BattleScene({ ...cfg, onFinish: finish });
      this.openOverlay(scene);
    });
  }

  async whiteout() {
    const st = this.state;
    healParty(st.party);
    const r = st.respawn && MAPS[st.respawn.map]
      ? st.respawn
      : { map: 'home', x: 6, y: 7 };
    await this.transitionTo(() => {
      st.map = r.map;
      st.x = r.x;
      st.y = r.y;
      st.dir = 'down';
      if (this.world) this.world.teleportInstant(r.map, r.x, r.y, 'down', false);
    });
    const place = MAPS[r.map] ? MAPS[r.map].name : 'home';
    await this.say([
      'Your last Echo falls. The world narrows to a single low note...',
      `You wake up at ${place}. Your Echoes have been cared for.`
    ]);
    this.lastMapMusic = null;
    this.refreshMusic();
  }

  async warpPlayer(target) {
    if (!target || !MAPS[target.map]) return;
    const dir = target.dir || 'down';
    if (this.world) {
      await this.world.teleport(target.map, target.x, target.y, dir, true);
    } else {
      this.state.map = target.map;
      this.state.x = target.x;
      this.state.y = target.y;
      this.state.dir = dir;
    }
  }

  setMapTile(mapId, x, y, ch) {
    const map = MAPS[mapId];
    if (!map || !ch || String(ch).length !== 1) return false;
    if (y < 0 || y >= map.tiles.length || x < 0 || x >= map.tiles[0].length) return false;
    if (!this.state.mapEdits[mapId]) this.state.mapEdits[mapId] = {};
    this.state.mapEdits[mapId][`${x},${y}`] = String(ch);
    return true;
  }

  // ---- modal screens -----------------------------------------------------
  openMenu() {
    if (this.overlay || this.scriptActive) return;
    this.audio.sfx('select');
    this.openOverlay(new MenuScene());
  }

  openTitleSettings() {
    this.go(new SettingsScene(() => this.go(new TitleScene())));
  }

  openShop(id, stock = null) {
    const spec = stock || SHOP_STOCKS[id] || { name: 'Shop', stock: [] };
    return new Promise(resolve => {
      this.openOverlay(new ShopScene(spec, () => {
        this.closeOverlay();
        resolve();
      }));
    });
  }

  openStorage() {
    return new Promise(resolve => {
      this.openOverlay(new StorageScene(() => {
        this.closeOverlay();
        resolve();
      }));
    });
  }

  startEnding() {
    return new Promise(resolve => {
      this.go(new EndingScene(() => {
        this.go(this.world);
        resolve();
      }));
    });
  }

  shopStock(id) {
    return SHOP_STOCKS[id] || null;
  }

  // ---- loop --------------------------------------------------------------
  update(dt) {
    this.anim += dt;
    this.r.updateShake(dt);
    if (this.world && this.scene === this.world) this.state.playtime += dt;

    if (this.fade) {
      this.fade.t += dt;
      if (this.fade.phase === 'out' && this.fade.t >= 0.22) {
        const cb = this.fade.callback;
        this.fade.phase = 'in';
        this.fade.t = 0;
        if (cb) cb();
      } else if (this.fade.phase === 'in' && this.fade.t >= 0.22) {
        this.fade = null;
      }
      return;
    }

    if (this.overlay) {
      if (this.overlay.update) this.overlay.update(this, dt);
      return;
    }
    if (this.scene && this.scene.update) this.scene.update(this, dt);
  }

  draw() {
    this.r.clear('#9bbc0f');
    this.r.ctx.save();
    this.r.applyShake();
    if (this.scene && this.scene.draw) this.scene.draw(this, this.r);
    if (this.overlay && this.overlay.draw) this.overlay.draw(this, this.r);
    this.r.ctx.restore();

    if (this.fade) {
      const a = this.fade.phase === 'out'
        ? Math.min(1, this.fade.t / 0.22)
        : Math.max(0, 1 - this.fade.t / 0.22);
      this.r.ctx.globalAlpha = a;
      this.r.rect(0, 0, W, H, '#0f380f');
      this.r.ctx.globalAlpha = 1;
    }
  }
}

const MANUAL = new URLSearchParams(location.search).has('manual');
const game = new Game();
window.__game = game;

let last = performance.now();
let acc = 0;

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  acc += dt;
  let steps = 0;
  while (acc >= FIXED && steps < 6) {
    try {
      game.update(FIXED);
    } catch (err) {
      console.error('[update]', err);
    }
    game.input.endFrame();
    acc -= FIXED;
    steps++;
  }
  if (steps === 0) {
    // Keep the frame alive without consuming input edges before a fixed step.
    acc = Math.min(acc, FIXED);
  }
  try { game.draw(); }
  catch (err) { console.error('[draw]', err); }
  requestAnimationFrame(frame);
}
if (!MANUAL) requestAnimationFrame(frame);

/** Deterministic stepping hook for the browser playtest and screenshots. */
function step(n = 1) {
  for (let i = 0; i < n; i++) {
    game.update(FIXED);
    game.input.endFrame();
  }
  game.draw();
  return {
    scene: game.scene && game.scene.constructor.name,
    overlay: game.overlay && game.overlay.constructor.name,
    map: game.state.map,
    x: game.state.x,
    y: game.state.y
  };
}
window.__step = step;

document.addEventListener('visibilitychange', () => { last = performance.now(); acc = 0; });

function resize() {
  const vw = window.innerWidth - 24;
  const vh = window.innerHeight - 86;
  let scale = Math.min(vw / W, vh / H);
  scale = scale >= 1 ? Math.floor(scale) : Math.max(0.5, scale);
  game.canvas.style.width = `${Math.round(W * scale)}px`;
  game.canvas.style.height = `${Math.round(H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

let unlocked = false;
function unlock() {
  game.canvas.focus();
  if (unlocked) return;
  unlocked = true;
  game.audio.unlock();
  game.applySettings();
  game.refreshMusic();
}
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

export { game, Game };

// Automated smoke hooks. They intentionally use the real game loop APIs.
window.__test = {
  game,
  tile: TILE,
  save: () => game.save(),
  load: () => loadState(),
  hasSave,
  resetSave: clearSave,
  addItem: (id, n = 1) => addItem(game.state, id, n)
};

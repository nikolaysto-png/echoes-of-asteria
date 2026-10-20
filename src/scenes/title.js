import { W, H, PAL } from '../core/constants.js';
import { drawBox } from '../render/ui.js';
import { hasSave, loadState } from '../core/state.js';
import { drawCreature } from '../render/sprites.js';

const A_KEYS = ['z', 'enter'];
const B_KEYS = ['x', 'escape', 'backspace'];
const isA = inp => inp.anyOf(...A_KEYS);
const isB = inp => inp.anyOf(...B_KEYS);

function clock(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor((total % 3600) / 60)).padStart(2, '0')}`;
}

export class TitleScene {
  constructor() {
    this.index = 0;
    this.t = 0;
    this.hasSave = false;
    this.saveInfo = null;
  }

  enter(game) {
    this.t = 0;
    this.hasSave = hasSave();
    this.saveInfo = this.hasSave ? loadState() : null;
    this.index = 0;
    game.startMusic('title');
  }

  items() {
    const list = [];
    if (this.hasSave) list.push({ label: 'CONTINUE', action: 'continue' });
    list.push({ label: 'NEW GAME', action: 'new' });
    list.push({ label: 'OPTIONS', action: 'options' });
    return list;
  }

  update(game, dt) {
    this.t += dt;
    const inp = game.input;
    const items = this.items();
    this.index = Math.max(0, Math.min(this.index, items.length - 1));

    if (inp.anyOf('arrowdown', 's')) {
      this.index = (this.index + 1) % items.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.index = (this.index - 1 + items.length) % items.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      // There is nowhere to back out to from the title. A short cancel tone
      // makes that explicit instead of silently swallowing the input.
      game.audio.sfx('cancel');
      return;
    }
    if (!isA(inp)) return;

    game.audio.unlock();
    game.audio.sfx('select');
    const action = items[this.index].action;
    if (action === 'new') {
      game.newGame();
    } else if (action === 'continue') {
      if (!game.continueGame()) {
        this.hasSave = false;
        this.saveInfo = null;
        this.index = 0;
        game.audio.sfx('error');
      }
    } else if (action === 'options') {
      game.openTitleSettings();
    }
  }

  draw(game, r) {
    r.rect(0, 0, W, H, PAL.pale);

    // Sky.
    r.dither(0, 0, W, 74, PAL.light, 3);
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + 11) % W;
      const y = 4 + (i * 11) % 36;
      const tw = Math.sin(this.t * 2 + i) > 0.3;
      if (tw) r.rect(x, y, 1, 1, PAL.dark);
    }
    // Sun over the sky, tucked clear of the lettering.
    r.ellipse(12, 14, 7, 7, PAL.dark);
    r.ellipse(12, 14, 5, 5, PAL.pale);
    r.rect(10, 12, 2, 2, PAL.light);

    // Horizon and low islands.
    r.rect(0, 72, W, 1, PAL.dark);
    r.rect(0, 73, W, 71, PAL.mid);
    r.dither(0, 74, W, 20, PAL.dark, 4);
    for (let x = 0; x < W; x += 4) {
      const y = 88 + Math.round(Math.sin(this.t * 0.9 + x * 0.08) * 2);
      r.rect(x, y, 2, 1, PAL.dark);
    }
    r.rect(8, 68, 26, 4, PAL.dark);
    r.rect(12, 66, 10, 2, PAL.dark);
    r.rect(130, 69, 22, 3, PAL.dark);
    r.rect(136, 67, 6, 2, PAL.dark);

    // Two Echoes on the title. Scale 1 keeps them inside the 160px screen.
    drawCreature(r, 27, 60, 'mossprig', { scale: 1 });
    drawCreature(r, 133, 59, 'pyrelisk', { scale: 1 });

    // Title lettering.
    r.text('ECHOES', W / 2, 4, { scale: 2, color: PAL.dark, align: 'center' });
    r.text('OF ASTERIA', W / 2, 22, { scale: 2, color: PAL.dark, align: 'center' });
    r.text('A RESONANCE TALE', W / 2, 40, { scale: 1, color: PAL.mid, align: 'center' });

    // Menu window.
    const items = this.items();
    const mw = 112;
    const mx = (W - mw) / 2;
    const mh = 10 + items.length * 11;
    const my = 78;
    drawBox(r, mx, my, mw, mh, { fill: PAL.pale });
    items.forEach((item, i) => {
      const y = my + 6 + i * 11;
      const on = i === this.index;
      if (on) {
        r.rect(mx + 3, y - 1, mw - 6, 10, PAL.light);
        r.text('>', mx + 6, y, { color: PAL.dark });
      }
      r.text(item.label, W / 2, y, {
        color: PAL.dark,
        align: 'center',
        maxWidth: mw - 18
      });
    });

    // Save summary adds useful information without a second screen.
    if (this.hasSave && this.saveInfo) {
      const info = this.saveInfo;
      if (this.index === 0) {
        r.text(`${info.playerName || 'WREN'}  ${clock(info.playtime)}`, W / 2, 122, {
          color: PAL.pale, align: 'center', maxWidth: W - 12
        });
      } else {
        r.text('A journey is waiting.', W / 2, 122, { color: PAL.pale, align: 'center' });
      }
    } else {
      r.text('THE TIDE IS HIGH. BEGIN.', W / 2, 122, { color: PAL.pale, align: 'center' });
    }

    r.text('Z: SELECT   X: CANCEL', W / 2, 134, { color: PAL.pale, align: 'center' });
  }
}

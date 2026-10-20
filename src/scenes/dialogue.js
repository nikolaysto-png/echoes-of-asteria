import { W, H, PAL } from '../core/constants.js';
import { wrapText } from '../core/font.js';
import { drawBox, drawCursor } from '../render/ui.js';
import { CREATURES, STARTERS } from '../data/creatures.js';
import { typeName } from '../data/types.js';
import { drawCreature } from '../render/sprites.js';

const SPEEDS = [18, 38, 70];
const CHARS_PER_LINE = 24;
const LINES_PER_PAGE = 4;

function buildPages(lines) {
  const out = [];
  for (const line of lines || []) {
    const wrapped = wrapText(String(line), 148, 1);
    for (let i = 0; i < wrapped.length; i += LINES_PER_PAGE) {
      out.push(wrapped.slice(i, i + LINES_PER_PAGE).join('\n'));
    }
  }
  return out;
}

export class DialogueScene {
  constructor(cfg = {}) {
    this.cfg = cfg;
    this.lines = cfg.lines || [];
    this.pages = buildPages(this.lines);
    this.mode = cfg.starterSelect && this.pages.length === 0 ? 'starter' : 'lines';
    this.page = 0;
    this.shown = 0;
    this.choice = 0;
    this.starter = 0;
    this.t = 0;
    this.sfxAcc = 0;
    this.done = false;
  }

  enter(game) {
    this.game = game;
    this.t = 0;
    this.page = 0;
    this.shown = 0;
    if (this.cfg.starterSelect && this.pages.length === 0) this.mode = 'starter';
  }

  currentText() {
    return this.pages[this.page] || '';
  }

  update(game, dt) {
    this.t += dt;
    const inp = game.input;

    if (this.mode === 'starter') {
      this.updateStarter(game, inp);
      return;
    }

    if (this.mode === 'choices') {
      this.updateChoices(game, inp);
      return;
    }

    const full = this.currentText();
    if (this.shown < full.length) {
      if (inp.anyOf('z', 'enter', 'x', 'escape')) {
        this.shown = full.length;
        return;
      }
      const speed = SPEEDS[Math.min(2, game.state.settings.textSpeed ?? 1)];
      const before = Math.floor(this.shown);
      this.shown = Math.min(full.length, this.shown + speed * dt);
      const ch = full[Math.floor(this.shown) - 1];
      if (Math.floor(this.shown) > before && ch && ch !== ' ' && ch !== '\n') {
        this.sfxAcc++;
        if (this.sfxAcc % 3 === 0) game.audio.sfx('text');
      }
      return;
    }

    if (inp.anyOf('z', 'enter')) {
      game.audio.sfx('cursor');
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.shown = 0;
        return;
      }
      if (this.cfg.starterSelect) {
        this.mode = 'starter';
        return;
      }
      if (this.cfg.choices && this.cfg.choices.length) {
        this.mode = 'choices';
        return;
      }
      this.finish();
    }
  }

  updateChoices(game, inp) {
    const n = this.cfg.choices.length;
    if (inp.anyOf('arrowup', 'w')) {
      this.choice = (this.choice - 1 + n) % n;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowdown', 's')) {
      this.choice = (this.choice + 1) % n;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('z', 'enter')) {
      game.audio.sfx('select');
      const index = this.choice;
      const cb = this.cfg.onChoice;
      this.close(game);
      if (cb) cb(index);
      return;
    }
    if (this.cfg.allowCancel && inp.anyOf('x', 'escape')) {
      game.audio.sfx('cancel');
      const cb = this.cfg.onCancel;
      this.close(game);
      if (cb) cb();
    }
  }

  updateStarter(game, inp) {
    if (inp.anyOf('arrowleft', 'a')) {
      this.starter = (this.starter + STARTERS.length - 1) % STARTERS.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowright', 'd')) {
      this.starter = (this.starter + 1) % STARTERS.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('z', 'enter')) {
      game.audio.sfx('select');
      const species = STARTERS[this.starter];
      const cb = this.cfg.onStarter;
      this.close(game);
      if (cb) cb(species);
    }
  }

  close(game) {
    if (this.done) return;
    this.done = true;
    game.closeOverlay(this);
  }

  finish() {
    if (this.done) return;
    const cb = this.cfg.onDone;
    this.close(this.game);
    if (cb) cb();
  }

  draw(game, r) {
    if (this.mode === 'starter') {
      this.drawStarter(r);
      return;
    }

    const full = this.currentText();
    const shown = full.slice(0, Math.floor(this.shown));
    const done = this.shown >= full.length;
    drawBox(r, 0, 96, W, 48);
    if (this.cfg.speaker) {
      const sw = Math.min(W - 12, r.measure(this.cfg.speaker, 1) + 9);
      drawBox(r, 5, 85, sw, 12);
      r.text(this.cfg.speaker, 9, 87, { color: PAL.dark, maxWidth: sw - 8 });
    }
    r.text(shown, 6, 103, { color: PAL.dark, maxWidth: W - 12, lineHeight: 9 });
    if (done) {
      const bob = Math.sin(this.t * 6) > 0 ? 0 : 1;
      r.text('v', W - 10, 132 + bob, { color: PAL.dark });
    }

    if (this.mode === 'choices') this.drawChoices(r);
  }

  drawChoices(r) {
    const labels = this.cfg.choices || [];
    const w = 104;
    const x = W - w - 4;
    const h = 6 + labels.length * 11;
    const y = 96 - h - 2;
    drawBox(r, x, y, w, h);
    labels.forEach((label, i) => {
      const yy = y + 4 + i * 11;
      if (i === this.choice) {
        r.rect(x + 3, yy - 1, w - 6, 9, PAL.light);
        drawCursor(r, x + 5, yy, 1);
      }
      r.text(label, x + 13, yy, { color: PAL.dark, maxWidth: w - 17 });
    });
  }

  drawStarter(r) {
    r.rect(0, 0, W, H, PAL.pale);
    drawBox(r, 2, 2, W - 4, H - 4);
    r.text('CHOOSE YOUR FIRST ECHO', W / 2, 8, { color: PAL.dark, align: 'center' });

    STARTERS.forEach((id, i) => {
      const cx = 32 + i * 48;
      const on = i === this.starter;
      if (on) {
        r.rect(cx - 18, 37, 36, 36, PAL.light);
        r.stroke(cx - 18, 37, 36, 36, PAL.dark);
      }
      drawCreature(r, cx, 55, id, { scale: 1 });
      r.text(CREATURES[id].name.toUpperCase(), cx, 77, {
        color: PAL.dark, align: 'center'
      });
    });

    r.text('<', 5, 50, { color: PAL.dark });
    r.text('>', W - 9, 50, { color: PAL.dark });

    const id = STARTERS[this.starter];
    const def = CREATURES[id];
    drawBox(r, 4, 86, W - 8, 54);
    r.text(`${def.name}  `, 9, 91, { color: PAL.dark });
    r.text(def.types.map(typeName).join('/'), 9, 101, { color: PAL.mid });
    r.text(`HP ${def.base.hp}  ATK ${def.base.atk}  DEF ${def.base.def}`, 9, 113, { color: PAL.dark });
    r.text(`SPC ${def.base.spc}  SPD ${def.base.spd}`, 9, 122, { color: PAL.dark });
    r.text('LEFT/RIGHT: LOOK   Z: CHOOSE', 9, 132, { color: PAL.mid });
  }
}

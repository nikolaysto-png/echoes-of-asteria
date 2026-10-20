import { W, H, PAL } from '../core/constants.js';
import { drawBox } from '../render/ui.js';
import { TitleScene } from './title.js';

const A_KEYS = ['z', 'enter'];
const B_KEYS = ['x', 'backspace'];

const KEY_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '-', ' ', 'DEL', 'END']
];

const KEYS = KEY_ROWS.flat();

export class NameScene {
  constructor() {
    this.name = '';
    this.sel = 0;
    this.t = 0;
    this.done = false;
    this.message = '';
    this.messageT = 0;
  }

  enter(game) {
    this.game = game;
    this.t = 0;
    this.done = false;
    // Do not let the key that chose NEW GAME also type a letter here.
    game.input.pressed.clear();
    game.audio.sfx('select');
  }

  addChar(ch) {
    if (this.name.length >= 10) {
      this.game.audio.sfx('error');
      this.message = 'That is as long as the register allows.';
      this.messageT = 1.6;
      return;
    }
    this.name += ch;
    this.game.audio.sfx('text');
  }

  finish() {
    if (this.done) return;
    this.done = true;
    const name = (this.name.trim() || 'WREN').slice(0, 10).toUpperCase();
    this.game.audio.sfx('select');
    this.game.beginJourney(name);
  }

  update(game, dt) {
    this.t += dt;
    if (this.messageT > 0) {
      this.messageT = Math.max(0, this.messageT - dt);
      if (this.messageT === 0) this.message = '';
    }
    const inp = game.input;

    if (inp.hit('escape')) {
      game.audio.sfx('cancel');
      game.go(new TitleScene());
      return;
    }
    if (inp.anyOf('enter', 'c', 'm', 'shift')) {
      this.finish();
      return;
    }
    if (inp.anyOf(...B_KEYS)) {
      if (this.name.length) {
        this.name = this.name.slice(0, -1);
        game.audio.sfx('cancel');
      } else {
        game.audio.sfx('error');
      }
      return;
    }

    if (inp.anyOf('arrowleft', 'a')) this.sel = (this.sel + 5) % 6 + Math.floor(this.sel / 6) * 6;
    if (inp.anyOf('arrowright', 'd')) this.sel = (this.sel + 1) % 6 + Math.floor(this.sel / 6) * 6;
    if (inp.anyOf('arrowup', 'w')) this.sel = (this.sel - 6 + KEYS.length) % KEYS.length;
    if (inp.anyOf('arrowdown', 's')) this.sel = (this.sel + 6) % KEYS.length;
    if (inp.anyOf('arrowleft', 'a', 'arrowright', 'd', 'arrowup', 'w', 'arrowdown', 's')) {
      game.audio.sfx('cursor');
    }

    if (!inp.anyOf(...A_KEYS)) return;
    const key = KEYS[this.sel];
    if (key === 'DEL') {
      if (this.name.length) {
        this.name = this.name.slice(0, -1);
        game.audio.sfx('cancel');
      } else {
        game.audio.sfx('error');
      }
    } else if (key === 'END') {
      this.finish();
    } else {
      this.addChar(key);
    }
  }

  draw(game, r) {
    r.rect(0, 0, W, H, PAL.pale);
    r.dither(0, 0, W, H, PAL.light, 4);

    drawBox(r, 2, 2, W - 4, 13, { fill: PAL.pale });
    r.text('WHAT IS YOUR NAME?', 6, 5, { color: PAL.dark });
    r.text(`${this.name.length}/10`, W - 6, 5, { color: PAL.mid, align: 'right' });

    drawBox(r, 4, 18, W - 8, 20, { fill: PAL.pale });
    r.text('NAME', 8, 24, { color: PAL.mid });
    r.rect(33, 21, 1, 14, PAL.mid);
    r.text(this.name, 38, 24, { color: PAL.dark, maxWidth: 84 });
    if (Math.sin(this.t * 5) > -0.2) {
      const cursorX = 38 + (this.name.length ? game.r.measure(this.name, 1) + 1 : 0);
      r.rect(cursorX, 25, 1, 7, PAL.dark);
    }

    drawBox(r, 4, 42, W - 8, 76, { fill: PAL.pale });
    KEY_ROWS.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        const index = rowIndex * 6 + colIndex;
        const x = 8 + colIndex * 24;
        const y = 47 + rowIndex * 13;
        const w = 22;
        const on = index === this.sel;
        r.rect(x, y, w, 11, on ? PAL.dark : PAL.pale);
        if (!on) r.stroke(x, y, w, 11, PAL.mid, 1);
        const label = key === ' ' ? 'SPC' : key;
        r.text(label, x + w / 2, y + 2, {
          color: on ? PAL.pale : PAL.dark,
          align: 'center',
          maxWidth: w - 3
        });
      });
    });

    if (this.message) {
      r.text(this.message, W / 2, 119, { color: PAL.dark, align: 'center', maxWidth: W - 8 });
    } else {
      r.text('SPC IS SPACE. END ACCEPTS.', W / 2, 119, { color: PAL.mid, align: 'center' });
    }
    r.text('ARROWS: MOVE   A: TYPE', W / 2, 128, { color: PAL.mid, align: 'center' });
    r.text('B: DELETE   START: DONE', W / 2, 136, { color: PAL.mid, align: 'center' });
  }
}

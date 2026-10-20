import { W, H, PAL } from '../core/constants.js';
import { wrapText } from '../core/font.js';
import { drawBox } from '../render/ui.js';
import { drawCreature, drawCharacter } from '../render/sprites.js';
import { CHAPTER_END } from '../data/story.js';

const SPEEDS = [18, 38, 70];
const A_KEYS = ['z', 'enter'];
const isA = inp => inp.anyOf(...A_KEYS);

function buildPages() {
  const pages = [];
  for (const line of CHAPTER_END) {
    const wrapped = wrapText(String(line), W - 12, 1);
    for (let i = 0; i < wrapped.length; i += 3) {
      pages.push(wrapped.slice(i, i + 3).join('\n'));
    }
  }
  return pages.length ? pages : [''];
}

/** The chapter-one epilogue. Played once, then the world remains open. */
export class EndingScene {
  constructor(onClose = () => {}) {
    this.onClose = onClose;
    this.pages = buildPages();
    this.page = 0;
    this.shown = 0;
    this.t = 0;
    this.finished = false;
  }

  enter(game) {
    this.game = game;
    this.t = 0;
    this.page = 0;
    this.shown = 0;
    game.startMusic('victory');
  }

  completePage() {
    return this.shown >= (this.pages[this.page] || '').length;
  }

  finish(game) {
    if (this.finished) return;
    this.finished = true;
    game.state.flags.ending_seen = true;
    game.save();
    game.audio.sfx('save');
    this.onClose();
  }

  update(game, dt) {
    this.t += dt;
    const inp = game.input;
    const full = this.pages[this.page] || '';

    if (!this.completePage()) {
      if (isA(inp) || inp.anyOf('x', 'escape')) {
        this.shown = full.length;
        return;
      }
      const speed = SPEEDS[Math.min(2, game.state.settings.textSpeed ?? 1)];
      this.shown = Math.min(full.length, this.shown + speed * dt);
      return;
    }

    if (!isA(inp)) return;
    game.audio.sfx('cursor');
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.shown = 0;
      return;
    }
    this.finish(game);
  }

  draw(game, r) {
    r.rect(0, 0, W, H, PAL.pale);

    // Night sky over the eastern sea.
    r.dither(0, 0, W, 62, PAL.light, 3);
    for (let i = 0; i < 22; i++) {
      const x = (i * 29 + 7) % W;
      const y = 3 + (i * 13) % 46;
      const tw = Math.sin(this.t * 1.7 + i * 0.8) > -0.2;
      if (tw) r.rect(x, y, 1, 1, PAL.dark);
    }
    r.ellipse(127, 16, 9, 9, PAL.dark);
    r.ellipse(127, 16, 8, 8, PAL.pale);
    r.rect(124, 13, 2, 1, PAL.light);

    // The sea and the cliffs of Lumen Bay.
    r.rect(0, 62, W, 1, PAL.dark);
    r.rect(0, 63, W, 81, PAL.mid);
    r.dither(0, 63, W, 24, PAL.dark, 4);
    for (let x = 0; x < W; x += 5) {
      const y = 72 + Math.round(Math.sin(this.t * 0.8 + x * 0.1) * 2);
      r.rect(x, y, 3, 1, PAL.dark);
    }
    r.rect(0, 86, 34, 58, PAL.dark);
    r.rect(34, 92, 12, 52, PAL.dark);
    r.rect(126, 88, 34, 56, PAL.dark);
    r.rect(118, 94, 12, 50, PAL.dark);

    // The shard, the player, and the first Echo watching the water.
    const pulse = Math.sin(this.t * 2.2);
    r.rect(76, 36, 5, 9, PAL.dark);
    r.rect(77, 37, 3, 7, pulse > 0 ? PAL.pale : PAL.light);
    r.rect(74, 33, 2, 4, PAL.dark);
    r.rect(81, 33, 2, 4, PAL.dark);

    drawCharacter(r, 62, 94, 'player', 'up', 0, 2);
    const species = game.state.party[0] ? game.state.party[0].species : 'tidelume';
    drawCreature(r, 103, 82, species, { scale: 1 });

    r.text('CHAPTER ONE', 5, 5, { color: PAL.dark });
    r.text(`${this.page + 1}/${this.pages.length}`, W - 5, 5, { color: PAL.dark, align: 'right' });

    // Dialogue window.
    const full = this.pages[this.page] || '';
    const shown = full.slice(0, Math.floor(this.shown));
    const done = this.completePage();
    drawBox(r, 0, 96, W, 48, { fill: PAL.pale });
    r.text(shown, 6, 103, { color: PAL.dark, maxWidth: W - 12, lineHeight: 9 });
    if (done) {
      const bob = Math.sin(this.t * 6) > 0 ? 0 : 1;
      const last = this.page === this.pages.length - 1;
      if (last) {
        r.text('Z: RETURN TO ASTERIA', W / 2, 134 + bob, {
          color: PAL.mid, align: 'center'
        });
      } else {
        r.text('v', W - 10, 132 + bob, { color: PAL.dark });
      }
    }
  }
}

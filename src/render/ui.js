import { PAL, W, H } from '../core/constants.js';

// A deliberately tiny Gen-I window toolkit. Every colour used here is one of
// the four DMG shades; no scene is allowed to invent a fifth colour.

export const UI = {
  ink: PAL.dark,
  shade: PAL.mid,
  bright: PAL.light,
  paper: PAL.pale
};

export function drawBox(r, x, y, w, h, opts = {}) {
  const fill = opts.fill || PAL.pale;
  const border = opts.border || PAL.dark;
  const inner = opts.inner || PAL.mid;
  r.rect(x, y, w, h, border);
  r.rect(x + 1, y + 1, w - 2, h - 2, fill);
  if (opts.inner !== false) {
    r.rect(x + 2, y + 2, w - 4, 1, inner);
    r.rect(x + 2, y + h - 3, w - 4, 1, inner);
    r.rect(x + 2, y + 2, 1, h - 4, inner);
    r.rect(x + w - 3, y + 2, 1, h - 4, inner);
  }
}

/** Alias kept for a familiar reading of older scene code. */
export const panel = drawBox;

export function drawCursor(r, x, y, scale = 1) {
  r.text('>', x, y, { scale, color: PAL.dark });
}

export function hpBar(r, x, y, w, h, ratio) {
  const pct = Math.max(0, Math.min(1, Number(ratio) || 0));
  r.rect(x, y, w, h, PAL.dark);
  r.rect(x + 1, y + 1, w - 2, h - 2, PAL.pale);
  const fw = Math.round((w - 2) * pct);
  if (fw > 0) {
    const tone = pct > 0.5 ? PAL.mid : pct > 0.2 ? PAL.mid : PAL.dark;
    r.rect(x + 1, y + 1, fw, h - 2, tone);
    // A highlight row keeps the bar readable at 1px heights.
    if (h >= 4) r.rect(x + 1, y + 1, fw, 1, pct > 0.2 ? PAL.light : PAL.pale);
  }
}

export function expBar(r, x, y, w, h, ratio) {
  const pct = Math.max(0, Math.min(1, Number(ratio) || 0));
  r.rect(x, y, w, h, PAL.dark);
  r.rect(x + 1, y + 1, w - 2, h - 2, PAL.pale);
  const fw = Math.round((w - 2) * pct);
  if (fw > 0) r.rect(x + 1, y + 1, fw, h - 2, PAL.mid);
}

export function meter(r, x, y, w, h, ratio) {
  hpBar(r, x, y, w, h, ratio);
}

export function typeBadge(r, x, y, label, selected = false) {
  const w = r.measure(label, 1) + 5;
  if (selected) {
    r.rect(x, y, w, 9, PAL.dark);
    r.text(label, x + 2, y + 1, { scale: 1, color: PAL.pale });
  } else {
    r.rect(x, y, w, 9, PAL.light);
    r.rect(x, y, w, 1, PAL.mid);
    r.text(label, x + 2, y + 1, { scale: 1, color: PAL.dark });
  }
  return w;
}

export function speakerBox(r, name, x = 6, y = 83) {
  if (!name) return;
  const w = Math.min(W - 12, r.measure(name, 1) + 8);
  drawBox(r, x, y, w, 12, { fill: PAL.pale });
  r.text(name, x + 4, y + 2, { scale: 1, color: PAL.dark, maxWidth: w - 8 });
}

export function dialogueBox(r, text, opts = {}) {
  const h = opts.height || 48;
  const y = opts.y != null ? opts.y : H - h;
  const x = opts.x != null ? opts.x : 0;
  const w = opts.width || W;
  drawBox(r, x, y, w, h);
  if (opts.speaker) speakerBox(r, opts.speaker, x + 6, y - 10);
  r.text(text, x + 6, y + 7, {
    scale: 1,
    color: PAL.dark,
    maxWidth: w - 12,
    lineHeight: 9
  });
  if (opts.arrow) {
    const bob = Math.round(Math.sin((opts.t || 0) * 6) * 1);
    r.text('v', x + w - 10, y + h - 11 + bob, { scale: 1, color: PAL.dark });
  }
}

export function choiceBox(r, prompt, options, index, opts = {}) {
  const w = opts.width || 86;
  const rowH = 12;
  const promptLines = prompt ? r.wrap(prompt, w - 10, 1) : [];
  const h = 8 + promptLines.length * 9 + options.length * rowH;
  const x = opts.x != null ? opts.x : W - w - 4;
  const y = opts.y != null ? opts.y : Math.max(4, H - 52 - h);
  drawBox(r, x, y, w, h);
  let yy = y + 5;
  for (const line of promptLines) {
    r.text(line, x + 5, yy, { scale: 1, color: PAL.dark });
    yy += 9;
  }
  options.forEach((label, i) => {
    const sy = yy + i * rowH;
    if (i === index) {
      drawCursor(r, x + 5, sy, 1);
      r.rect(x + 4, sy - 1, w - 8, 9, PAL.light);
      r.text(label, x + 13, sy, { scale: 1, color: PAL.dark });
    } else {
      r.text(label, x + 13, sy, { scale: 1, color: PAL.dark });
    }
  });
  return { x, y, w, h };
}

export function listRow(r, x, y, w, label, right, selected, opts = {}) {
  if (selected) {
    r.rect(x, y - 1, w, 9, PAL.light);
    drawCursor(r, x + 1, y, 1);
  }
  r.text(label, x + 8, y, {
    scale: 1,
    color: selected ? PAL.dark : (opts.dim ? PAL.mid : PAL.dark),
    maxWidth: w - (right ? 34 : 12)
  });
  if (right != null) {
    const tw = r.measure(String(right), 1);
    r.text(String(right), x + w - tw - 2, y, { scale: 1, color: selected ? PAL.dark : PAL.mid });
  }
}

export function drawHpLine(r, x, y, creature, opts = {}) {
  if (!creature) return;
  const label = opts.label || creature.name;
  r.text(label, x, y, { scale: 1, color: PAL.dark, maxWidth: opts.nameWidth || 58 });
  if (opts.level !== false) {
    const lv = `L${creature.level}`;
    r.text(lv, x + (opts.levelX != null ? opts.levelX : 50), y, { scale: 1, color: PAL.dark });
  }
  if (creature.status) {
    r.text(creature.status, x + (opts.statusX != null ? opts.statusX : 66), y, { scale: 1, color: PAL.dark });
  }
  hpBar(r, x, y + 9, opts.width || 64, 3, creature.hp / Math.max(1, creature.maxHp));
  if (opts.hpText) {
    r.text(`${creature.hp}/${creature.maxHp}`, x + (opts.width || 64) - 20, y + 13, { scale: 1, color: PAL.mid });
  }
}

export function clockText(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function panelTitle(r, title, x, y, w) {
  r.text(title, x + w / 2, y + 3, { scale: 1, color: PAL.dark, align: 'center' });
  r.rect(x + 4, y + 12, w - 8, 1, PAL.mid);
}

export function scrollArrows(r, x, y, w, up, down) {
  if (up) r.text('^', x + w - 6, y + 2, { scale: 1, color: PAL.mid });
  if (down) r.text('v', x + w - 6, y + 122, { scale: 1, color: PAL.mid });
}

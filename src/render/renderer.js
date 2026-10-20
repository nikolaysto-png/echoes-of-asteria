import { W, H, PAL } from '../core/constants.js';
import { drawText, measureText, wrapText } from '../core/font.js';

/** Small, palette-locked drawing surface used by every scene. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.shake = { x: 0, y: 0, mag: 0 };
    this.shakeEnabled = true;
  }

  clear(color = PAL.pale) {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = color;
    c.fillRect(0, 0, W, H);
  }

  rect(x, y, w, h, color = PAL.dark) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  stroke(x, y, w, h, color = PAL.dark, width = 1) {
    const c = this.ctx;
    c.fillStyle = color;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    c.fillRect(x, y, w, width);
    c.fillRect(x, y + h - width, w, width);
    c.fillRect(x, y, width, h);
    c.fillRect(x + w - width, y, width, h);
  }

  pixel(x, y, color = PAL.dark) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  line(x1, y1, x2, y2, color = PAL.dark) {
    const ctx = this.ctx;
    x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
    const dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
    let err = dx + dy;
    ctx.fillStyle = color;
    for (;;) {
      ctx.fillRect(x1, y1, 1, 1);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x1 += sx; }
      if (e2 <= dx) { err += dx; y1 += sy; }
    }
  }

  ellipse(cx, cy, rx, ry, color = PAL.dark) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(Math.round(cx), Math.round(cy), Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Dither a rectangle, leaving the background visible in between. */
  ditherRect(x, y, w, h, color = PAL.mid, step = 2) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j += step) {
      for (let i = (j / step) % 2; i < w; i += step * 2) ctx.fillRect(x + i, y + j, 1, 1);
    }
  }

  /** Ordered dither between two shades. */
  dither(x, y, w, h, color = PAL.mid, density = 2) {
    const c = this.ctx;
    c.fillStyle = color;
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j += density) {
      for (let i = (j / density) % 2; i < w; i += density * 2) c.fillRect(x + i, y + j, 1, 1);
    }
  }

  /** Filled window with a double pixel border, Gen-I style. */
  window(x, y, w, h, opts = {}) {
    const fill = opts.fill || PAL.pale;
    const border = opts.border || PAL.dark;
    const inner = opts.inner || PAL.mid;
    this.rect(x, y, w, h, border);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
    this.rect(x + 2, y + 2, w - 4, 1, inner);
    this.rect(x + 2, y + h - 3, w - 4, 1, inner);
    this.rect(x + 2, y + 2, 1, h - 4, inner);
    this.rect(x + w - 3, y + 2, 1, h - 4, inner);
  }

  text(str, x, y, opts = {}) {
    return drawText(this.ctx, str, x, y, {
      scale: opts.scale || 1,
      color: opts.color || PAL.dark,
      align: opts.align || 'left',
      maxWidth: opts.maxWidth || 0,
      lineHeight: opts.lineHeight || 9,
      spacing: opts.spacing
    });
  }

  measure(str, scale = 1) { return measureText(str, scale); }
  wrap(str, maxWidth, scale = 1) { return wrapText(str, maxWidth, scale); }

  sprite(canvas, x, y) {
    if (!canvas) return;
    this.ctx.drawImage(canvas, Math.round(x), Math.round(y));
  }

  spriteScaled(canvas, x, y, scale = 1) {
    if (!canvas) return;
    const c = this.ctx;
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(canvas, Math.round(x), Math.round(y), canvas.width * scale, canvas.height * scale);
    c.restore();
  }

  spriteClipped(canvas, x, y, clipX, clipY, clipW, clipH) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(Math.round(clipX), Math.round(clipY), Math.round(clipW), Math.round(clipH));
    c.clip();
    c.drawImage(canvas, Math.round(x), Math.round(y));
    c.restore();
  }

  addShake(mag = 2) {
    if (!this.shakeEnabled) return;
    this.shake.mag = Math.max(this.shake.mag, mag);
  }

  updateShake(dt) {
    if (this.shake.mag > 0.3) {
      this.shake.x = (Math.random() * 2 - 1) * this.shake.mag;
      this.shake.y = (Math.random() * 2 - 1) * this.shake.mag;
      this.shake.mag *= Math.pow(0.001, dt);
    } else {
      this.shake.mag = 0;
      this.shake.x = 0;
      this.shake.y = 0;
    }
  }

  applyShake() {
    if (this.shake.x || this.shake.y) this.ctx.translate(Math.round(this.shake.x), Math.round(this.shake.y));
  }

  pushClip(x, y, w, h) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    this.ctx.clip();
  }

  popClip() { this.ctx.restore(); }
}

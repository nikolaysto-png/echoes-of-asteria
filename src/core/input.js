// Keyboard input latched per fixed-update. Supports held direction repeats.
const PREVENT = new Set([
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab', 'f1', 'f3', 'f4'
]);

function normalize(key) {
  if (key === ' ') return 'space';
  if (key === 'Enter') return 'enter';
  if (key === 'Escape') return 'escape';
  if (key === 'Shift') return 'shift';
  if (key === 'Backspace') return 'backspace';
  if (key === 'Control') return 'ctrl';
  if (key === 'Alt') return 'alt';
  if (key === 'Meta') return 'meta';
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.heldTime = new Map();
    this.repeatDelay = 0.30;
    this.repeatRate = 0.075;
    this.text = '';
    this.onKey = null;

    this._onDown = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = normalize(e.key);
      if (PREVENT.has(k)) e.preventDefault();
      if (!this.down.has(k)) {
        this.pressed.add(k);
        this.heldTime.set(k, 0);
        if (k.length === 1 && /[a-z0-9 ]/i.test(k)) {
          this.text += k;
          if (this.text.length > 12) this.text = this.text.slice(-12);
        }
      }
      this.down.add(k);
      if (this.onKey) this.onKey(k, e);
    };
    this._onUp = e => {
      const k = normalize(e.key);
      this.down.delete(k);
      this.heldTime.delete(k);
      this.released.add(k);
    };
    this._onBlur = () => {
      this.down.clear();
      this.heldTime.clear();
    };
    target.addEventListener('keydown', this._onDown, { passive: false });
    target.addEventListener('keyup', this._onUp);
    target.addEventListener('blur', this._onBlur);
  }

  isDown(k) { return this.down.has(k); }
  hit(k) { return this.pressed.has(k); }
  anyHit() { return this.pressed.size > 0; }
  anyOf(...keys) { return keys.some(k => this.pressed.has(k)); }
  held(...keys) { return keys.some(k => this.down.has(k)); }

  /** One-shot direction; diagonal input resolves horizontally. */
  dir() {
    let dx = 0, dy = 0;
    if (this.held('arrowleft', 'a')) dx = -1;
    else if (this.held('arrowright', 'd')) dx = 1;
    if (this.held('arrowup', 'w')) dy = -1;
    else if (this.held('arrowdown', 's')) dy = 1;
    if (dx !== 0 && dy !== 0) dy = 0;
    return { dx, dy };
  }

  /** Direction edge or auto-repeat, used by menus and grid movement. */
  repeatDir(dt) {
    const order = [
      ['up', ['arrowup', 'w']],
      ['down', ['arrowdown', 's']],
      ['left', ['arrowleft', 'a']],
      ['right', ['arrowright', 'd']]
    ];
    for (const [name, keys] of order) {
      for (const k of keys) {
        if (!this.down.has(k)) continue;
        const t = (this.heldTime.get(k) || 0) + dt;
        const was = this.heldTime.get(k) || 0;
        this.heldTime.set(k, t);
        const edge = this.pressed.has(k);
        const wantRepeat = was >= this.repeatDelay &&
          Math.floor((t - this.repeatDelay) / this.repeatRate) !== Math.floor((was - this.repeatDelay) / this.repeatRate);
        if (edge || wantRepeat) return name;
      }
    }
    return null;
  }

  updateHeld(dt) {
    for (const k of Array.from(this.heldTime.keys())) this.heldTime.set(k, (this.heldTime.get(k) || 0) + dt);
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}

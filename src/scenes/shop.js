import { W, H, PAL, MAX_PARTY, MAX_STORAGE } from '../core/constants.js';
import { drawBox, hpBar } from '../render/ui.js';
import { ITEMS, isSellable } from '../data/items.js';
import { addItem, removeItem } from '../core/state.js';

const A_KEYS = ['z', 'enter'];
const B_KEYS = ['x', 'escape', 'backspace'];
const isA = inp => inp.anyOf(...A_KEYS);
const isB = inp => inp.anyOf(...B_KEYS);

function countLine(r, text, x, y, opts = {}) {
  r.text(text, x, y, { scale: 1, color: PAL.mid, maxWidth: opts.width || 80 });
  return y + 9;
}

/** Buy/sell counter. The shop is a modal overlay owned by Game.openShop. */
export class ShopScene {
  constructor(spec = {}, onClose = () => {}) {
    this.spec = spec;
    this.name = spec.name || 'SUNDRY GOODS';
    this.onClose = onClose;
    this.entries = (spec.stock || []).map(entry => {
      if (typeof entry === 'string') return { id: entry, remaining: null };
      return { id: entry.id, remaining: entry.qty == null ? null : Math.max(0, Number(entry.qty) || 0) };
    }).filter(e => ITEMS[e.id] && (e.remaining == null || e.remaining > 0));

    this.mode = 'buy';
    this.index = 0;
    this.qty = 1;
    this.pending = null;
    this.phase = 'browse';
    this.message = '';
    this.messageT = 0;
    this.t = 0;
    this.closed = false;
  }

  enter(game) {
    this.game = game;
    game.audio.sfx('select');
  }

  setMessage(text, seconds = 2.2) {
    this.message = String(text || '');
    this.messageT = seconds;
  }

  list(game) {
    if (this.mode === 'buy') {
      return this.entries.map(e => ({
        id: e.id,
        item: ITEMS[e.id],
        remaining: e.remaining
      }));
    }
    const st = game.state;
    return Object.keys(st.bag)
      .filter(id => ITEMS[id] && st.bag[id] > 0 && isSellable(id))
      .map(id => ({ id, item: ITEMS[id], count: st.bag[id] }))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }

  maxQty(game, entry) {
    if (!entry) return 0;
    if (this.mode === 'buy') {
      const price = entry.item.price || 0;
      if (price <= 0) return 1;
      const affordable = Math.floor(game.state.coins / price);
      const stock = entry.remaining == null ? 99 : entry.remaining;
      return Math.max(0, Math.min(99, affordable, stock));
    }
    return Math.min(99, game.state.bag[entry.id] || 0);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.onClose();
  }

  update(game, dt) {
    this.t += dt;
    if (this.messageT > 0) {
      this.messageT = Math.max(0, this.messageT - dt);
      if (this.messageT === 0) this.message = '';
    }
    if (this.phase === 'quantity') {
      this.updateQuantity(game);
      return;
    }
    this.updateBrowse(game);
  }

  updateBrowse(game) {
    const inp = game.input;
    const list = this.list(game);
    if (list.length) this.index = Math.max(0, Math.min(this.index, list.length - 1));
    else this.index = 0;

    if (inp.anyOf('arrowleft', 'a') || inp.anyOf('arrowright', 'd')) {
      this.mode = this.mode === 'buy' ? 'sell' : 'buy';
      this.index = 0;
      this.message = '';
      this.messageT = 0;
      game.audio.sfx('cursor');
      return;
    }
    if (inp.anyOf('arrowdown', 's')) {
      if (list.length) this.index = (this.index + 1) % list.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      if (list.length) this.index = (this.index - 1 + list.length) % list.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.close();
      return;
    }
    if (!isA(inp)) return;

    const entry = list[this.index];
    if (!entry) {
      game.audio.sfx('error');
      this.setMessage(this.mode === 'buy' ? 'There is nothing in stock.' : 'You have nothing to sell.');
      return;
    }
    if (this.mode === 'buy' && (entry.item.price || 0) > game.state.coins) {
      game.audio.sfx('error');
      this.setMessage('You cannot afford that.');
      return;
    }
    if (this.mode === 'sell' && !(game.state.bag[entry.id] > 0)) {
      game.audio.sfx('error');
      this.setMessage('You do not have any of those.');
      return;
    }
    this.pending = entry;
    this.qty = 1;
    this.phase = 'quantity';
    game.audio.sfx('select');
  }

  updateQuantity(game) {
    const inp = game.input;
    const entry = this.pending;
    if (!entry) {
      this.phase = 'browse';
      return;
    }
    const max = this.maxQty(game, entry);
    if (max < 1) {
      this.phase = 'browse';
      game.audio.sfx('error');
      this.setMessage(this.mode === 'buy' ? 'You cannot afford that.' : 'You do not have any of those.');
      return;
    }
    this.qty = Math.max(1, Math.min(max, this.qty));
    if (inp.anyOf('arrowup', 'w') || inp.anyOf('arrowright', 'd')) {
      this.qty = Math.min(max, this.qty + 1);
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowdown', 's') || inp.anyOf('arrowleft', 'a')) {
      this.qty = Math.max(1, this.qty - 1);
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.pending = null;
      this.phase = 'browse';
      return;
    }
    if (!isA(inp)) return;

    if (this.mode === 'buy') {
      const cost = (entry.item.price || 0) * this.qty;
      if (cost > game.state.coins) {
        game.audio.sfx('error');
        this.setMessage('You cannot afford that.');
        this.phase = 'browse';
        return;
      }
      if (entry.remaining != null && entry.remaining < this.qty) {
        game.audio.sfx('error');
        this.setMessage('The shop does not have that many.');
        this.phase = 'browse';
        return;
      }
      game.state.coins -= cost;
      addItem(game.state, entry.id, this.qty);
      if (entry.remaining != null) entry.remaining -= this.qty;
      game.audio.sfx('item');
      this.setMessage(`Bought ${this.qty} x ${entry.item.name} for ${cost} coins.`);
    } else {
      const value = (entry.item.sell || Math.floor((entry.item.price || 0) / 2)) * this.qty;
      if (!removeItem(game.state, entry.id, this.qty)) {
        game.audio.sfx('error');
        this.setMessage('You do not have that many.');
        this.phase = 'browse';
        return;
      }
      game.state.coins = Math.min(999999, game.state.coins + value);
      game.audio.sfx('item');
      this.setMessage(`Sold ${this.qty} x ${entry.item.name} for ${value} coins.`);
    }
    this.pending = null;
    this.phase = 'browse';
    this.index = Math.min(this.index, Math.max(0, this.list(game).length - 1));
  }

  draw(game, r) {
    r.rect(0, 0, W, H, PAL.pale);
    r.dither(0, 0, W, H, PAL.light, 4);

    // Header. Shop name and wallet share one narrow bar.
    drawBox(r, 2, 2, W - 4, 13, { fill: PAL.pale });
    r.text(this.name.toUpperCase(), 6, 5, { color: PAL.dark, maxWidth: 96 });
    r.text(`${game.state.coins}C`, W - 6, 5, { color: PAL.dark, align: 'right' });

    // Buy / Sell tabs.
    const tabs = [['BUY', 'buy'], ['SELL', 'sell']];
    tabs.forEach(([label, mode], i) => {
      const x = 4 + i * 47;
      const on = this.mode === mode;
      r.rect(x, 17, 44, 10, on ? PAL.dark : PAL.pale);
      if (!on) r.stroke(x, 17, 44, 10, PAL.mid, 1);
      r.text(label, x + 22, 19, { color: on ? PAL.pale : PAL.dark, align: 'center' });
    });
    r.text('X: LEAVE', W - 6, 19, { color: PAL.mid, align: 'right' });

    // List window.
    drawBox(r, 2, 30, W - 4, 67, { fill: PAL.pale });
    const list = this.list(game);
    if (!list.length) {
      r.text(this.mode === 'buy' ? 'Nothing in stock.' : 'Nothing to sell.', 8, 36, { color: PAL.mid });
    }
    const visible = 5;
    const start = Math.max(0, Math.min(this.index - 2, list.length - visible));
    list.slice(start, start + visible).forEach((entry, i) => {
      const index = start + i;
      const y = 35 + i * 12;
      const on = index === this.index;
      if (on) {
        r.rect(4, y - 1, W - 8, 10, PAL.light);
        r.text('>', 6, y, { color: PAL.dark });
      }
      r.text(entry.item.name, 13, y, {
        color: PAL.dark,
        maxWidth: this.mode === 'buy' ? 92 : 66
      });
      if (this.mode === 'buy') {
        const suffix = entry.remaining == null ? '' : ` x${entry.remaining}`;
        r.text(`${entry.item.price}C${suffix}`, W - 7, y, {
          color: on ? PAL.dark : PAL.mid,
          align: 'right',
          maxWidth: 48
        });
      } else {
        r.text(`x${entry.count}`, 101, y, { color: PAL.mid });
        r.text(`${entry.item.sell || 0}C`, W - 7, y, {
          color: on ? PAL.dark : PAL.mid,
          align: 'right'
        });
      }
    });
    if (list.length > visible) {
      if (start > 0) r.text('^', W - 10, 32, { color: PAL.mid });
      if (start + visible < list.length) r.text('v', W - 10, 88, { color: PAL.mid });
    }

    // Detail / feedback window.
    drawBox(r, 2, 99, W - 4, 20, { fill: PAL.pale });
    const entry = list[this.index];
    if (this.message) {
      r.text(this.message, 5, 103, { color: PAL.dark, maxWidth: W - 10, lineHeight: 9 });
    } else if (entry) {
      r.text(entry.item.desc, 5, 103, { color: PAL.dark, maxWidth: W - 10, lineHeight: 9 });
    } else {
      r.text('Buy supplies or sell what you no longer need.', 5, 103, {
        color: PAL.mid, maxWidth: W - 10, lineHeight: 9
      });
    }

    if (this.phase === 'quantity') this.drawQuantity(game, r);

    r.text('ARROWS: CHOOSE   A: SELECT', W / 2, 124, { color: PAL.mid, align: 'center' });
    r.text('LEFT/RIGHT: BUY OR SELL', W / 2, 133, { color: PAL.mid, align: 'center' });
  }

  drawQuantity(game, r) {
    const entry = this.pending;
    if (!entry) return;
    const max = this.maxQty(game, entry);
    const price = this.mode === 'buy' ? (entry.item.price || 0) : (entry.item.sell || 0);
    const total = price * this.qty;

    drawBox(r, 24, 36, W - 48, 68, { fill: PAL.pale });
    r.text(entry.item.name, W / 2, 41, { color: PAL.dark, align: 'center', maxWidth: W - 56 });

    r.text('<', 33, 56, { color: PAL.mid });
    r.text('>', W - 41, 56, { color: PAL.mid });
    r.text(`${this.qty}`, W / 2 - 8, 54, { color: PAL.dark, align: 'right' });
    r.text(`/ ${max || 1}`, W / 2 + 8, 56, { color: PAL.mid });
    r.rect(34, 68, W - 68, 1, PAL.mid);
    r.text(this.mode === 'buy' ? 'COST' : 'EARN', 36, 73, { color: PAL.mid });
    r.text(`${total}C`, W - 36, 73, { color: PAL.dark, align: 'right' });
    r.text('A: CONFIRM   B: BACK', W / 2, 90, { color: PAL.mid, align: 'center' });
  }
}

/**
 * Party / storage terminal. Depositing the last party member is blocked, and
 * both sides are capacity checked before any creature moves.
 */
export class StorageScene {
  constructor(onClose = () => {}) {
    this.onClose = onClose;
    this.mode = 'menu';
    this.menuIndex = 0;
    this.index = 0;
    this.message = '';
    this.messageT = 0;
    this.t = 0;
    this.closed = false;
  }

  enter(game) {
    this.game = game;
    game.audio.sfx('select');
  }

  setMessage(text, seconds = 2.2) {
    this.message = String(text || '');
    this.messageT = seconds;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.onClose();
  }

  sourceList(game) {
    if (this.mode === 'withdraw') return game.state.storage;
    if (this.mode === 'deposit') return game.state.party;
    return [];
  }

  update(game, dt) {
    this.t += dt;
    if (this.messageT > 0) {
      this.messageT = Math.max(0, this.messageT - dt);
      if (this.messageT === 0) this.message = '';
    }
    if (this.mode === 'menu') return this.updateMenu(game);
    return this.updateList(game);
  }

  updateMenu(game) {
    const inp = game.input;
    const options = ['WITHDRAW', 'DEPOSIT', 'EXIT'];
    if (inp.anyOf('arrowdown', 's')) {
      this.menuIndex = (this.menuIndex + 1) % options.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      this.menuIndex = (this.menuIndex - 1 + options.length) % options.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.close();
      return;
    }
    if (!isA(inp)) return;
    game.audio.sfx('select');
    if (this.menuIndex === 0) {
      this.mode = 'withdraw';
      this.index = 0;
      this.message = '';
      this.messageT = 0;
    } else if (this.menuIndex === 1) {
      this.mode = 'deposit';
      this.index = 0;
      this.message = '';
      this.messageT = 0;
    } else {
      this.close();
    }
  }

  updateList(game) {
    const inp = game.input;
    const list = this.sourceList(game);
    if (list.length) this.index = Math.max(0, Math.min(this.index, list.length - 1));
    else this.index = 0;

    if (inp.anyOf('arrowdown', 's')) {
      if (list.length) this.index = (this.index + 1) % list.length;
      game.audio.sfx('cursor');
    }
    if (inp.anyOf('arrowup', 'w')) {
      if (list.length) this.index = (this.index - 1 + list.length) % list.length;
      game.audio.sfx('cursor');
    }
    if (isB(inp)) {
      game.audio.sfx('cancel');
      this.mode = 'menu';
      this.message = '';
      this.messageT = 0;
      return;
    }
    if (!isA(inp)) return;

    const c = list[this.index];
    if (!c) {
      game.audio.sfx('error');
      this.setMessage(this.mode === 'withdraw' ? 'Storage is empty.' : 'There is no one to deposit.');
      return;
    }

    if (this.mode === 'withdraw') {
      if (game.state.party.length >= MAX_PARTY) {
        game.audio.sfx('error');
        this.setMessage('Your party is full. Deposit someone first.');
        return;
      }
      game.state.storage.splice(this.index, 1);
      game.state.party.push(c);
      game.audio.sfx('item');
      this.setMessage(`${c.name} joined your party.`);
    } else {
      if (game.state.party.length <= 1) {
        game.audio.sfx('error');
        this.setMessage('You cannot deposit your last Echo.');
        return;
      }
      if (game.state.storage.length >= MAX_STORAGE) {
        game.audio.sfx('error');
        this.setMessage('Storage is full.');
        return;
      }
      game.state.party.splice(this.index, 1);
      game.state.storage.push(c);
      game.audio.sfx('item');
      this.setMessage(`${c.name} was sent to storage.`);
    }
    this.index = Math.min(this.index, Math.max(0, this.sourceList(game).length - 1));
  }

  draw(game, r) {
    r.rect(0, 0, W, H, PAL.pale);
    r.dither(0, 0, W, H, PAL.light, 4);
    drawBox(r, 2, 2, W - 4, 13, { fill: PAL.pale });
    r.text('ECHO STORAGE', 6, 5, { color: PAL.dark });
    r.text(`${game.state.party.length}/6  ${game.state.storage.length}/60`, W - 6, 5, {
      color: PAL.dark, align: 'right'
    });

    if (this.mode === 'menu') this.drawMenu(r);
    else this.drawList(game, r);

    if (this.message) {
      drawBox(r, 4, 116, W - 8, 18, { fill: PAL.pale });
      r.text(this.message, 7, 120, { color: PAL.dark, maxWidth: W - 14, lineHeight: 8 });
    }
  }

  drawMenu(r) {
    drawBox(r, 6, 20, 70, 30, { fill: PAL.pale });
    r.text('PARTY', 11, 24, { color: PAL.mid });
    r.text(`${this.game ? this.game.state.party.length : 0} / 6`, 11, 35, { color: PAL.dark });
    r.text('Echoes with you', 11, 44, { color: PAL.mid, maxWidth: 60 });

    drawBox(r, 84, 20, 70, 30, { fill: PAL.pale });
    r.text('STORAGE', 89, 24, { color: PAL.mid });
    r.text(`${this.game ? this.game.state.storage.length : 0} / 60`, 89, 35, { color: PAL.dark });
    r.text('Held at the clinic', 89, 44, { color: PAL.mid, maxWidth: 60 });

    drawBox(r, 24, 56, 112, 46, { fill: PAL.pale });
    ['WITHDRAW', 'DEPOSIT', 'EXIT'].forEach((label, i) => {
      const y = 61 + i * 13;
      if (i === this.menuIndex) {
        r.rect(27, y - 1, 106, 11, PAL.light);
        r.text('>', 29, y, { color: PAL.dark });
      }
      r.text(label, 39, y, { color: PAL.dark });
    });
    r.text('A: CHOOSE   B: LEAVE', W / 2, 107, { color: PAL.mid, align: 'center' });
  }

  drawList(game, r) {
    const list = this.sourceList(game);
    drawBox(r, 2, 18, W - 4, 72, { fill: PAL.pale });
    r.text(this.mode === 'withdraw' ? 'WITHDRAW' : 'DEPOSIT', 7, 21, { color: PAL.dark });
    r.text(this.mode === 'withdraw' ? 'STORAGE -> PARTY' : 'PARTY -> STORAGE', W - 7, 21, {
      color: PAL.mid, align: 'right'
    });
    r.rect(4, 30, W - 8, 1, PAL.mid);

    if (!list.length) {
      r.text(this.mode === 'withdraw' ? 'No Echoes in storage.' : 'No Echoes in your party.', 8, 36, {
        color: PAL.mid
      });
    }
    const visible = 4;
    const start = Math.max(0, Math.min(this.index - 1, list.length - visible));
    list.slice(start, start + visible).forEach((c, i) => {
      const index = start + i;
      const y = 35 + i * 13;
      const on = index === this.index;
      if (on) {
        r.rect(4, y - 1, W - 8, 11, PAL.light);
        r.text('>', 6, y, { color: PAL.dark });
      }
      r.text(c.name, 14, y, { color: c.hp <= 0 ? PAL.mid : PAL.dark, maxWidth: 62 });
      r.text(`L${c.level}`, 80, y, { color: PAL.dark });
      hpBar(r, 101, y + 2, 34, 3, c.hp / Math.max(1, c.maxHp));
      r.text(`${c.hp}`, W - 7, y, { color: PAL.mid, align: 'right' });
    });

    const c = list[this.index];
    drawBox(r, 2, 92, W - 4, 24, { fill: PAL.pale });
    if (c) {
      r.text(`${c.name}  L${c.level}  ${c.types.join('/')}`, 6, 95, {
        color: PAL.dark, maxWidth: W - 12
      });
      r.text(`HP ${c.hp}/${c.maxHp}   ${c.moves.map(m => m.id).join(' ')}`, 6, 104, {
        color: PAL.mid, maxWidth: W - 12
      });
    } else {
      r.text('Nothing here.', 6, 99, { color: PAL.mid });
    }
    r.text('A: MOVE   B: BACK', 6, 132, { color: PAL.mid });
  }
}

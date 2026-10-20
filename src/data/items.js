export const ITEMS = {
  salve: {
    name: 'Salve', kind: 'heal', hp: 20, price: 200, sell: 100,
    desc: 'Restores 20 HP to one creature.'
  },
  balm: {
    name: 'Field Balm', kind: 'heal', hp: 60, price: 500, sell: 250,
    desc: 'Restores 60 HP to one creature.'
  },
  elixir: {
    name: 'Deep Elixir', kind: 'heal', hp: 999, price: 1200, sell: 600,
    desc: 'Fully restores one creature’s HP.'
  },
  feather: {
    name: 'Clean Feather', kind: 'revive', hpRatio: 0.5, price: 900, sell: 450,
    desc: 'Revives a fainted creature with half HP.'
  },
  antidote: {
    name: 'Antidote', kind: 'cure', status: ['PSN'], price: 150, sell: 75,
    desc: 'Cures poison.'
  },
  burnsalve: {
    name: 'Cooling Salve', kind: 'cure', status: ['BRN'], price: 200, sell: 100,
    desc: 'Cures a burn.'
  },
  wakeleaf: {
    name: 'Wake Leaf', kind: 'cure', status: ['SLP'], price: 220, sell: 110,
    desc: 'Wakes a sleeping creature.'
  },
  echoball: {
    name: 'Echo Ball', kind: 'ball', ball: 1, price: 200, sell: 100,
    desc: 'A basic capture device.'
  },
  greatball: {
    name: 'Great Ball', kind: 'ball', ball: 1.5, price: 600, sell: 300,
    desc: 'A better capture device.'
  },
  ultraball: {
    name: 'Ultra Ball', kind: 'ball', ball: 2, price: 1200, sell: 600,
    desc: 'A high-grade capture device.'
  },
  resonance_shard: {
    name: 'Resonance Shard', kind: 'key', price: 0, sell: 0,
    desc: 'A warm shard of cracked altar stone. It hums a single low note.'
  },
  field_notes: {
    name: 'Field Notes', kind: 'key', price: 0, sell: 0,
    desc: 'Vale’s notes on the Resonance. The margins are full of worried sketches.'
  }
};

export const ITEM_IDS = Object.keys(ITEMS);

export function getItem(id) {
  return ITEMS[id] || null;
}

export function itemName(id) {
  return ITEMS[id] ? ITEMS[id].name : id;
}

export function itemPrice(id, mode = 'buy') {
  const item = ITEMS[id];
  if (!item) return 0;
  return mode === 'sell' ? (item.sell || 0) : (item.price || 0);
}

export function isSellable(id) {
  const item = ITEMS[id];
  return !!item && item.kind !== 'key' && (item.sell || 0) > 0;
}

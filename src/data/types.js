// Gen-I-style 15-type chart. Types are genre conventions; all creatures and
// move names in this game are original.
export const TYPES = {
  NORMAL:   { name: 'Normal',   special: false },
  FIGHTING: { name: 'Fighting', special: false },
  FLYING:   { name: 'Flying',   special: false },
  POISON:   { name: 'Poison',   special: false },
  GROUND:   { name: 'Ground',   special: false },
  ROCK:     { name: 'Rock',     special: false },
  BUG:      { name: 'Bug',      special: false },
  GHOST:    { name: 'Ghost',    special: false },
  FIRE:     { name: 'Fire',     special: true },
  WATER:    { name: 'Water',    special: true },
  GRASS:    { name: 'Grass',    special: true },
  ELECTRIC: { name: 'Electric', special: true },
  PSYCHIC:  { name: 'Psychic',  special: true },
  ICE:      { name: 'Ice',      special: true },
  DRAGON:   { name: 'Dragon',   special: true }
};

export const TYPE_LIST = Object.keys(TYPES);

// attacker -> defender -> multiplier. Unlisted pairs are 1x.
const CHART = {
  NORMAL:   { ROCK: 0.5, GHOST: 0 },
  FIGHTING: { NORMAL: 2, FLYING: 0.5, POISON: 0.5, ROCK: 2, BUG: 0.5, PSYCHIC: 0.5, GHOST: 0, ICE: 2 },
  FLYING:   { FIGHTING: 2, ROCK: 0.5, BUG: 2, GRASS: 2, ELECTRIC: 0.5 },
  POISON:   { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, BUG: 2, GHOST: 0.5 },
  GROUND:   { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, ROCK: 2, BUG: 0.5 },
  ROCK:     { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2 },
  BUG:      { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 2, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5 },
  GHOST:    { NORMAL: 0, PSYCHIC: 0, GHOST: 2 },
  FIRE:     { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, ROCK: 0.5, BUG: 2, DRAGON: 0.5 },
  WATER:    { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5 },
  GRASS:    { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, ROCK: 2, BUG: 0.5, DRAGON: 0.5 },
  ELECTRIC: { WATER: 2, GRASS: 0.5, ELECTRIC: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5 },
  PSYCHIC:  { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5 },
  ICE:      { WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2 },
  DRAGON:   { DRAGON: 2 }
};

export function typeMultiplier(attackType, defenderTypes) {
  const row = CHART[attackType] || {};
  let mult = 1;
  for (const t of defenderTypes || []) {
    if (row[t] != null) mult *= row[t];
  }
  return mult;
}

export function isSpecialType(type) {
  return !!(TYPES[type] && TYPES[type].special);
}

export function effectivenessText(mult) {
  if (mult === 0) return "It doesn't affect the target...";
  if (mult >= 2) return "It's super effective!";
  if (mult > 1) return "It's effective!";
  if (mult < 1) return "It's not very effective...";
  return '';
}

export function typeName(type) {
  return TYPES[type] ? TYPES[type].name : type;
}

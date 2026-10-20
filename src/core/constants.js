// Game Boy-inspired presentation constants.
export const W = 160;
export const H = 144;
export const TILE = 16;
export const SAVE_KEY = 'asteria-gb-v1';
export const SAVE_VERSION = 1;
export const STEP_MS = 170;
export const TEXT_DELAY = 22;
export const MAX_PARTY = 6;
export const MAX_STORAGE = 60;

// The four DMG-green shades. Every drawn pixel must be one of these.
export const PAL = {
  dark: '#0f380f',
  mid: '#306230',
  light: '#8bac0f',
  pale: '#9bbc0f'
};

export const SHADES = [PAL.dark, PAL.mid, PAL.light, PAL.pale];

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const KEYS = {
  UP: ['arrowup', 'w'],
  DOWN: ['arrowdown', 's'],
  LEFT: ['arrowleft', 'a'],
  RIGHT: ['arrowright', 'd'],
  A: ['z', 'enter'],
  B: ['x', 'escape', 'backspace'],
  START: ['c', 'shift', 'm']
};

export const DEFAULT_SETTINGS = {
  music: true,
  sfx: true,
  textSpeed: 1, // 0 slow, 1 normal, 2 fast
  shake: true,
  mute: false
};

// Original move list. Damage category is determined by type (Gen-I rule):
// physical types use Attack/Defense, special types use Special for both sides.
export const MOVES = {
  // Normal
  tackle:       { name: 'Tackle', type: 'NORMAL', power: 35, acc: 95, pp: 35, desc: 'A full-body charge.' },
  scratch:      { name: 'Scratch', type: 'NORMAL', power: 40, acc: 100, pp: 35, desc: 'Hard claw swipes.' },
  quickjab:     { name: 'Quick Jab', type: 'NORMAL', power: 40, acc: 100, pp: 30, priority: 1, desc: 'A jab that always strikes first.' },
  headbutt:     { name: 'Headbutt', type: 'NORMAL', power: 70, acc: 100, pp: 15, effect: { flinch: 30 }, desc: 'A risky headfirst ram.' },
  bite:         { name: 'Bite', type: 'NORMAL', power: 60, acc: 100, pp: 25, effect: { flinch: 30 }, desc: 'A vicious chomp.' },
  bodyslam:     { name: 'Body Slam', type: 'NORMAL', power: 85, acc: 100, pp: 15, effect: { status: 'PAR', chance: 30 }, desc: 'A crushing slam.' },
  swift:        { name: 'Swift', type: 'NORMAL', power: 60, acc: 100, pp: 20, desc: 'Star-shaped rays that never miss.' },
  focus:        { name: 'Focus', type: 'NORMAL', power: 0, acc: 100, pp: 20, effect: { stat: { target: 'self', stat: 'atk', stages: 1 } }, desc: 'Raises Attack.' },
  harden:       { name: 'Harden', type: 'NORMAL', power: 0, acc: 100, pp: 25, effect: { stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Raises Defense.' },
  veil:         { name: 'Veil', type: 'NORMAL', power: 0, acc: 100, pp: 20, effect: { stat: { target: 'self', stat: 'spd', stages: 1 } }, desc: 'Raises Speed.' },
  meditate:     { name: 'Meditate', type: 'NORMAL', power: 0, acc: 100, pp: 20, effect: { stat: { target: 'self', stat: 'spc', stages: 1 } }, desc: 'Raises Special.' },
  howl:         { name: 'Howl', type: 'NORMAL', power: 0, acc: 100, pp: 20, effect: { stat: { target: 'self', stat: 'atk', stages: 1 } }, desc: 'Raises Attack.' },
  growl:        { name: 'Growl', type: 'NORMAL', power: 0, acc: 100, pp: 25, effect: { stat: { target: 'foe', stat: 'atk', stages: -1 } }, desc: "Lowers the foe's Attack." },
  leer:         { name: 'Leer', type: 'NORMAL', power: 0, acc: 100, pp: 25, effect: { stat: { target: 'foe', stat: 'def', stages: -1 } }, desc: "Lowers the foe's Defense." },
  recover:      { name: 'Recover', type: 'NORMAL', power: 0, acc: 100, pp: 10, effect: { heal: 0.5 }, desc: 'Restores half of max HP.' },
  endure:       { name: 'Endure', type: 'NORMAL', power: 0, acc: 100, pp: 10, effect: { endure: true }, desc: 'Survives one fatal hit with 1 HP.' },
  flail:        { name: 'Flail', type: 'NORMAL', power: 50, acc: 100, pp: 15, desc: 'A desperate flail.' },

  // Fighting
  karatechop:   { name: 'Karate Chop', type: 'FIGHTING', power: 50, acc: 100, pp: 25, highCrit: true, desc: 'A chop with a high critical-hit rate.' },
  lowkick:      { name: 'Low Kick', type: 'FIGHTING', power: 55, acc: 90, pp: 20, effect: { flinch: 20 }, desc: 'A sweeping kick.' },
  seismic_toss: { name: 'Seismic Toss', type: 'FIGHTING', power: 1, acc: 100, pp: 15, fixedDamage: 'level', desc: "Deals damage equal to the user's level." },
  bulkup:       { name: 'Bulk Up', type: 'FIGHTING', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'self', stat: 'atk', stages: 1 }, extraStat: { stat: 'def', stages: 1 } }, desc: 'Raises Attack and Defense.' },

  // Flying
  peck:         { name: 'Peck', type: 'FLYING', power: 35, acc: 100, pp: 35, desc: 'A sharp beak strike.' },
  gust:         { name: 'Gust', type: 'FLYING', power: 45, acc: 100, pp: 25, desc: 'A sharp blast of wind.' },
  wingbeat:     { name: 'Wing Beat', type: 'FLYING', power: 60, acc: 95, pp: 20, effect: { flinch: 20 }, desc: 'A buffeting wing strike.' },
  gustpush:     { name: 'Gust Push', type: 'FLYING', power: 50, acc: 100, pp: 20, effect: { stat: { target: 'foe', stat: 'spd', stages: -1 }, chance: 40 }, desc: 'Pushes the foe back.' },
  cyclone:      { name: 'Cyclone', type: 'FLYING', power: 75, acc: 90, pp: 12, desc: 'A spinning vortex.' },
  skydive:      { name: 'Sky Dive', type: 'FLYING', power: 100, acc: 90, pp: 6, desc: 'A dive from great height.' },
  windveil:     { name: 'Wind Veil', type: 'FLYING', power: 0, acc: 100, pp: 15, effect: { stat: { target: 'self', stat: 'spd', stages: 1 } }, desc: 'Raises Speed.' },

  // Poison
  poisonsting:  { name: 'Poison Sting', type: 'POISON', power: 30, acc: 100, pp: 35, effect: { status: 'PSN', chance: 30 }, desc: 'A toxic little barb.' },
  acid:         { name: 'Acid', type: 'POISON', power: 40, acc: 100, pp: 30, effect: { stat: { target: 'foe', stat: 'def', stages: -1 }, chance: 20 }, desc: 'Corrosive droplets.' },
  sludge:       { name: 'Sludge', type: 'POISON', power: 65, acc: 100, pp: 20, effect: { status: 'PSN', chance: 30 }, desc: 'Filthy, poisonous sludge.' },
  toxiccloud:   { name: 'Toxic Cloud', type: 'POISON', power: 0, acc: 85, pp: 10, effect: { status: 'PSN', chance: 100 }, desc: 'A cloud that poisons.' },
  screech:      { name: 'Screech', type: 'POISON', power: 0, acc: 85, pp: 15, effect: { stat: { target: 'foe', stat: 'def', stages: -2 } }, desc: "Sharply lowers the foe's Defense." },

  // Ground
  mudslap:      { name: 'Mud Slap', type: 'GROUND', power: 35, acc: 100, pp: 25, effect: { stat: { target: 'foe', stat: 'acc', stages: -1 }, chance: 40 }, desc: 'Hurls mud at the foe.' },
  quakehit:     { name: 'Quake Hit', type: 'GROUND', power: 70, acc: 100, pp: 15, effect: { flinch: 20 }, desc: 'A ground-shaking impact.' },
  sandattack:   { name: 'Sand Attack', type: 'GROUND', power: 0, acc: 100, pp: 20, effect: { stat: { target: 'foe', stat: 'acc', stages: -1 } }, desc: "Lowers the foe's accuracy." },
  earthmaw:     { name: 'Earth Maw', type: 'GROUND', power: 90, acc: 90, pp: 10, desc: 'The ground opens beneath the foe.' },

  // Rock
  rockthrow:    { name: 'Rock Throw', type: 'ROCK', power: 50, acc: 90, pp: 20, desc: 'Hurls a stone.' },
  shellbash:    { name: 'Shell Bash', type: 'ROCK', power: 65, acc: 90, pp: 20, desc: 'Slams its shell down.' },
  boulderfall:  { name: 'Boulder Fall', type: 'ROCK', power: 90, acc: 85, pp: 10, desc: 'A massive stone crashes down.' },
  hardenrock:   { name: 'Harden Rock', type: 'ROCK', power: 0, acc: 100, pp: 15, effect: { stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Raises Defense.' },
  sandstorm:    { name: 'Sandstorm', type: 'ROCK', power: 0, acc: 90, pp: 15, effect: { stat: { target: 'foe', stat: 'acc', stages: -1 } }, desc: 'Buries the target in grit.' },
  rockwall:     { name: 'Rock Wall', type: 'ROCK', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'self', stat: 'def', stages: 2 } }, desc: 'Sharply raises Defense.' },

  // Bug
  bugbite:      { name: 'Bug Bite', type: 'BUG', power: 45, acc: 100, pp: 25, desc: 'A chomping insect bite.' },
  pinmissile:   { name: 'Pin Missile', type: 'BUG', power: 14, acc: 95, pp: 20, multi: [2, 5], desc: 'Fires two to five pins.' },
  stringshot:   { name: 'String Shot', type: 'BUG', power: 0, acc: 95, pp: 30, effect: { stat: { target: 'foe', stat: 'spd', stages: -1 } }, desc: "Lowers the foe's Speed." },
  leechlife:    { name: 'Leech Life', type: 'BUG', power: 40, acc: 100, pp: 15, effect: { drain: 0.5 }, desc: 'Drains the foe’s vitality.' },
  sporecloud:   { name: 'Spore Cloud', type: 'BUG', power: 0, acc: 75, pp: 10, effect: { status: 'SLP', chance: 100 }, desc: 'Sleepy spores drift over the foe.' },

  // Ghost
  shadowbite:   { name: 'Shadow Bite', type: 'GHOST', power: 60, acc: 95, pp: 20, desc: 'Bites out of the dark.' },
  duskclaw:     { name: 'Dusk Claw', type: 'GHOST', power: 80, acc: 90, pp: 12, effect: { flinch: 20 }, desc: 'A raking shadow claw.' },
  nightmare:    { name: 'Nightmare', type: 'GHOST', power: 100, acc: 80, pp: 5, desc: 'A vision of dread.' },
  darkpulse:    { name: 'Dark Pulse', type: 'GHOST', power: 70, acc: 100, pp: 15, desc: 'A pulse of cold dark.' },
  hexsong:      { name: 'Hex Song', type: 'GHOST', power: 0, acc: 85, pp: 10, effect: { status: 'SLP', chance: 100 }, desc: 'A lullaby of dark magic.' },
  gloomveil:    { name: 'Gloom Veil', type: 'GHOST', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'foe', stat: 'spc', stages: -1 } }, desc: "Dims the foe's spirit." },
  confuseray:   { name: 'Confuse Ray', type: 'GHOST', power: 0, acc: 100, pp: 10, effect: { confuse: 100 }, desc: 'A sinister ray that confuses.' },

  // Fire
  ember:        { name: 'Ember', type: 'FIRE', power: 40, acc: 100, pp: 25, effect: { status: 'BRN', chance: 10 }, desc: 'A flickering spark.' },
  flameburst:   { name: 'Flame Burst', type: 'FIRE', power: 60, acc: 95, pp: 20, desc: 'A bursting sheet of flame.' },
  solarsurge:   { name: 'Solar Surge', type: 'FIRE', power: 95, acc: 90, pp: 8, desc: 'A pillar of solar fire.' },
  cinderfang:   { name: 'Cinder Fang', type: 'FIRE', power: 65, acc: 95, pp: 15, effect: { status: 'BRN', chance: 20 }, desc: 'Fangs wreathed in cinders.' },
  magmaclash:   { name: 'Magma Clash', type: 'FIRE', power: 85, acc: 90, pp: 10, desc: 'A crushing lava slam.' },
  kindlespark:  { name: 'Kindle Spark', type: 'FIRE', power: 0, acc: 90, pp: 20, effect: { status: 'BRN', chance: 100 }, desc: 'Sets the target alight.' },
  ashveil:      { name: 'Ash Veil', type: 'FIRE', power: 0, acc: 95, pp: 15, effect: { stat: { target: 'foe', stat: 'acc', stages: -1 } }, desc: "Lowers the foe's accuracy." },

  // Water
  ripple:       { name: 'Ripple', type: 'WATER', power: 40, acc: 100, pp: 30, desc: 'A forceful surge of water.' },
  gloworb:      { name: 'Glow Orb', type: 'WATER', power: 50, acc: 100, pp: 20, desc: 'An orb of soft light.' },
  bubbleburst:  { name: 'Bubble Burst', type: 'WATER', power: 55, acc: 100, pp: 20, effect: { stat: { target: 'foe', stat: 'spd', stages: -1 }, chance: 30 }, desc: 'Bursting bubbles slow the foe.' },
  moontide:     { name: 'Moon Tide', type: 'WATER', power: 70, acc: 95, pp: 12, desc: 'The sea rises at moonlight.' },
  abysswave:    { name: 'Abyssal Wave', type: 'WATER', power: 100, acc: 85, pp: 6, desc: 'A crushing depth of water.' },
  mistveil:     { name: 'Mist Veil', type: 'WATER', power: 0, acc: 95, pp: 20, effect: { stat: { target: 'foe', stat: 'acc', stages: -1 } }, desc: 'Mists cloud the target’s sight.' },
  tidalguard:   { name: 'Tidal Guard', type: 'WATER', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Raises Defense.' },

  // Grass
  leafveil:     { name: 'Leaf Veil', type: 'GRASS', power: 0, acc: 100, pp: 15, effect: { stat: { target: 'self', stat: 'def', stages: 1 } }, desc: 'Leaves cloak you in defense.' },
  vinewhip:     { name: 'Vine Whip', type: 'GRASS', power: 45, acc: 100, pp: 25, desc: 'Striking vines lash out.' },
  razorleaf:    { name: 'Razor Leaf', type: 'GRASS', power: 55, acc: 95, pp: 25, highCrit: true, desc: 'Sharp leaves with a high critical rate.' },
  naturesurge:  { name: 'Nature Surge', type: 'GRASS', power: 85, acc: 90, pp: 10, desc: 'A surging wave of green.' },
  rootdrain:    { name: 'Root Drain', type: 'GRASS', power: 55, acc: 95, pp: 15, effect: { drain: 0.5 }, desc: "Drains the foe's vigor." },
  regenerate:   { name: 'Regenerate', type: 'GRASS', power: 0, acc: 100, pp: 8, effect: { heal: 0.5 }, desc: 'Restores half its max HP.' },
  briarthorn:   { name: 'Briar Thorn', type: 'GRASS', power: 60, acc: 95, pp: 20, effect: { status: 'PSN', chance: 20 }, desc: 'A poisoned thorn strike.' },
  photosynthesis:{ name: 'Photosynthesis', type: 'GRASS', power: 0, acc: 100, pp: 8, effect: { heal: 0.5 }, desc: 'Sunlight restores its HP.' },
  petalstorm:   { name: 'Petal Storm', type: 'GRASS', power: 90, acc: 90, pp: 10, desc: 'A storm of razor petals.' },

  // Electric
  spark:        { name: 'Spark', type: 'ELECTRIC', power: 45, acc: 100, pp: 25, effect: { status: 'PAR', chance: 15 }, desc: 'A crackling spark.' },
  arcbolt:      { name: 'Arc Bolt', type: 'ELECTRIC', power: 70, acc: 95, pp: 15, effect: { status: 'PAR', chance: 15 }, desc: 'A jagged bolt of voltage.' },
  thunderstorm: { name: 'Thunderstorm', type: 'ELECTRIC', power: 100, acc: 80, pp: 6, desc: 'A storm erupts at your side.' },
  staticfield:  { name: 'Static Field', type: 'ELECTRIC', power: 0, acc: 100, pp: 15, effect: { status: 'PAR', chance: 100 }, desc: 'Paralyses the target.' },
  voltabsorb:   { name: 'Volt Absorb', type: 'ELECTRIC', power: 40, acc: 100, pp: 20, effect: { drain: 0.5 }, desc: "Absorbs the foe's charge." },

  // Psychic
  confusion:    { name: 'Confusion', type: 'PSYCHIC', power: 50, acc: 100, pp: 25, effect: { confuse: 10 }, desc: 'A weak telekinetic attack.' },
  psybeam:      { name: 'Psybeam', type: 'PSYCHIC', power: 65, acc: 100, pp: 20, effect: { confuse: 10 }, desc: 'A peculiar beam of light.' },
  psychic:      { name: 'Psychic', type: 'PSYCHIC', power: 90, acc: 90, pp: 10, effect: { stat: { target: 'foe', stat: 'spc', stages: -1 }, chance: 30 }, desc: 'A strong telekinetic force.' },
  hypnosis:     { name: 'Hypnosis', type: 'PSYCHIC', power: 0, acc: 60, pp: 20, effect: { status: 'SLP', chance: 100 }, desc: 'A sleep-inducing suggestion.' },
  barrier:      { name: 'Barrier', type: 'PSYCHIC', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'self', stat: 'def', stages: 2 } }, desc: 'Sharply raises Defense.' },

  // Ice
  iceshard:     { name: 'Ice Shard', type: 'ICE', power: 40, acc: 100, pp: 30, priority: 1, desc: 'A fast shard of ice.' },
  frostbreath:  { name: 'Frost Breath', type: 'ICE', power: 60, acc: 90, pp: 20, effect: { status: 'FRZ', chance: 10 }, desc: 'A freezing breath.' },
  blizzard:     { name: 'Blizzard', type: 'ICE', power: 95, acc: 80, pp: 8, effect: { status: 'FRZ', chance: 10 }, desc: 'A howling ice storm.' },
  auroraveil:   { name: 'Aurora Veil', type: 'ICE', power: 0, acc: 100, pp: 10, effect: { stat: { target: 'self', stat: 'spc', stages: 1 } }, desc: 'Raises Special.' },

  // Dragon
  dragonrage:   { name: 'Dragon Rage', type: 'DRAGON', power: 1, acc: 100, pp: 10, fixedDamage: 40, desc: 'Always deals 40 damage.' },
  dragonbreath: { name: 'Dragon Breath', type: 'DRAGON', power: 60, acc: 100, pp: 20, effect: { status: 'PAR', chance: 20 }, desc: 'A paralysing breath.' },
  dragonclaw:   { name: 'Dragon Claw', type: 'DRAGON', power: 80, acc: 95, pp: 15, desc: 'A rending draconic claw.' },
  dragonpulse:  { name: 'Dragon Pulse', type: 'DRAGON', power: 85, acc: 90, pp: 10, desc: 'A shockwave of draconic energy.' }
};

export function getMove(id) {
  if (!id) return null;
  const m = MOVES[id];
  return m ? { ...m, id } : null;
}

export const MOVE_LIST = Object.keys(MOVES);

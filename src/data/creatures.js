// 41 original creatures. Base stats use the Gen-I five-stat model:
// HP, Attack, Defense, Speed, Special. All names, art and text are original.
export const CREATURES = {
  // --- Starter line: Pyrelisk ---
  pyrelisk: {
    name: 'Pyrelisk', types: ['FIRE'], base: { hp: 39, atk: 45, def: 33, spd: 48, spc: 50 },
    catchRate: 45, baseExp: 62, growth: 'medium', dexNo: 1,
    learnset: [[1, 'scratch'], [1, 'ember'], [5, 'quickjab'], [9, 'focus'], [13, 'cinderfang'], [17, 'flameburst'], [21, 'ashveil']],
    evolveTo: 'pyreblaze', evolveLevel: 14,
    dex: 'A tiny ember-scaled reptile. Its temper is short and its curiosity is endless.',
    art: { arch: 'reptile', pal: ['#e8703c', '#a03818', '#ffc070', '#ffe8a0'], features: ['flame', 'tail', 'spikes'] }
  },
  pyreblaze: {
    name: 'Pyreblaze', types: ['FIRE'], base: { hp: 58, atk: 62, def: 50, spd: 60, spc: 65 },
    catchRate: 45, baseExp: 142, growth: 'medium', dexNo: 2,
    learnset: [[1, 'scratch'], [1, 'ember'], [1, 'quickjab'], [14, 'cinderfang'], [18, 'flameburst'], [22, 'ashveil'], [27, 'magmaclash']],
    evolveTo: 'infernis', evolveLevel: 30,
    dex: 'A fierce flame-lizard that fights in short explosive bursts. Its crest glows when it is winning.',
    art: { arch: 'reptile', pal: ['#f06030', '#a83010', '#ffb050', '#fff0b0'], features: ['flame', 'tail', 'spikes', 'horns'] }
  },
  infernis: {
    name: 'Infernis', types: ['FIRE', 'DRAGON'], base: { hp: 78, atk: 84, def: 70, spd: 80, spc: 90 },
    catchRate: 45, baseExp: 209, growth: 'medium', dexNo: 3,
    learnset: [[1, 'ember'], [1, 'cinderfang'], [1, 'flameburst'], [30, 'magmaclash'], [34, 'dragonbreath'], [38, 'solarsurge'], [44, 'dragonpulse']],
    dex: 'A volcanic drake that walks on cooling stone. The first Infernis is said to have hatched from a lava flow.',
    art: { arch: 'dragon', pal: ['#e04020', '#8c1a0a', '#ff9040', '#ffe0a0'], features: ['flame', 'tail', 'spikes', 'horns', 'wings'] }
  },

  // --- Starter line: Mossprig ---
  mossprig: {
    name: 'Mossprig', types: ['GRASS'], base: { hp: 50, atk: 35, def: 48, spd: 30, spc: 55 },
    catchRate: 45, baseExp: 64, growth: 'medium', dexNo: 4,
    learnset: [[1, 'tackle'], [1, 'leafveil'], [5, 'vinewhip'], [9, 'regenerate'], [13, 'razorleaf'], [17, 'briarthorn'], [21, 'naturesurge']],
    evolveTo: 'mosswhisk', evolveLevel: 14,
    dex: 'A woodland sprite with fern fronds for ears. It naps in sunlight and dreams of rain.',
    art: { arch: 'fox', pal: ['#7cc06a', '#3c7038', '#c8e8a0', '#f0e0a0'], features: ['ears', 'leaf', 'tail', 'spots'] }
  },
  mosswhisk: {
    name: 'Mosswhisk', types: ['GRASS'], base: { hp: 70, atk: 48, def: 64, spd: 40, spc: 70 },
    catchRate: 45, baseExp: 142, growth: 'medium', dexNo: 5,
    learnset: [[1, 'tackle'], [1, 'leafveil'], [1, 'vinewhip'], [14, 'razorleaf'], [18, 'briarthorn'], [22, 'regenerate'], [27, 'naturesurge']],
    evolveTo: 'mosswarden', evolveLevel: 30,
    dex: 'A mossy fox whose coat thickens each rainy season. It heals quietly while its keeper sleeps.',
    art: { arch: 'fox', pal: ['#68b45c', '#2e6230', '#a8dc8c', '#f0e0a0'], features: ['ears', 'leaf', 'tail', 'spots', 'flower'] }
  },
  mosswarden: {
    name: 'Mosswarden', types: ['GRASS', 'FIGHTING'], base: { hp: 90, atk: 62, def: 82, spd: 50, spc: 90 },
    catchRate: 45, baseExp: 208, growth: 'medium', dexNo: 6,
    learnset: [[1, 'leafveil'], [1, 'vinewhip'], [1, 'regenerate'], [30, 'briarthorn'], [34, 'lowkick'], [38, 'petalstorm'], [44, 'naturesurge']],
    dex: 'A towering forest sentinel, its bark armour older than the road to Lumen Bay.',
    art: { arch: 'canine', pal: ['#589a4c', '#25522a', '#8ec878', '#f0e0a0'], features: ['ears', 'leaf', 'tail', 'horns', 'flower', 'spikes'] }
  },

  // --- Starter line: Tidelume ---
  tidelume: {
    name: 'Tidelume', types: ['WATER'], base: { hp: 44, atk: 32, def: 35, spd: 52, spc: 52 },
    catchRate: 45, baseExp: 63, growth: 'medium', dexNo: 7,
    learnset: [[1, 'ripple'], [1, 'gloworb'], [5, 'bubbleburst'], [9, 'mistveil'], [13, 'moontide'], [17, 'tidalguard'], [21, 'abysswave']],
    evolveTo: 'tidelure', evolveLevel: 14,
    dex: 'A small bioluminescent amphibian. Its fins glow brightest when it is telling the truth.',
    art: { arch: 'amphibian', pal: ['#4cc0d8', '#206070', '#b0f0ff', '#fff0a0'], features: ['glow', 'fins', 'spots'] }
  },
  tidelure: {
    name: 'Tidelure', types: ['WATER'], base: { hp: 65, atk: 45, def: 48, spd: 68, spc: 68 },
    catchRate: 45, baseExp: 142, growth: 'medium', dexNo: 8,
    learnset: [[1, 'ripple'], [1, 'gloworb'], [1, 'bubbleburst'], [14, 'moontide'], [18, 'mistveil'], [22, 'tidalguard'], [27, 'abysswave']],
    evolveTo: 'tidemaster', evolveLevel: 30,
    dex: 'A graceful tide-dancer that arranges moonlight across the water. Fishers follow its glow home.',
    art: { arch: 'fish', pal: ['#38b0d8', '#144a68', '#90e8ff', '#fff0a0'], features: ['glow', 'fins', 'spots', 'crystal'] }
  },
  tidemaster: {
    name: 'Tidemaster', types: ['WATER', 'ICE'], base: { hp: 85, atk: 58, def: 64, spd: 82, spc: 85 },
    catchRate: 45, baseExp: 207, growth: 'medium', dexNo: 9,
    learnset: [[1, 'gloworb'], [1, 'bubbleburst'], [1, 'moontide'], [30, 'frostbreath'], [34, 'tidalguard'], [38, 'abysswave'], [44, 'blizzard']],
    dex: 'A master of the tides, its patterned flanks map every current in the Asteria archipelago.',
    art: { arch: 'fish', pal: ['#2090c8', '#0c3048', '#70d8f8', '#fff8d0'], features: ['glow', 'fins', 'crystal', 'horns', 'spikes'] }
  },

  // --- Early wilds ---
  emberfly: {
    name: 'Emberfly', types: ['FIRE', 'BUG'], base: { hp: 35, atk: 30, def: 25, spd: 50, spc: 45 },
    catchRate: 190, baseExp: 50, growth: 'fast', dexNo: 10,
    learnset: [[1, 'scratch'], [1, 'ember'], [7, 'bugbite'], [11, 'quickjab'], [15, 'flameburst'], [19, 'ashveil']],
    evolveTo: 'cinderwing', evolveLevel: 12,
    dex: 'A darting insect that stores static heat in its wing tips. It is drawn to open flame.',
    art: { arch: 'insect', pal: ['#f08040', '#a03c10', '#ffc880', '#fff0c0'], features: ['flame', 'wings', 'antennae'] }
  },
  cinderwing: {
    name: 'Cinderwing', types: ['FIRE', 'BUG'], base: { hp: 55, atk: 45, def: 38, spd: 70, spc: 65 },
    catchRate: 100, baseExp: 118, growth: 'fast', dexNo: 11,
    learnset: [[1, 'ember'], [1, 'bugbite'], [1, 'quickjab'], [12, 'pinmissile'], [17, 'flameburst'], [22, 'cinderfang'], [28, 'magmaclash']],
    dex: 'A moth of living cinder. It circles battlefields long after the flames die down.',
    art: { arch: 'moth', pal: ['#e06030', '#8c2810', '#ff9c50', '#ffd070'], features: ['flame', 'wings', 'antennae', 'spots'] }
  },
  leafkin: {
    name: 'Leafkin', types: ['GRASS'], base: { hp: 40, atk: 35, def: 32, spd: 30, spc: 38 },
    catchRate: 200, baseExp: 46, growth: 'fast', dexNo: 12,
    learnset: [[1, 'tackle'], [1, 'leafveil'], [6, 'vinewhip'], [10, 'sporecloud'], [14, 'razorleaf'], [18, 'rootdrain']],
    dex: 'A small creature made of a single curled leaf. It dislikes being trodden on.',
    art: { arch: 'blob', pal: ['#7cc85c', '#3a7030', '#c0ec9c', '#f8f0a0'], features: ['leaf', 'spots'] }
  },
  thornlet: {
    name: 'Thornlet', types: ['GRASS', 'POISON'], base: { hp: 38, atk: 45, def: 34, spd: 40, spc: 35 },
    catchRate: 180, baseExp: 49, growth: 'fast', dexNo: 13,
    learnset: [[1, 'scratch'], [1, 'poisonsting'], [6, 'briarthorn'], [10, 'bugbite'], [14, 'sporecloud'], [18, 'acid']],
    dex: 'A bramble-bug with spines along its back. It hides among rose bushes until hungry.',
    art: { arch: 'insect', pal: ['#6aa850', '#2e5a28', '#9cd47c', '#e0d060'], features: ['antennae', 'spikes', 'leaf'] }
  },
  bloomwing: {
    name: 'Bloomwing', types: ['GRASS', 'FLYING'], base: { hp: 50, atk: 40, def: 35, spd: 65, spc: 55 },
    catchRate: 120, baseExp: 104, growth: 'medium', dexNo: 14,
    learnset: [[1, 'gust'], [1, 'leafveil'], [1, 'sporecloud'], [12, 'razorleaf'], [16, 'wingbeat'], [20, 'naturesurge'], [24, 'cyclone']],
    dex: 'A hummingbird whose feathers are living petals. It pollinates the high meadows.',
    art: { arch: 'bird', pal: ['#e888b8', '#8c3a60', '#f8d0e0', '#fff0a0'], features: ['wings', 'flower', 'leaf'] }
  },
  brambleback: {
    name: 'Brambleback', types: ['GRASS', 'ROCK'], base: { hp: 70, atk: 55, def: 65, spd: 20, spc: 50 },
    catchRate: 100, baseExp: 126, growth: 'medium', dexNo: 15,
    learnset: [[1, 'tackle'], [1, 'leafveil'], [1, 'rockthrow'], [12, 'vinewhip'], [16, 'hardenrock'], [20, 'razorleaf'], [24, 'briarthorn']],
    dex: 'A slow hedge-creature bound together by thorny vines. It defends the forest floor.',
    art: { arch: 'golem', pal: ['#5a8a48', '#284a22', '#82b06c', '#d8d060'], features: ['leaf', 'spikes', 'flower'] }
  },

  // --- Electric ---
  sparkbit: {
    name: 'Sparkbit', types: ['ELECTRIC'], base: { hp: 33, atk: 28, def: 24, spd: 58, spc: 45 },
    catchRate: 190, baseExp: 48, growth: 'fast', dexNo: 16,
    learnset: [[1, 'scratch'], [1, 'spark'], [6, 'stringshot'], [10, 'staticfield'], [14, 'arcbolt'], [18, 'voltabsorb']],
    dex: 'A tiny creature that flicks between static-charged fur. It nests inside old lightning rods.',
    art: { arch: 'blob', pal: ['#f0d040', '#a08810', '#fff0a0', '#ffffff'], features: ['glow', 'antennae', 'spots'] }
  },
  voltrat: {
    name: 'Voltrat', types: ['ELECTRIC'], base: { hp: 52, atk: 45, def: 40, spd: 72, spc: 60 },
    catchRate: 100, baseExp: 121, growth: 'medium', dexNo: 17,
    learnset: [[1, 'spark'], [1, 'quickjab'], [1, 'staticfield'], [14, 'arcbolt'], [19, 'voltabsorb'], [24, 'thunderstorm']],
    dex: 'A sparking rodent with a coil of wire for a tail. It nests in ruined observatories.',
    art: { arch: 'fox', pal: ['#f0c830', '#9c8010', '#fff080', '#ffffff'], features: ['glow', 'ears', 'tail', 'antennae'] }
  },
  arcmoth: {
    name: 'Arcmoth', types: ['ELECTRIC', 'FLYING'], base: { hp: 50, atk: 35, def: 35, spd: 78, spc: 65 },
    catchRate: 110, baseExp: 120, growth: 'medium', dexNo: 18,
    learnset: [[1, 'gust'], [1, 'spark'], [1, 'staticfield'], [14, 'arcbolt'], [19, 'windveil'], [24, 'thunderstorm']],
    dex: 'A moth that glows during storms. Sailors once used them as storm-lamps.',
    art: { arch: 'moth', pal: ['#c8d850', '#6a8010', '#f0f0a0', '#ffffff'], features: ['glow', 'wings', 'antennae', 'spots'] }
  },

  // --- Flying ---
  gustwing: {
    name: 'Gustwing', types: ['NORMAL', 'FLYING'], base: { hp: 42, atk: 38, def: 28, spd: 62, spc: 40 },
    catchRate: 190, baseExp: 53, growth: 'fast', dexNo: 19,
    learnset: [[1, 'peck'], [1, 'gust'], [6, 'sandattack'], [10, 'quickjab'], [14, 'wingbeat'], [18, 'windveil']],
    dex: 'A cliff swallow that never quite lands. It rides thermals above the coastal route.',
    art: { arch: 'bird', pal: ['#90d8e8', '#3a7a94', '#d8f4ff', '#ffe8a0'], features: ['wings', 'tail'] }
  },
  zephyrix: {
    name: 'Zephyrix', types: ['FLYING'], base: { hp: 60, atk: 55, def: 38, spd: 82, spc: 55 },
    catchRate: 100, baseExp: 125, growth: 'medium', dexNo: 20,
    learnset: [[1, 'gust'], [1, 'quickjab'], [1, 'peck'], [16, 'wingbeat'], [21, 'windveil'], [26, 'cyclone'], [31, 'skydive']],
    dex: 'A swift raptor of the high passes. It dives without hesitation and lands like a leaf.',
    art: { arch: 'bird', pal: ['#6ac0e0', '#28608c', '#c0e8f8', '#ffe080'], features: ['wings', 'horns', 'tail', 'spikes'] }
  },
  zephyrling: {
    name: 'Zephyrling', types: ['FLYING'], base: { hp: 34, atk: 25, def: 22, spd: 58, spc: 35 },
    catchRate: 200, baseExp: 40, growth: 'fast', dexNo: 21,
    learnset: [[1, 'peck'], [1, 'gust'], [6, 'veil'], [10, 'gustpush'], [14, 'wingbeat'], [18, 'windveil']],
    dex: 'A puff of air with opinions. It drifts along the shoreline before the evening tide.',
    art: { arch: 'blob', pal: ['#d8ecf4', '#88a8bc', '#ffffff', '#c0e0f0'], features: ['glow', 'wings'] }
  },

  // --- Stone / ground ---
  stoneclaw: {
    name: 'Stoneclaw', types: ['ROCK', 'GROUND'], base: { hp: 52, atk: 55, def: 58, spd: 18, spc: 30 },
    catchRate: 170, baseExp: 72, growth: 'medium', dexNo: 22,
    learnset: [[1, 'scratch'], [1, 'rockthrow'], [8, 'hardenrock'], [12, 'mudslap'], [16, 'quakehit'], [20, 'shellbash']],
    dex: 'A burrowing digger with claws harder than flint. It leaves neat square holes behind.',
    art: { arch: 'golem', pal: ['#a08858', '#5c4a2c', '#c8b088', '#e8d8a0'], features: ['spikes', 'shell'] }
  },
  pebbleton: {
    name: 'Pebbleton', types: ['ROCK'], base: { hp: 48, atk: 40, def: 55, spd: 16, spc: 32 },
    catchRate: 200, baseExp: 54, growth: 'fast', dexNo: 23,
    learnset: [[1, 'tackle'], [1, 'rockthrow'], [7, 'hardenrock'], [12, 'sandattack'], [16, 'mudslap'], [20, 'shellbash']],
    dex: 'A rounded river stone that grew a face. It rolls downhill when startled.',
    art: { arch: 'blob', pal: ['#b09a70', '#6a5a3c', '#d8c8a0', '#f0e0b0'], features: ['shell', 'spots'] }
  },
  granitejaw: {
    name: 'Granitejaw', types: ['ROCK'], base: { hp: 75, atk: 70, def: 68, spd: 22, spc: 38 },
    catchRate: 100, baseExp: 138, growth: 'medium', dexNo: 24,
    learnset: [[1, 'scratch'], [1, 'rockthrow'], [1, 'hardenrock'], [16, 'mudslap'], [21, 'quakehit'], [26, 'boulderfall']],
    dex: 'A blunt-headed boulder-hound. It charges first and thinks later, if at all.',
    art: { arch: 'canine', pal: ['#98805a', '#544628', '#c0a880', '#e8d8a0'], features: ['shell', 'spikes', 'tail'] }
  },
  shellguard: {
    name: 'Shellguard', types: ['ROCK', 'WATER'], base: { hp: 68, atk: 40, def: 78, spd: 12, spc: 52 },
    catchRate: 100, baseExp: 132, growth: 'medium', dexNo: 25,
    learnset: [[1, 'tackle'], [1, 'hardenrock'], [1, 'ripple'], [14, 'rockthrow'], [19, 'shellbash'], [24, 'boulderfall']],
    dex: 'A patient shelled creature that waits for hours without moving. Very hard to hurry.',
    art: { arch: 'crab', pal: ['#b09060', '#5e4830', '#dcc098', '#f0e0b0'], features: ['shell', 'spikes'] }
  },
  dunekin: {
    name: 'Dunekin', types: ['NORMAL', 'GROUND'], base: { hp: 44, atk: 42, def: 40, spd: 30, spc: 35 },
    catchRate: 200, baseExp: 57, growth: 'fast', dexNo: 26,
    learnset: [[1, 'tackle'], [1, 'sandattack'], [6, 'mudslap'], [10, 'headbutt'], [14, 'harden'], [18, 'quakehit']],
    dex: 'A wind-scoured sand-drifter. It buries itself at noon and takes no sides in a fight.',
    art: { arch: 'blob', pal: ['#d8b878', '#96794a', '#f0dca0', '#fff0c0'], features: ['shell', 'spots'] }
  },

  // --- Ghost ---
  shadowtail: {
    name: 'Shadowtail', types: ['GHOST'], base: { hp: 43, atk: 48, def: 32, spd: 45, spc: 42 },
    catchRate: 180, baseExp: 63, growth: 'medium', dexNo: 27,
    learnset: [[1, 'scratch'], [1, 'shadowbite'], [7, 'confuseray'], [11, 'quickjab'], [15, 'darkpulse'], [19, 'gloomveil']],
    dex: 'A dusk-coloured hunter that dissolves into long shadows. It hunts at the edges of day.',
    art: { arch: 'fox', pal: ['#6a4a8c', '#2e1e48', '#a888c8', '#e0d0f0'], features: ['tail', 'ears', 'glow'] }
  },
  nocturne: {
    name: 'Nocturne', types: ['GHOST', 'FLYING'], base: { hp: 66, atk: 58, def: 46, spd: 68, spc: 62 },
    catchRate: 100, baseExp: 128, growth: 'medium', dexNo: 28,
    learnset: [[1, 'shadowbite'], [1, 'gust'], [1, 'confuseray'], [16, 'darkpulse'], [21, 'duskclaw'], [26, 'hexsong'], [31, 'nightmare']],
    dex: 'A pale moth that drinks the dark around it. Its wings carry a faint, mournful hum.',
    art: { arch: 'moth', pal: ['#7a5aa0', '#33224e', '#b090d8', '#f0e0ff'], features: ['wings', 'antennae', 'glow', 'spots'] }
  },
  gloommoth: {
    name: 'Gloommoth', types: ['GHOST', 'GRASS'], base: { hp: 60, atk: 45, def: 44, spd: 64, spc: 72 },
    catchRate: 110, baseExp: 130, growth: 'medium', dexNo: 29,
    learnset: [[1, 'shadowbite'], [1, 'sporecloud'], [1, 'darkpulse'], [16, 'hexsong'], [21, 'razorleaf'], [26, 'nightmare'], [31, 'petalstorm']],
    dex: 'A garden moth gone strange. Where it lands, the flowers grow black but thrive.',
    art: { arch: 'moth', pal: ['#5a4a70', '#241c38', '#8a7aa0', '#c0e080'], features: ['wings', 'antennae', 'leaf', 'spots'] }
  },

  // --- Water ---
  tidecrab: {
    name: 'Tidecrab', types: ['WATER'], base: { hp: 45, atk: 46, def: 44, spd: 25, spc: 35 },
    catchRate: 190, baseExp: 58, growth: 'fast', dexNo: 30,
    learnset: [[1, 'scratch'], [1, 'ripple'], [7, 'harden'], [11, 'bubbleburst'], [15, 'mudslap'], [19, 'shellbash']],
    dex: 'A sideways-scuttling crustacean. It decorates its shell with found objects.',
    art: { arch: 'crab', pal: ['#e08060', '#8c3c28', '#ffb090', '#fff0c0'], features: ['shell', 'fins'] }
  },
  coralisk: {
    name: 'Coralisk', types: ['WATER', 'ROCK'], base: { hp: 62, atk: 48, def: 52, spd: 50, spc: 60 },
    catchRate: 100, baseExp: 120, growth: 'medium', dexNo: 31,
    learnset: [[1, 'ripple'], [1, 'gloworb'], [1, 'hardenrock'], [16, 'bubbleburst'], [21, 'moontide'], [26, 'rockthrow'], [31, 'abysswave']],
    dex: 'A reef dweller that cultivates living coral along its back. The coral sharpens when angry.',
    art: { arch: 'fish', pal: ['#f0808c', '#8c3040', '#ffc0c0', '#c0f0e0'], features: ['fins', 'spots', 'crystal', 'glow'] }
  },
  brinejaw: {
    name: 'Brinejaw', types: ['WATER'], base: { hp: 70, atk: 62, def: 48, spd: 52, spc: 45 },
    catchRate: 100, baseExp: 123, growth: 'medium', dexNo: 32,
    learnset: [[1, 'bite'], [1, 'ripple'], [1, 'leer'], [16, 'bubbleburst'], [21, 'moontide'], [26, 'headbutt'], [31, 'abysswave']],
    dex: 'A broad-jawed otter of the tide pools. It steals shells and hides them in the reeds.',
    art: { arch: 'canine', pal: ['#5c9ab0', '#28485c', '#90c8dc', '#f0e0a0'], features: ['fins', 'tail', 'spots'] }
  },
  shellreef: {
    name: 'Shellreef', types: ['WATER', 'ROCK'], base: { hp: 52, atk: 35, def: 62, spd: 18, spc: 45 },
    catchRate: 190, baseExp: 66, growth: 'fast', dexNo: 33,
    learnset: [[1, 'tackle'], [1, 'ripple'], [7, 'hardenrock'], [12, 'rockthrow'], [17, 'bubbleburst'], [22, 'shellbash']],
    dex: 'A coral-crusted rock that has taken up residence in the shallows. It hums when the tide turns.',
    art: { arch: 'blob', pal: ['#c09080', '#6a4a44', '#e8c0a0', '#a0e0d0'], features: ['shell', 'spots', 'crystal'] }
  },

  // --- Ice ---
  frostnip: {
    name: 'Frostnip', types: ['ICE'], base: { hp: 40, atk: 32, def: 35, spd: 55, spc: 58 },
    catchRate: 190, baseExp: 59, growth: 'fast', dexNo: 34,
    learnset: [[1, 'tackle'], [1, 'iceshard'], [7, 'harden'], [11, 'frostbreath'], [15, 'auroraveil'], [19, 'confusion']],
    evolveTo: 'glacielle', evolveLevel: 18,
    dex: 'A small ice-fox that leaves frost flowers wherever it steps. It is warmer than it looks.',
    art: { arch: 'fox', pal: ['#b8e8f0', '#5890a0', '#ffffff', '#d0f0ff'], features: ['ears', 'tail', 'crystal', 'glow'] }
  },
  glacielle: {
    name: 'Glacielle', types: ['ICE', 'PSYCHIC'], base: { hp: 68, atk: 42, def: 52, spd: 72, spc: 82 },
    catchRate: 75, baseExp: 150, growth: 'medium', dexNo: 35,
    learnset: [[1, 'iceshard'], [1, 'confusion'], [1, 'auroraveil'], [18, 'frostbreath'], [23, 'psybeam'], [28, 'blizzard'], [33, 'psychic']],
    dex: 'A glacial fox whose thoughts drift as snow. It remembers every traveller it has met.',
    art: { arch: 'fox', pal: ['#98d8e8', '#487890', '#e8ffff', '#ffffff'], features: ['ears', 'tail', 'crystal', 'glow', 'horns'] }
  },

  // --- Psychic ---
  psyowl: {
    name: 'Psyowl', types: ['PSYCHIC', 'FLYING'], base: { hp: 55, atk: 35, def: 40, spd: 60, spc: 70 },
    catchRate: 120, baseExp: 108, growth: 'medium', dexNo: 36,
    learnset: [[1, 'peck'], [1, 'confusion'], [1, 'hypnosis'], [15, 'psybeam'], [20, 'windveil'], [25, 'psychic'], [30, 'recover']],
    dex: 'A quiet owl that watches from the cave mouth. Its eyes reflect things that are not there.',
    art: { arch: 'bird', pal: ['#c8b080', '#806040', '#f0e0c0', '#b090d8'], features: ['wings', 'glow', 'horns'] }
  },

  // --- Fighting ---
  brawlfin: {
    name: 'Brawlfin', types: ['FIGHTING', 'WATER'], base: { hp: 58, atk: 65, def: 45, spd: 48, spc: 40 },
    catchRate: 140, baseExp: 112, growth: 'medium', dexNo: 37,
    learnset: [[1, 'tackle'], [1, 'karatechop'], [1, 'ripple'], [15, 'lowkick'], [20, 'bulkup'], [25, 'seismic_toss'], [30, 'bodyslam']],
    dex: 'A blunt-headed tide fighter. It settles every argument with a demonstration.',
    art: { arch: 'canine', pal: ['#70a8b8', '#305a6a', '#a8d8e0', '#f0c060'], features: ['fins', 'tail', 'spikes'] }
  },

  // --- Poison / bug ---
  venomite: {
    name: 'Venomite', types: ['POISON', 'BUG'], base: { hp: 38, atk: 42, def: 30, spd: 48, spc: 35 },
    catchRate: 190, baseExp: 55, growth: 'fast', dexNo: 38,
    learnset: [[1, 'poisonsting'], [1, 'bugbite'], [7, 'stringshot'], [11, 'acid'], [15, 'toxiccloud'], [19, 'pinmissile']],
    dex: 'A venomous mite that nests under bark. It is very small and very certain of itself.',
    art: { arch: 'insect', pal: ['#9a70c0', '#4e3268', '#c8a0e8', '#e0f070'], features: ['spikes', 'antennae', 'spots'] }
  },

  // --- Dragon ---
  drakeling: {
    name: 'Drakeling', types: ['DRAGON'], base: { hp: 52, atk: 50, def: 45, spd: 48, spc: 50 },
    catchRate: 100, baseExp: 95, growth: 'slow', dexNo: 39,
    learnset: [[1, 'scratch'], [1, 'dragonrage'], [8, 'leer'], [13, 'dragonbreath'], [18, 'headbutt'], [24, 'dragonclaw'], [30, 'dragonpulse']],
    evolveTo: 'draconis', evolveLevel: 24,
    dex: 'A small drake with scales like slate. It collects shiny stones and guards them fiercely.',
    art: { arch: 'reptile', pal: ['#7090c0', '#304868', '#b0c8e8', '#f0e0a0'], features: ['horns', 'tail', 'spikes'] }
  },
  draconis: {
    name: 'Draconis', types: ['DRAGON', 'FLYING'], base: { hp: 78, atk: 75, def: 65, spd: 70, spc: 75 },
    catchRate: 45, baseExp: 178, growth: 'slow', dexNo: 40,
    learnset: [[1, 'dragonrage'], [1, 'dragonbreath'], [1, 'wingbeat'], [24, 'dragonclaw'], [29, 'windveil'], [34, 'dragonpulse'], [39, 'skydive']],
    dex: 'A high-soaring drake. Its shadow crossing the bay is said to bring good weather.',
    art: { arch: 'dragon', pal: ['#5a78b0', '#243a5c', '#90b0d8', '#f0d080'], features: ['wings', 'horns', 'tail', 'spikes'] }
  },

  // --- Normal ---
  pufflet: {
    name: 'Pufflet', types: ['NORMAL', 'FLYING'], base: { hp: 38, atk: 30, def: 28, spd: 45, spc: 35 },
    catchRate: 200, baseExp: 42, growth: 'fast', dexNo: 41,
    learnset: [[1, 'tackle'], [1, 'peck'], [6, 'growl'], [10, 'gust'], [14, 'quickjab'], [18, 'headbutt']],
    dex: 'A round shorebird that has forgotten how to be afraid of people. It steals sandwiches.',
    art: { arch: 'bird', pal: ['#e8d8b0', '#a89068', '#fff8e0', '#f0b080'], features: ['wings', 'tail', 'spots'] }
  }
};

export const CREATURE_IDS = Object.keys(CREATURES);
export const STARTERS = ['pyrelisk', 'mossprig', 'tidelume'];
export const DEX_ORDER = [...CREATURE_IDS].sort((a, b) => CREATURES[a].dexNo - CREATURES[b].dexNo);

export function species(id) { return CREATURES[id] || null; }
export function speciesName(id) { return CREATURES[id] ? CREATURES[id].name : id; }

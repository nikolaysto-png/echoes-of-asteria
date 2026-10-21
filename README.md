# ECHOES OF ASTERIA

A complete, playable monster-collecting RPG built as a strict **160×144, four-shade** Game Boy-style game. It runs in a desktop browser with no build step, no dependencies, and no external art or audio files. Every creature, character, map, line of dialogue, and chiptune track was created for this project.

## Running the game

The game uses native ES modules, so serve the folder rather than opening `index.html` from disk:

```sh
cd "Default Project"
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

**Play online:** <https://nikolaysto-png.github.io/echoes-of-asteria/>

Audio starts after your first click or keypress, as required by browser autoplay rules. The title screen and pause menu both include an audio/text-speed/shake options panel.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / `WASD` | Walk on the tile grid |
| `Z` / `Enter` | Talk, confirm, advance dialogue |
| `X` / `Escape` / `Backspace` | Cancel, go back, close a menu |
| `C` / `Shift` / `M` | Open the pause menu |
| Arrow keys + `Z` | Navigate menus and choose commands |

Movement is four-directional and tile-aligned. There is no run button; the game is paced for the 160×144 screen.

## What is in the game

### Campaign

The story runs from the player's home in Lumen Bay to the archive in Emberfall, with the ending sequence and a return-to-world epilogue.

- **14 connected maps**: Home, Lumen Bay, Vale's Laboratory, Lumen Clinic, Lumen Sundry Goods, the Coast Road, Whisperwood, Tide Cave, Halvern Market, Halvern Clinic, Halvern Exchange, the Coiled Arena, Emberfall, and the Emberfall Library.
- **41 original creatures** across **15 types**, including three complete three-stage starter lines.
- **96 moves** and **12 items**, including healing items, status cures, revives, and three capture devices.
- **5 trainer battles** with distinct parties/payouts, plus wild encounters, a starter choice, a dungeon shard quest, arena progression, shops, a healing spring, and an ending.
- **10 original chiptune tracks** and a full set of synthesized sound effects.

### Battle and progression systems

- Gen-I-style stat calculation using DVs, stat EXP, levels, and per-species base stats.
- Physical/special damage split by type, STAB, the 15-type effectiveness chart, damage rolls, and Gen-I speed-based critical hits.
- Accuracy/evasion stages, attack/defense/special/speed stages, priority moves, and speed-based turn order.
- Burn, poison, paralysis, sleep, freeze, confusion, flinch, and end-of-turn residual damage.
- Switching, forced switching after a faint, last-creature loss handling, and trainer replacement AI.
- Capture formula using foe HP, species catch rate, ball strength, and status.
- EXP gain, stat EXP, level-ups, move learning, and evolution.
- PP, Struggle, healing items, status cures, revives, and capture balls.
- Whiteout handling that heals the party and returns the player to the last respawn point.

### Menus, world, and saves

- Pause menu with Echoes/party details, Bag, Bestiary, Trainer card, Save, and Options.
- Shops with buy/sell flows, quantity selection, stock, and bag capacity checks.
- Storage terminal with party/storage transfers and protection against depositing the last living party member.
- Dialogue with typewriter text, choices, speakers, and a data-driven script interpreter.
- Grid movement, NPC facing, map transitions, ledge/blocking rules, wild encounters, item pickups, and map tile edits.
- One versioned localStorage save (`asteria-gb-v1`) containing party, storage, bag, coins, position, flags, dex, defeated trainers, map edits, settings, and playtime.
- Save normalization clamps malformed values, rejects unknown species/items/moves, and removes unsafe keys instead of crashing.

## Automated tests

The test suite covers damage/STAB/type/critical/burn behavior, speed order, switching, forced switching, poison residual damage, save validation, and a regression test proving that every left-facing character sprite is an exact horizontal mirror of the right-facing sprite.

JavaScriptCore (included with macOS) needs no installation:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m tests/run-tests.mjs
```

With Node installed:

```sh
npm test
```

Both commands run the same tests. The suite prints a pass/fail line per test and exits non-zero on failure.

## Architecture

```
index.html                 canvas shell and boot error panel
style.css                  page frame, nearest-neighbour scaling, responsive layout
src/
  main.js                  Game loop, scene/overlay manager, saves, music, fades
  core/
    constants.js           160×144 size, DMG palette, keys, save constants
    input.js               keyboard state, edge presses, held-direction repeat
    font.js                bitmap font and text wrapping
    audio.js               gesture-gated Web Audio synth, songs, SFX
    state.js               save creation, sanitization, validation, storage
  data/
    types.js               15-type chart and special/physical split
    moves.js               96 move definitions
    creatures.js           41 species, stats, learnsets, evolutions
    items.js               items and prices
    maps.js                14 maps, tiles, encounters, events, warps
    story.js               trainers, shop stocks, all quest scripts
  systems/
    creature.js            stats, EXP, leveling, learning, evolution, healing
    battle.js              pure damage math, turn resolution, statuses, capture, AI
    events.js              async data-driven event interpreter
  render/
    renderer.js            palette-locked canvas primitives, clipping, shake
    sprites.js             creatures, objects, 16×20 character buffers
    tiles.js               terrain and object tile art
    ui.js                  boxes, cursors, bars, panels
  scenes/
    title.js, name.js, overworld.js, dialogue.js, battle.js,
    menu.js, shop.js, ending.js
tests/run-tests.mjs        Node/JavaScriptCore test runner
```

### Deterministic simulation

The main loop is fixed at 60 updates per second. Scenes communicate through Promise-based `Game` APIs (`say`, `choose`, `chooseStarter`, `startWildBattle`, `startTrainerBattle`, `openShop`, `openStorage`), so an event script can pause on dialogue or a battle and resume without quest logic leaking into scene code. The world stays mounted underneath overlays.

Opening the game with `?manual=1` is a development aid: it stops the `requestAnimationFrame` loop and exposes `window.__game` and `window.__step(n)` for deterministic browser inspection. Normal play does not use this mode.

### Character sprite rendering

Characters are built on a 16×20 pixel buffer with a one-pixel outline pass and a bottom-center anchor. Front and back views are authored symmetrically. Side views are authored once, facing right, and the complete bitmap is mirrored horizontally for the left-facing view. This avoids per-box coordinate mirroring, which had previously shifted parts by the box width and caused detached eyes, clipped shoes, and broken profiles.

`src/render/sprites.js` exports `characterPixels(spriteId, dir, frame)` as a pure, canvas-free pixel buffer used by both the renderer and the mirroring regression tests.

### Event interpreter

Scripts are arrays of commands evaluated at runtime. Supported commands include dialogue, choices, nested conditions, flags, item grants/removals, party grants, starter selection, wild/trainer battles with win/lose branches, healing/respawn, shops, storage, warps, music/SFX, screen shake, NPC movement/facing, waiting, map tile edits, and endings. All overworld quests, shop inventories, trainer rewards, and the ending are driven by `src/data/story.js` and `src/data/maps.js`.

## Project constraints

- Internal resolution is exactly **160×144** with **16×16** tiles.
- Rendering uses the four DMG greens `#0f380f`, `#306230`, `#8bac0f`, and `#9bbc0f` with smoothing disabled.
- No network requests, image assets, or audio files are needed during play.
- No bundler or package installation is required.

## Legal

Original work. All names, creatures, dialogue, pixel art, maps, and music were created for this project and do not reproduce any existing franchise.

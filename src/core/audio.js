// Original chiptune synthesis via Web Audio. No external assets, no network.

const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** 'A4' | 'C#5' | '-' (rest) */
function freq(note) {
  if (!note || note === '-') return 0;
  const m = /^([a-gA-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) return 0;
  let semi = NOTE[m[1].toLowerCase()];
  if (m[2] === '#') semi += 1;
  if (m[2] === 'b') semi -= 1;
  const octave = parseInt(m[3], 10);
  const midi = semi + (octave + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---- Songs -----------------------------------------------------------------
// Each track: { bpm, loop, lead:[], bass:[], drums:[] }
// lead/bass/drums are arrays of [noteOrNull, beats]

const S = (n, b = 1) => [n, b];
const R = (b = 1) => ['-', b];

const SONGS = {
  title: {
    bpm: 92,
    lead: [
      S('E5', 2), S('B4', 1), S('C5', 1), S('D5', 2), S('C5', 1), S('B4', 1),
      S('A4', 2), S('A4', 1), S('C5', 1), S('E5', 2), S('D5', 1), S('C5', 1),
      S('B4', 3), S('C5', 1), S('D5', 2), S('E5', 2),
      S('C5', 2), S('A4', 2), S('F4', 2), S('G4', 2),
      S('A4', 4), R(2),
      S('E5', 2), S('B4', 1), S('C5', 1), S('D5', 2), S('E5', 2), S('C5', 2),
      S('A4', 2), S('B4', 2), S('C5', 4)
    ],
    bass: [
      S('A2', 2), S('E2', 2), S('A2', 2), S('E2', 2),
      S('F2', 2), S('C2', 2), S('F2', 2), S('C2', 2),
      S('G2', 2), S('D2', 2), S('G2', 2), S('D2', 2),
      S('A2', 4),
      S('A2', 2), S('E2', 2), S('A2', 2), S('E2', 2),
      S('F2', 2), S('C2', 2), S('D2', 2), S('G2', 2),
      S('A2', 4)
    ],
    drums: 'none'
  },
  village: {
    bpm: 116,
    lead: [
      S('C5', 1), S('E5', 1), S('G5', 1), S('E5', 1), S('F5', 1), S('A5', 1), S('G5', 2),
      S('E5', 1), S('G5', 1), S('C6', 1), S('G5', 1), S('F5', 1), S('D5', 1), S('C5', 2),
      S('D5', 1), S('F5', 1), S('A5', 1), S('F5', 1), S('E5', 1), S('C5', 1), S('G4', 2),
      S('A4', 1), S('C5', 1), S('E5', 1), S('A5', 2), S('G5', 2),
      S('C5', 1), S('E5', 1), S('G5', 1), S('E5', 1), S('F5', 1), S('A5', 1), S('G5', 2),
      S('E5', 1), S('G5', 1), S('C6', 1), S('G5', 1), S('F5', 1), S('D5', 1), S('C5', 2),
      S('G4', 1), S('B4', 1), S('D5', 1), S('G5', 2), S('F5', 1), S('E5', 1), S('C5', 2),
      S('E5', 1), S('G5', 1), S('C6', 1), S('E6', 2), S('D6', 1), S('C6', 1), S('B5', 2)
    ],
    bass: [
      S('C3', 2), S('C3', 2), S('F3', 2), S('G3', 2),
      S('C3', 2), S('C3', 2), S('D3', 2), S('G2', 2),
      S('A2', 2), S('A2', 2), S('F2', 2), S('G2', 2),
      S('C3', 2), S('C3', 2), S('F3', 2), S('G3', 2),
      S('C3', 2), S('C3', 2), S('D3', 2), S('G2', 2),
      S('A2', 2), S('A2', 2), S('F2', 2), S('G2', 2),
      S('C3', 2), S('C3', 2), S('F3', 2), S('G3', 2),
      S('C3', 2), S('G2', 2), S('C3', 2), S('E2', 2)
    ],
    drums: 'soft'
  },
  forest: {
    bpm: 104,
    lead: [
      S('D5', 1), S('E5', 1), S('F5', 2), S('E5', 1), S('D5', 1), S('C5', 2),
      S('D5', 1), S('F5', 1), S('A5', 2), S('G5', 1), S('F5', 1), S('E5', 2),
      S('B4', 1), S('D5', 1), S('G5', 2), S('F5', 1), S('E5', 1), S('D5', 2),
      S('C5', 1), S('E5', 1), S('A5', 2), S('G5', 2),
      S('D5', 1), S('E5', 1), S('F5', 2), S('E5', 1), S('D5', 1), S('C5', 2),
      S('D5', 1), S('F5', 1), S('A5', 2), S('B5', 1), S('A5', 1), S('G5', 2),
      S('F5', 2), S('E5', 2), S('D5', 2), S('C5', 2),
      S('A4', 1), S('C5', 1), S('E5', 1), S('A5', 2), S('G5', 2), S('E5', 4)
    ],
    bass: [
      S('D2', 2), S('D2', 2), S('A2', 2), S('A2', 2),
      S('B2', 2), S('B2', 2), S('G2', 2), S('G2', 2),
      S('D2', 2), S('D2', 2), S('A2', 2), S('A2', 2),
      S('C3', 2), S('C3', 2), S('G2', 2), S('G2', 2),
      S('D2', 2), S('D2', 2), S('A2', 2), S('A2', 2),
      S('B2', 2), S('B2', 2), S('G2', 2), S('G2', 2),
      S('D2', 2), S('A2', 2), S('F2', 2), S('C3', 2),
      S('D2', 2), S('A2', 2), S('D2', 4)
    ],
    drums: 'soft'
  },
  route: {
    bpm: 126,
    lead: [
      S('A4', 1), S('C5', 1), S('E5', 1), S('A5', 1), S('G5', 1), S('E5', 1), S('D5', 2),
      S('E5', 1), S('G5', 1), S('B5', 1), S('D6', 1), S('C6', 1), S('A5', 1), S('G5', 2),
      S('F5', 1), S('A5', 1), S('C6', 1), S('F6', 1), S('E6', 1), S('C6', 1), S('B5', 2),
      S('A5', 1), S('C6', 1), S('E6', 1), S('A6', 2), S('G6', 1), S('E6', 1), S('D6', 2),
      S('C6', 1), S('A5', 1), S('F5', 1), S('D5', 1), S('A5', 1), S('C6', 1), S('E6', 2),
      S('D6', 1), S('B5', 1), S('G5', 1), S('E5', 1), S('D5', 2), R(1), S('C5', 1),
      S('E5', 2), S('G5', 2), S('A5', 4)
    ],
    bass: [
      S('A2', 1), S('A2', 1), S('A2', 1), S('A2', 1), S('E2', 2), S('A2', 2),
      S('E2', 1), S('E2', 1), S('E2', 1), S('E2', 1), S('A2', 2), S('E2', 2),
      S('F2', 1), S('F2', 1), S('F2', 1), S('F2', 1), S('C3', 2), S('F2', 2),
      S('C3', 1), S('C3', 1), S('C3', 1), S('C3', 1), S('G2', 2), S('C3', 2),
      S('A2', 1), S('A2', 1), S('F2', 1), S('F2', 1), S('D2', 2), S('E2', 2),
      S('A2', 2), S('E2', 2), S('C3', 2), S('G2', 2),
      S('A2', 2), S('E2', 2), S('A2', 4)
    ],
    drums: 'rock'
  },
  battle: {
    bpm: 148,
    lead: [
      S('D5', 1), S('D5', 1), S('F5', 1), S('D5', 1), S('A5', 2), S('G5', 1), S('F5', 1),
      S('E5', 1), S('E5', 1), S('G5', 1), S('E5', 1), S('D5', 2), S('C5', 1), S('D5', 1),
      S('F5', 1), S('F5', 1), S('A5', 1), S('F5', 1), S('C6', 2), S('B5', 1), S('A5', 1),
      S('G5', 1), S('G5', 1), S('B5', 1), S('G5', 1), S('D6', 2), S('C6', 1), S('B5', 1),
      S('A5', 2), S('F5', 2), S('D5', 2), S('E5', 2),
      S('F5', 1), S('A5', 1), S('C6', 1), S('A5', 1), S('F5', 2), S('E5', 2),
      S('D5', 4), S('E5', 1), S('F5', 1), S('G5', 2),
      S('A5', 4)
    ],
    bass: [
      S('D2', 1), S('D2', 1), S('D2', 1), S('D2', 1), S('D2', 1), S('D2', 1), S('A2', 2),
      S('C2', 1), S('C2', 1), S('C2', 1), S('C2', 1), S('C2', 1), S('C2', 1), S('G2', 2),
      S('F2', 1), S('F2', 1), S('F2', 1), S('F2', 1), S('F2', 1), S('F2', 1), S('C3', 2),
      S('G2', 1), S('G2', 1), S('G2', 1), S('G2', 1), S('G2', 1), S('G2', 1), S('D3', 2),
      S('D2', 2), S('F2', 2), S('D2', 2), S('E2', 2),
      S('F2', 1), S('A2', 1), S('F2', 1), S('A2', 1), S('C3', 2), S('A2', 2),
      S('D2', 2), S('E2', 2), S('F2', 2), S('G2', 2),
      S('A2', 4)
    ],
    drums: 'rock'
  },
  rival: {
    bpm: 156,
    lead: [
      S('A4', 1), S('C5', 1), S('E5', 1), S('C5', 1), S('D5', 2), S('E5', 1), S('G5', 1),
      S('F5', 1), S('E5', 1), S('D5', 1), S('C5', 1), S('A4', 2), S('B4', 1), S('D5', 1),
      S('E5', 1), S('G5', 1), S('B5', 1), S('G5', 1), S('A5', 2), S('G5', 1), S('E5', 1),
      S('F5', 1), S('D5', 1), S('B4', 1), S('G4', 1), S('A4', 2), S('C5', 1), S('E5', 1),
      S('G5', 2), S('F5', 1), S('D5', 1), S('C5', 2), S('A4', 2),
      S('D5', 1), S('F5', 1), S('A5', 1), S('F5', 1), S('D5', 2), S('C5', 2),
      S('A5', 4), S('G5', 1), S('E5', 1), S('C5', 2)
    ],
    bass: [
      S('A2', 2), S('A2', 2), S('A2', 2), S('A2', 2),
      S('G2', 2), S('G2', 2), S('G2', 2), S('G2', 2),
      S('D2', 2), S('D2', 2), S('D2', 2), S('D2', 2),
      S('E2', 2), S('E2', 2), S('E2', 2), S('E2', 2),
      S('A2', 2), S('A2', 2), S('F2', 2), S('F2', 2),
      S('G2', 2), S('G2', 2), S('A2', 2), S('A2', 2),
      S('A2', 4)
    ],
    drums: 'rock'
  },
  arena: {
    bpm: 144,
    lead: [
      S('C5', 1), S('D5', 1), S('E5', 1), S('G5', 1), S('E5', 2), S('D5', 1), S('C5', 1),
      S('B4', 1), S('C5', 1), S('D5', 1), S('F5', 1), S('D5', 2), S('C5', 1), S('B4', 1),
      S('G4', 1), S('A4', 1), S('C5', 1), S('E5', 1), S('C5', 2), S('A4', 2),
      S('E5', 1), S('G5', 1), S('C6', 1), S('G5', 1), S('E5', 2), S('D5', 1), S('C5', 1),
      S('D5', 1), S('F5', 1), S('A5', 1), S('F5', 1), S('D5', 2), S('C5', 2),
      S('G5', 1), S('E5', 1), S('C5', 1), S('G5', 1), S('C6', 4),
      S('A5', 2), S('G5', 2), S('E5', 2), S('D5', 2),
      S('C5', 1), S('E5', 1), S('G5', 1), S('C6', 2), S('B5', 1), S('G5', 1), S('E5', 2),
      S('G5', 4)
    ],
    bass: [
      S('C3', 2), S('C3', 2), S('G2', 2), S('G2', 2),
      S('F2', 2), S('F2', 2), S('G2', 2), S('G2', 2),
      S('C3', 2), S('C3', 2), S('E3', 2), S('E3', 2),
      S('C3', 2), S('C3', 2), S('G2', 2), S('G2', 2),
      S('A2', 2), S('A2', 2), S('F2', 2), S('F2', 2),
      S('G2', 2), S('G2', 2), S('C3', 2), S('C3', 2),
      S('C3', 2), S('G2', 2), S('E3', 2), S('G2', 2),
      S('C3', 4)
    ],
    drums: 'rock'
  },
  ruins: {
    bpm: 78,
    lead: [
      S('D5', 3), S('F5', 1), S('E5', 2), S('C5', 2),
      S('D5', 3), S('A5', 1), S('G5', 3), S('F5', 1),
      S('E5', 4), S('D5', 2), S('C5', 2),
      S('B4', 3), S('D5', 1), S('F5', 3), S('E5', 1),
      S('D5', 4), S('A4', 4),
      S('D5', 3), S('F5', 1), S('A5', 2), S('G5', 2),
      S('F5', 3), S('E5', 1), S('D5', 4), R(2),
      S('C5', 4), S('D5', 4)
    ],
    bass: [
      S('D2', 4), S('D2', 2), S('C2', 2),
      S('D2', 4), S('B1', 2), S('A1', 2),
      S('C2', 4), S('A1', 4),
      S('G1', 4), S('G1', 2), S('A1', 2),
      S('D2', 4), S('D2', 4),
      S('A1', 4), S('A1', 2), S('G1', 2),
      S('D2', 4), S('A1', 4),
      S('C2', 4), S('D2', 4)
    ],
    drums: 'none'
  },
  victory: {
    bpm: 160,
    loop: false,
    lead: [
      S('C5', 1), S('E5', 1), S('G5', 1), S('C6', 2),
      S('G5', 1), S('C6', 3), S('E6', 4)
    ],
    bass: [
      S('C3', 1), S('C3', 1), S('C3', 1), S('C3', 2),
      S('G2', 1), S('C3', 3), S('C3', 4)
    ],
    drums: 'rock'
  },
  heal: {
    bpm: 132,
    loop: false,
    lead: [
      S('G4', 1), S('C5', 1), S('E5', 1), S('G5', 1), S('C6', 3),
      S('E6', 2), S('D6', 2), S('C6', 4)
    ],
    bass: [
      S('C3', 2), S('C3', 2), S('G2', 2), S('G2', 2),
      S('C3', 2), S('C3', 4)
    ],
    drums: 'soft'
  }
};

function songLength(song) {
  const beats = track => (track || []).reduce((sum, note) => sum + note[1], 0);
  return Math.max(1, Math.round(Math.max(beats(song.lead), beats(song.bass)) * 2));
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.settings = { music: true, sfx: true, textSpeed: 1, shake: true, mute: false };
    this.current = null;
    this.currentName = null;
    this.desiredName = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.started = false;
  }

  /** Creates the audio graph. Only unlock() may call this before a gesture. */
  ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
    } catch (e) {
      return false;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.settings.mute ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.music && !this.settings.mute ? 0.32 : 0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfx && !this.settings.mute ? 0.55 : 0;
    this.sfxGain.connect(this.master);
    return true;
  }

  /** Must be called from a user gesture. Queued music starts here. */
  unlock() {
    if (!this.ensure()) return;
    this.started = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.applySettings(this.settings);
  }

  applySettings(s) {
    if (s && typeof s === 'object') Object.assign(this.settings, s);
    if (!this.ctx) return;
    const audible = !this.settings.mute;
    this.master.gain.value = audible ? 1 : 0;
    this.musicGain.gain.value = this.settings.music && audible ? 0.32 : 0;
    this.sfxGain.gain.value = this.settings.sfx && audible ? 0.55 : 0;
    if (this.settings.music && audible) {
      if (this.desiredName && (!this.currentName || !this.timer)) this.startTrack(this.desiredName);
    } else {
      this.stopMusic(false);
    }
  }

  // ---- Music sequencer ----------------------------------------------------
  playMusic(name) {
    if (!name || !SONGS[name]) return;
    this.desiredName = name;
    if (!this.started) return;
    if (!this.settings.music || this.settings.mute) {
      this.stopMusic(false);
      return;
    }
    if (this.currentName === name && this.timer) return;
    this.startTrack(name);
  }

  startTrack(name) {
    if (!this.ctx || !SONGS[name] || !this.started) return;
    this.stopMusic(false);
    this.currentName = name;
    this.current = SONGS[name];
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.scheduler(), 25);
  }

  stopMusic(clearDesired = true) {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.currentName = null;
    this.current = null;
    if (clearDesired) this.desiredName = null;
  }

  scheduler() {
    if (!this.ctx || !this.current) return;
    const spb = 60 / this.current.bpm;
    const look = 0.18;
    // A hidden tab can leave nextTime far behind. Resume from now rather than
    // firing a burst of stale notes.
    if (this.nextTime < this.ctx.currentTime - 0.5) {
      this.nextTime = this.ctx.currentTime + 0.05;
      this.step = 0;
    }
    const length = songLength(this.current);
    while (this.nextTime < this.ctx.currentTime + look) {
      if (this.step >= length) {
        if (this.current.loop === false) {
          this.stopMusic(false);
          return;
        }
        this.step = 0;
      }
      this.emitStep(this.nextTime, spb);
      this.nextTime += spb / 2; // eighth-note grid
      this.step++;
    }
  }

  emitStep(t, spb) {
    const song = this.current;
    const half = spb / 2;
    // Lead
    this.noteAt(song.lead, t, half, 'lead');
    this.noteAt(song.bass, t, half, 'bass');
    // Drums on the 8th grid
    if (song.drums !== 'none') {
      const s = this.step % 8;
      if (s % 2 === 0) this.drum(t, 'kick');
      if (song.drums === 'rock' && (s === 2 || s === 6)) this.drum(t, 'snare');
      if (song.drums === 'soft' && s === 4) this.drum(t, 'hat');
      if (song.drums === 'rock' && s % 2 === 1) this.drum(t, 'hat');
    }
  }

  noteAt(track, t, dur, voice) {
    if (!track) return;
    // Walk the track until we land on a step boundary
    let acc = 0;
    let idx = 0;
    const total = this.step;
    for (let i = 0; i < track.length; i++) {
      const [n, b] = track[i];
      const len = b * 2; // in eighth-steps
      if (total >= acc && total < acc + len) {
        idx = i;
        break;
      }
      acc += len;
      idx = i;
    }
    // Only trigger on the first eighth of the note
    let start = 0;
    for (let i = 0; i < idx; i++) start += track[i][1] * 2;
    if (total !== start) return;
    const note = track[idx][0];
    if (!note || note === '-') return;
    const f = freq(note);
    if (!f) return;
    this.tone(t, f, dur * 0.9, voice);
  }

  tone(t, f, dur, voice) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (voice === 'lead') {
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
      osc.connect(gain); gain.connect(this.musicGain);
    } else {
      osc.type = 'triangle';
      osc.frequency.value = f / 2;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
      osc.connect(gain); gain.connect(this.musicGain);
    }
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  drum(t, kind) {
    const ctx = this.ctx;
    if (kind === 'kick') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g); g.connect(this.musicGain);
      osc.start(t); osc.stop(t + 0.15);
    } else {
      const buf = ctx.createBuffer(1, 1400, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = kind === 'snare' ? 'bandpass' : 'highpass';
      hp.frequency.value = kind === 'snare' ? 1800 : 7000;
      const g = ctx.createGain();
      g.gain.value = kind === 'snare' ? 0.16 : 0.07;
      src.connect(hp); hp.connect(g); g.connect(this.musicGain);
      src.start(t);
    }
  }

  // ---- SFX ----------------------------------------------------------------
  sfx(name) {
    if (!this.started || !this.settings.sfx || this.settings.mute) return;
    if (!this.ctx && !this.ensure()) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'cursor': this.blip(t, 620, 0.05, 'square', 0.10); break;
      case 'select': this.blip(t, 880, 0.07, 'square', 0.12); this.blip(t + 0.06, 1180, 0.09, 'square', 0.10); break;
      case 'cancel': this.blip(t, 420, 0.08, 'square', 0.10); this.blip(t + 0.06, 260, 0.09, 'square', 0.09); break;
      case 'hit': this.noise(t, 0.16, 0.20, 1200); this.blip(t, 180, 0.12, 'sawtooth', 0.14); break;
      case 'superhit':
        this.noise(t, 0.26, 0.26, 2400);
        this.blip(t, 260, 0.22, 'sawtooth', 0.16);
        this.blip(t + 0.04, 130, 0.24, 'square', 0.12);
        break;
      case 'miss': this.noise(t, 0.10, 0.08, 3200); break;
      case 'faint': this.blip(t, 700, 0.28, 'triangle', 0.16); this.blip(t + 0.2, 300, 0.4, 'triangle', 0.14); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => this.blip(t + i * 0.07, f, 0.16, 'sine', 0.16)); break;
      case 'capture': this.blip(t, 500, 0.1, 'square', 0.12); this.blip(t + 0.1, 700, 0.1, 'square', 0.12); this.blip(t + 0.2, 1000, 0.2, 'square', 0.14); break;
      case 'ball': this.blip(t, 900, 0.06, 'square', 0.10); this.blip(t + 0.07, 1200, 0.1, 'square', 0.09); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => this.blip(t + i * 0.075, f, 0.2, 'square', 0.13)); break;
      case 'encounter': for (let i = 0; i < 6; i++) this.blip(t + i * 0.05, 300 + i * 160, 0.05, 'sawtooth', 0.11); break;
      case 'door': this.noise(t, 0.14, 0.10, 500); this.blip(t + 0.08, 300, 0.1, 'square', 0.09); break;
      case 'text': this.blip(t, 1500, 0.014, 'square', 0.05); break;
      case 'error': this.blip(t, 200, 0.16, 'square', 0.12); break;
      case 'item': this.blip(t, 800, 0.08, 'triangle', 0.12); this.blip(t + 0.08, 1200, 0.12, 'triangle', 0.10); break;
      case 'save': [784, 988, 1175, 1568].forEach((f, i) => this.blip(t + i * 0.08, f, 0.22, 'triangle', 0.13)); break;
      default: break;
    }
  }

  blip(t, f, dur, type = 'square', vol = 0.12) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  noise(t, dur, vol, cutoff) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'lowpass';
    hp.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(hp); hp.connect(g); g.connect(this.sfxGain);
    src.start(t);
  }
}

export const audio = new Audio();

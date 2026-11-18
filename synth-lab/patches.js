import { NOTE_RUSH_SOUNDS } from '../src/audio/noteRushSounds.ts';
import { numericControls, tables } from './controlSpecs.js';

export const TAU = 2 * Math.PI;
export const clone = value => JSON.parse(JSON.stringify(value));
export const defaultWave = () => Array.from({
  length: 128
}, (_, i) => Math.sin(TAU * i / 128));
export const init = {
  a: {
    on: true,
    table: 'analog',
    pos: 0,
    level: .72,
    oct: 0,
    semi: 0,
    fine: 0,
    unison: 1,
    detune: 12,
    pan: 0,
    custom: defaultWave()
  },
  b: {
    on: false,
    table: 'analog',
    pos: .67,
    level: .38,
    oct: 0,
    semi: 0,
    fine: 0,
    unison: 1,
    detune: 12,
    pan: 0,
    custom: defaultWave()
  },
  filter: {
    on: true,
    type: 'lowpass',
    cutoff: 12500,
    res: .2,
    env: 0
  },
  amp: {
    a: .012,
    d: .25,
    s: .8,
    r: .22
  },
  env: {
    a: .025,
    d: .35,
    s: 0,
    r: .25
  },
  extra: {
    sub: 0,
    noise: 0,
    fm: 0,
    ratio: 2
  },
  lfo: {
    shape: 'sine',
    rate: 2,
    pitch: 0,
    cutoff: 0,
    amp: 0,
    pan: 0,
    scanA: 0,
    scanB: 0
  },
  fx: {
    drive: 0,
    chorus: 0,
    chorusRate: .35,
    chorusDepth: 4,
    delay: 0,
    time: .32,
    feedback: .32,
    reverb: 0,
    size: .45
  },
  voice: {
    mode: 'poly',
    glide: .06,
    master: .65
  }
};
export function merge(base, patch) {
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (!Object.hasOwn(base, key)) continue;
    const original = base[key];
    if (original && typeof original === 'object' && !Array.isArray(original)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merge(original, value);
      }
    } else {
      base[key] = clone(value);
    }
  }
  return base;
}
const P = (name, cat, patch) => ({
  name,
  cat,
  patch: merge(clone(init), patch)
});
export const presets = [P('Init Patch', 'Basic', {}), P(NOTE_RUSH_SOUNDS.sine.label, 'Basic', NOTE_RUSH_SOUNDS.sine.patch), P('Analog Saw', 'Basic', {
  a: {
    pos: .67
  },
  filter: {
    cutoff: 6500
  }
}), P('Square Signal', 'Basic', {
  a: {
    pos: 1
  }
}), P(NOTE_RUSH_SOUNDS.triangle.label, 'Basic', NOTE_RUSH_SOUNDS.triangle.patch), P('Deep 808', 'Bass', {
  a: {
    oct: -1,
    level: .75
  },
  amp: {
    a: .005,
    d: .6,
    s: .15,
    r: .2
  },
  extra: {
    sub: .35
  },
  filter: {
    cutoff: 950
  },
  fx: {
    drive: .25
  }
}), P('Rubber Bass', 'Bass', {
  a: {
    pos: 1,
    oct: -1
  },
  filter: {
    cutoff: 280,
    res: 6,
    env: 3.8
  },
  env: {
    a: .006,
    d: .22,
    s: .05,
    r: .12
  },
  amp: {
    a: .006,
    d: .22,
    s: .7,
    r: .09
  },
  fx: {
    drive: .22
  }
}), P('Acid Line', 'Bass', {
  a: {
    pos: .67
  },
  filter: {
    cutoff: 240,
    res: 13,
    env: 4.6
  },
  env: {
    a: .003,
    d: .19,
    s: 0,
    r: .08
  },
  voice: {
    mode: 'mono',
    glide: .12
  },
  fx: {
    drive: .38
  }
}), P('Reese Reactor', 'Bass', {
  a: {
    pos: .7,
    oct: -1,
    unison: 4,
    detune: 28
  },
  b: {
    on: true,
    pos: .7,
    oct: -1,
    fine: -16,
    unison: 3,
    detune: 23
  },
  filter: {
    cutoff: 1800
  },
  lfo: {
    rate: .45,
    cutoff: 1.2
  },
  fx: {
    drive: .3,
    chorus: .18
  }
}), P('FM Growl', 'Bass', {
  a: {
    table: 'digital',
    pos: .28,
    oct: -1
  },
  extra: {
    fm: 7,
    ratio: 2.01,
    sub: .27
  },
  filter: {
    cutoff: 1300,
    res: 3
  },
  lfo: {
    rate: 2,
    cutoff: 2,
    scanA: .3
  },
  fx: {
    drive: .6
  }
}), P('Analog Sub', 'Bass', {
  a: {
    pos: .33,
    oct: -1
  },
  extra: {
    sub: .5
  },
  filter: {
    cutoff: 700
  },
  amp: {
    a: .01,
    d: .4,
    s: .9,
    r: .15
  }
}), P('Neuro Pulse', 'Bass', {
  a: {
    table: 'spectral',
    pos: .7,
    oct: -1
  },
  b: {
    on: true,
    table: 'pulse',
    pos: .25,
    oct: -1,
    level: .2
  },
  lfo: {
    shape: 'triangle',
    rate: 3.2,
    cutoff: 2.8,
    scanA: .35
  },
  filter: {
    cutoff: 800,
    res: 6
  },
  fx: {
    drive: .55
  }
}), P('Wide Horizon', 'Lead', {
  a: {
    pos: .7,
    unison: 5,
    detune: 20
  },
  b: {
    on: true,
    pos: .7,
    oct: 1,
    level: .17,
    unison: 3,
    detune: 12
  },
  filter: {
    cutoff: 7200
  },
  fx: {
    delay: .18,
    reverb: .2,
    chorus: .16
  }
}), P('Laser Mono', 'Lead', {
  a: {
    table: 'digital',
    pos: .4
  },
  extra: {
    fm: 1.7,
    ratio: 3
  },
  voice: {
    mode: 'mono',
    glide: .09
  },
  lfo: {
    rate: 5.5,
    pitch: 18
  },
  filter: {
    cutoff: 5000
  },
  fx: {
    delay: .22
  }
}), P('Retro Octave', 'Lead', {
  a: {
    pos: 1
  },
  b: {
    on: true,
    pos: .33,
    oct: 1,
    level: .45
  },
  filter: {
    cutoff: 4400,
    res: 2
  },
  lfo: {
    rate: 5,
    pitch: 13
  },
  fx: {
    delay: .15
  }
}), P('Neon Pulse', 'Lead', {
  a: {
    table: 'pulse',
    pos: .35,
    unison: 3,
    detune: 8
  },
  lfo: {
    rate: 3,
    scanA: .3
  },
  filter: {
    cutoff: 4100
  },
  fx: {
    chorus: .3,
    delay: .24
  }
}), P('Chiptune Hero', 'Lead', {
  a: {
    pos: 1
  },
  b: {
    on: true,
    pos: .33,
    oct: 1,
    level: .2
  },
  amp: {
    a: .004,
    d: .15,
    s: .8,
    r: .045
  },
  filter: {
    on: false
  }
}), P('Bright Stab', 'Lead', {
  a: {
    pos: .67,
    unison: 4,
    detune: 13
  },
  filter: {
    cutoff: 2400,
    env: 2
  },
  env: {
    a: .01,
    d: .2,
    s: .1,
    r: .13
  },
  amp: {
    a: .01,
    d: .22,
    s: .45,
    r: .16
  },
  fx: {
    reverb: .2
  }
}), P('Cloud Nine', 'Pad', {
  a: {
    pos: .67,
    unison: 5,
    detune: 20,
    level: .6
  },
  b: {
    on: true,
    table: 'spectral',
    pos: .4,
    unison: 3,
    fine: 8,
    level: .3
  },
  amp: {
    a: 1.3,
    d: 1.5,
    s: .75,
    r: 2.8
  },
  filter: {
    cutoff: 1900
  },
  lfo: {
    rate: .2,
    cutoff: .7,
    pan: .35,
    scanB: .25
  },
  fx: {
    chorus: .4,
    reverb: .56,
    size: .8
  }
}), P('Glass Ocean', 'Pad', {
  a: {
    table: 'spectral',
    pos: .6,
    unison: 3
  },
  b: {
    on: true,
    table: 'digital',
    pos: .4,
    oct: 1,
    level: .18
  },
  amp: {
    a: .75,
    d: 1.3,
    s: .6,
    r: 2.2
  },
  lfo: {
    rate: .33,
    scanA: .32,
    pan: .4
  },
  filter: {
    cutoff: 3900
  },
  fx: {
    reverb: .6,
    delay: .22
  }
}), P('Warm Strings', 'Pad', {
  a: {
    pos: .67,
    unison: 4,
    detune: 13
  },
  b: {
    on: true,
    pos: .67,
    fine: 8,
    level: .35,
    unison: 3
  },
  amp: {
    a: .6,
    d: 1,
    s: .8,
    r: 1.7
  },
  filter: {
    cutoff: 2600
  },
  lfo: {
    rate: 4.8,
    pitch: 7
  },
  fx: {
    chorus: .45,
    reverb: .25
  }
}), P('Frozen Choir', 'Pad', {
  a: {
    table: 'vowel',
    pos: .2,
    unison: 3,
    detune: 10
  },
  b: {
    on: true,
    table: 'vowel',
    pos: .7,
    level: .32,
    unison: 3
  },
  amp: {
    a: .9,
    d: 1,
    s: .8,
    r: 2.4
  },
  lfo: {
    rate: .25,
    scanA: .34,
    scanB: .24
  },
  fx: {
    reverb: .65
  }
}), P('Dark Orbit', 'Pad', {
  a: {
    table: 'spectral',
    pos: .8,
    oct: -1,
    unison: 3
  },
  b: {
    on: true,
    pos: .33,
    level: .28
  },
  amp: {
    a: 1.8,
    d: 2,
    s: .7,
    r: 3
  },
  filter: {
    cutoff: 700,
    res: 2
  },
  lfo: {
    rate: .14,
    cutoff: 1.5
  },
  fx: {
    reverb: .7,
    delay: .25
  }
}), P(NOTE_RUSH_SOUNDS.pluck.label, 'Pluck', NOTE_RUSH_SOUNDS.pluck.patch), P('Crystal Drops', 'Pluck', {
  a: {
    table: 'digital',
    pos: .55
  },
  extra: {
    fm: 1.4,
    ratio: 3
  },
  amp: {
    a: .004,
    d: .45,
    s: 0,
    r: .6
  },
  fx: {
    delay: .38,
    reverb: .35
  }
}), P('House Keys', 'Pluck', {
  a: {
    pos: .67,
    unison: 3,
    detune: 9
  },
  b: {
    on: true,
    pos: .33,
    oct: 1,
    level: .2
  },
  amp: {
    a: .007,
    d: .45,
    s: .15,
    r: .24
  },
  filter: {
    cutoff: 1100,
    env: 2.8
  },
  env: {
    a: .003,
    d: .18,
    s: 0,
    r: .08
  },
  fx: {
    chorus: .18,
    reverb: .17
  }
}), P('Kalimba Sketch', 'Pluck', {
  a: {
    pos: 0
  },
  extra: {
    fm: 1.3,
    ratio: 3.01
  },
  amp: {
    a: .003,
    d: .32,
    s: 0,
    r: .33
  },
  filter: {
    cutoff: 6300
  },
  fx: {
    reverb: .14
  }
}), P('Tiny Mallet', 'Pluck', {
  a: {
    pos: .33
  },
  b: {
    on: true,
    pos: 0,
    oct: 1,
    semi: 7,
    level: .14
  },
  amp: {
    a: .003,
    d: .22,
    s: 0,
    r: .18
  },
  filter: {
    cutoff: 4000
  }
}), P('Electric Keys', 'Keys', {
  a: {
    pos: 0
  },
  extra: {
    fm: 1.15,
    ratio: 1
  },
  b: {
    on: true,
    pos: .33,
    level: .12
  },
  amp: {
    a: .008,
    d: 1.1,
    s: .32,
    r: .4
  },
  fx: {
    chorus: .25,
    reverb: .17
  }
}), P('Drawbar Organ', 'Keys', {
  a: {
    table: 'organ',
    pos: .46
  },
  b: {
    on: true,
    table: 'organ',
    pos: .1,
    oct: 1,
    level: .22
  },
  amp: {
    a: .008,
    d: .1,
    s: 1,
    r: .07
  },
  lfo: {
    rate: 5,
    amp: .12
  },
  fx: {
    chorus: .3
  }
}), P('Soft Piano Sketch', 'Keys', {
  a: {
    table: 'organ',
    pos: .18
  },
  b: {
    on: true,
    pos: .33,
    oct: 1,
    level: .14
  },
  amp: {
    a: .005,
    d: 1.4,
    s: .06,
    r: .5
  },
  filter: {
    cutoff: 2300,
    env: 1.9
  },
  env: {
    a: .004,
    d: .3,
    s: 0,
    r: .2
  },
  fx: {
    reverb: .22
  }
}), P('Digital Clav', 'Keys', {
  a: {
    table: 'pulse',
    pos: .65
  },
  extra: {
    fm: .6,
    ratio: 2
  },
  amp: {
    a: .003,
    d: .24,
    s: .2,
    r: .1
  },
  filter: {
    cutoff: 1500,
    env: 3
  },
  env: {
    a: .003,
    d: .14,
    s: 0,
    r: .1
  },
  fx: {
    drive: .1
  }
}), P('FM Bell', 'Bell', {
  a: {
    pos: 0
  },
  extra: {
    fm: 3.4,
    ratio: 2.76
  },
  amp: {
    a: .003,
    d: 1.65,
    s: 0,
    r: 1.6
  },
  fx: {
    reverb: .4,
    size: .7
  }
}), P('Temple Chime', 'Bell', {
  a: {
    pos: 0
  },
  b: {
    on: true,
    pos: 0,
    oct: 1,
    semi: 7,
    fine: 12,
    level: .2
  },
  extra: {
    fm: 2.6,
    ratio: 1.41
  },
  amp: {
    a: .004,
    d: 2.4,
    s: 0,
    r: 2.2
  },
  fx: {
    reverb: .62,
    size: .8
  }
}), P('Music Box', 'Bell', {
  a: {
    pos: .33
  },
  b: {
    on: true,
    pos: 0,
    oct: 1,
    level: .2
  },
  extra: {
    fm: .85,
    ratio: 3
  },
  amp: {
    a: .003,
    d: .85,
    s: 0,
    r: .95
  },
  fx: {
    reverb: .3
  }
}), P('Kick Body', 'Percussion', {
  a: {
    oct: -2
  },
  amp: {
    a: .002,
    d: .2,
    s: 0,
    r: .07
  },
  filter: {
    cutoff: 550
  },
  fx: {
    drive: .3
  }
}), P('Metal Hit', 'Percussion', {
  a: {
    table: 'digital',
    pos: .76
  },
  extra: {
    fm: 9,
    ratio: 1.73,
    noise: .3
  },
  filter: {
    type: 'highpass',
    cutoff: 1200
  },
  amp: {
    a: .002,
    d: .15,
    s: 0,
    r: .08
  },
  fx: {
    reverb: .14
  }
}), P('Noise Hat', 'Percussion', {
  a: {
    on: false
  },
  extra: {
    noise: .85
  },
  filter: {
    type: 'highpass',
    cutoff: 6600
  },
  amp: {
    a: .002,
    d: .08,
    s: 0,
    r: .04
  }
}), P('Snare Sketch', 'Percussion', {
  a: {
    pos: .33,
    oct: -1,
    level: .3
  },
  extra: {
    noise: .75
  },
  filter: {
    cutoff: 5500,
    env: 1.4
  },
  env: {
    a: .003,
    d: .12,
    s: 0,
    r: .1
  },
  amp: {
    a: .002,
    d: .14,
    s: 0,
    r: .1
  },
  fx: {
    drive: .23
  }
}), P('Space Sweep', 'FX', {
  a: {
    table: 'spectral',
    pos: .6,
    unison: 3
  },
  extra: {
    noise: .4
  },
  amp: {
    a: 1.2,
    d: 1.1,
    s: .65,
    r: 2.5
  },
  lfo: {
    rate: .23,
    cutoff: 3,
    scanA: .45,
    pan: .65
  },
  filter: {
    cutoff: 900,
    res: 6
  },
  fx: {
    reverb: .7,
    delay: .35
  }
}), P('Robot Signal', 'FX', {
  a: {
    table: 'vowel',
    pos: .5
  },
  extra: {
    fm: 4,
    ratio: 2.3
  },
  lfo: {
    shape: 'square',
    rate: 5,
    amp: .7,
    scanA: .35
  },
  filter: {
    cutoff: 2800
  },
  fx: {
    drive: .4
  }
}), P('Wind Tunnel', 'FX', {
  a: {
    on: false
  },
  extra: {
    noise: .65
  },
  filter: {
    type: 'bandpass',
    cutoff: 1000,
    res: 4
  },
  lfo: {
    rate: .25,
    cutoff: 2,
    pan: .5
  },
  amp: {
    a: 1.1,
    d: 1,
    s: .7,
    r: 2
  },
  fx: {
    reverb: .55,
    size: .85
  }
}), P('Alien Transmission', 'FX', {
  a: {
    table: 'digital',
    pos: .8
  },
  b: {
    on: true,
    table: 'spectral',
    pos: .2,
    semi: 7,
    level: .25
  },
  extra: {
    fm: 3,
    ratio: 4.7
  },
  lfo: {
    shape: 'sawtooth',
    rate: 2.3,
    pitch: 85,
    scanA: .4
  },
  fx: {
    delay: .45,
    feedback: .55,
    reverb: .35
  }
}), P('Vocal Morph', 'Experimental', {
  a: {
    table: 'vowel',
    pos: .45,
    unison: 2
  },
  lfo: {
    rate: .7,
    scanA: .48
  },
  filter: {
    cutoff: 4500,
    res: 2
  },
  fx: {
    chorus: .2,
    reverb: .3
  }
}), P('Harmonic Bloom', 'Experimental', {
  a: {
    table: 'organ',
    pos: .9,
    unison: 3
  },
  b: {
    on: true,
    table: 'spectral',
    pos: .3,
    level: .25
  },
  amp: {
    a: .4,
    d: 1,
    s: .7,
    r: 1.5
  },
  lfo: {
    rate: .4,
    scanA: .32,
    scanB: .35
  },
  fx: {
    reverb: .5
  }
}), P('Broken Circuit', 'Experimental', {
  a: {
    table: 'digital',
    pos: .9
  },
  b: {
    on: true,
    table: 'pulse',
    pos: .9,
    level: .3,
    semi: -5
  },
  extra: {
    fm: 6,
    ratio: 2.5
  },
  lfo: {
    shape: 'square',
    rate: 7,
    cutoff: 2,
    scanA: .3
  },
  filter: {
    cutoff: 1800,
    res: 5
  },
  fx: {
    drive: .55,
    delay: .18
  }
})];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function validatePatch(raw) {
  const p = merge(clone(init), raw && typeof raw === 'object' ? raw : {});
  for (const [key, , min, max] of numericControls) {
    const a = key.split('.'),
      k = a.pop(),
      o = a.reduce((x, y) => x[y], p),
      v = +o[k];
    o[k] = Number.isFinite(v) ? clamp(v, min, max) : a.reduce((x, y) => x[y], init)[k];
  }
  for (const k of ['a', 'b']) {
    if (!Object.hasOwn(tables, p[k].table)) p[k].table = 'analog';
    p[k].on = !!p[k].on;
    p[k].unison = Math.round(p[k].unison);
    p[k].oct = Math.round(p[k].oct);
    p[k].semi = Math.round(p[k].semi);
    if (!Array.isArray(p[k].custom) || p[k].custom.length !== 128) p[k].custom = defaultWave();else p[k].custom = p[k].custom.map(x => Number.isFinite(+x) ? clamp(+x, -1, 1) : 0);
  }
  if (!['lowpass', 'highpass', 'bandpass', 'notch', 'peaking'].includes(p.filter.type)) p.filter.type = 'lowpass';
  p.filter.on = !!p.filter.on;
  if (!['sine', 'triangle', 'sawtooth', 'square'].includes(p.lfo.shape)) p.lfo.shape = 'sine';
  if (!['poly', 'mono'].includes(p.voice.mode)) p.voice.mode = 'poly';
  return p;
}

export const USER_PRESETS_KEY = 'form-presets-v1';

export function loadUserPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.flatMap(preset => {
      if (!preset || typeof preset.name !== 'string' || !preset.patch) return [];
      try {
        return [{ name: preset.name.slice(0, 48), cat: 'User', patch: validatePatch(preset.patch) }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

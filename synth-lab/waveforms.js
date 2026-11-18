import { analogSpectrum, HARMONIC_COUNT as NH } from '../src/audio/analogWavetable.ts';

const TAU = 2 * Math.PI;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function lfoValue(phase, shape) {
  const cycle = (phase % 1 + 1) % 1;
  if (shape === 'sine') return Math.sin(TAU * cycle);
  if (shape === 'triangle') return 1 - 4 * Math.abs(cycle - .5);
  if (shape === 'sawtooth') return cycle * 2 - 1;
  return cycle < .5 ? 1 : -1;
}

export function spectrum(kind, pos, custom) {
  if (kind === 'analog') return analogSpectrum(pos);
  const real = new Float32Array(NH + 1),
    imag = new Float32Array(NH + 1);
  pos = clamp(pos, 0, 1);
  for (let n = 1; n <= NH; n++) {
    let x = 0;
    if (kind === 'pulse') {
      let duty = .5 - .42 * pos;
      x = 2 * Math.sin(Math.PI * n * duty) / (Math.PI * n);
    } else if (kind === 'digital') {
      x = Math.sin(n * (.7 + pos * 5.5)) * Math.pow(n, -(.65 + .7 * (1 - pos)));
      if (n === 1) x += .75;
    } else if (kind === 'spectral') {
      x = (.12 + Math.pow(Math.sin(n * (.4 + pos * .9)), 4)) * Math.pow(n, -(1.8 - 1.28 * pos));
      if (n === 1) x += .9;
    } else if (kind === 'organ') {
      const weights = {
        1: 1,
        2: .4,
        3: .55,
        4: .24,
        5: .3,
        6: .16,
        8: .2,
        10: .12,
        12: .1
      };
      x = n === 1 ? 1 : (weights[n] || 0) * pos * 1.4;
    } else if (kind === 'vowel') {
      const f1 = pos < .5 ? 3 + pos * 12 : 9 - (pos - .5) * 12,
        f2 = pos < .5 ? 11 + pos * 15 : 18.5 - (pos - .5) * 25;
      x = (Math.exp(-Math.pow((n - f1) / 1.7, 2)) + .65 * Math.exp(-Math.pow((n - f2) / 3.5, 2)) + .14) / Math.pow(n, .65);
      if (n === 1) x += .22;
    } else if (kind === 'custom') {
      let r = 0,
        s = 0;
      for (let k = 0; k < 128; k++) {
        const a = TAU * n * k / 128;
        r += custom[k] * Math.cos(a);
        s += custom[k] * Math.sin(a);
      }
      real[n] = r / 64 * (1 - pos);
      x = s / 64 * (1 - pos) + (n === 1 ? pos : 0);
    }
    imag[n] = x;
  }
  return {
    real,
    imag
  };
}
export function waveSamples(kind, pos, custom, count = 128) {
  const {
      real,
      imag
    } = spectrum(kind, pos, custom),
    out = [];
  let peak = .0001;
  for (let i = 0; i < count; i++) {
    let y = 0,
      t = TAU * i / count;
    for (let n = 1; n <= NH; n++) y += real[n] * Math.cos(n * t) + imag[n] * Math.sin(n * t);
    out.push(y);
    peak = Math.max(peak, Math.abs(y));
  }
  return out.map(y => y / Math.max(1, peak));
}

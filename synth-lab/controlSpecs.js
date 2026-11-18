export const tables = {
  analog: ['Analog morph', 'Sine → Triangle → Saw → Square'],
  pulse: ['Pulse width', '50% → 8% pulse'],
  digital: ['Digital spectra', 'Bright folded harmonics'],
  spectral: ['Spectral morph', 'Sparse → rich harmonics'],
  vowel: ['Vowel morph', 'Formant A → E → O'],
  organ: ['Drawbar', 'Fundamental → layered partials'],
  custom: ['Custom wave', 'Your drawn waveform']
};
export function oscillatorControls(id) {
  const controls = [['pos', 'Position', 0, 1, .01, 'pct'], ['level', 'Level', 0, 1, .01, 'pct'], ['oct', 'Octave', -3, 3, 1, 'signed'], ['semi', 'Semi', -12, 12, 1, 'signed'], ['fine', 'Fine', -100, 100, 1, 'cent'], ['unison', 'Unison', 1, 5, 1, 'num'], ['detune', 'Spread', 0, 45, 1, 'cent'], ['pan', 'Pan', -1, 1, .01, 'num']];
  return controls.map(([key, ...spec]) => [id + '.' + key, ...spec]);
}

export const envDefs = p => [[p + '.a', 'Attack', .002, 4, .002, 'sec'], [p + '.d', 'Decay', .01, 4, .01, 'sec'], [p + '.s', 'Sustain', 0, 1, .01, 'pct'], [p + '.r', 'Release', .01, 5, .01, 'sec']];

export const filterControls = [['filter.cutoff', 'Cutoff', 30, 18000, 1, 'hz', true], ['filter.res', 'Resonance', .1, 18, .1, 'num'], ['filter.env', 'Env depth', -5, 5, .1, 'oct']];
export const extraControls = [['extra.sub', 'Sub level', 0, 1, .01, 'pct'], ['extra.noise', 'Noise level', 0, 1, .01, 'pct'], ['extra.fm', 'FM index', 0, 12, .05, 'num'], ['extra.ratio', 'FM ratio', .25, 8, .01, 'num']];
export const lfoControls = [['lfo.rate', 'Rate', .05, 30, .01, 'hz', true]];
export const matrixControls = [['lfo.pitch', 'Pitch', -200, 200, 1, 'cent'], ['lfo.cutoff', 'Filter', -4, 4, .05, 'oct'], ['lfo.amp', 'Tremolo', 0, 1, .01, 'pct'], ['lfo.pan', 'Stereo pan', -1, 1, .01, 'num'], ['lfo.scanA', 'OSC A position', -.5, .5, .01, 'num'], ['lfo.scanB', 'OSC B position', -.5, .5, .01, 'num']];
export const fxDefs = [['Drive', 'Harmonic saturation', [['fx.drive', 'Amount', 0, 1, .01, 'pct']]], ['Chorus', 'Modulated stereo delay', [['fx.chorus', 'Mix', 0, .8, .01, 'pct'], ['fx.chorusRate', 'Rate', .05, 5, .01, 'hz', true], ['fx.chorusDepth', 'Depth', .5, 12, .1, 'ms']]], ['Delay', 'Stereo echo', [['fx.delay', 'Mix', 0, .8, .01, 'pct'], ['fx.time', 'Time', .04, 1, .01, 'sec'], ['fx.feedback', 'Feedback', 0, .78, .01, 'pct']]], ['Reverb', 'Synthetic room impulse', [['fx.reverb', 'Mix', 0, .85, .01, 'pct'], ['fx.size', 'Size', .05, 1, .01, 'pct']]]];
export const voiceControls = [['voice.glide', 'Glide', 0, .8, .01, 'sec'], ['voice.master', 'Master', 0, 1, .01, 'pct']];

export const numericControls = [
  ...oscillatorControls('a'),
  ...oscillatorControls('b'),
  ...filterControls,
  ...envDefs('amp'),
  ...envDefs('env'),
  ...extraControls,
  ...lfoControls,
  ...matrixControls,
  ...fxDefs.flatMap(([, , controls]) => controls),
  ...voiceControls,
];

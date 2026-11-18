import { TAU, clone, defaultWave, init, merge, presets } from './patches.js';

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
let userPresets = [];
let patch = clone(init),
  currentName = 'Init Patch',
  currentCat = 'Basic',
  presetIndex = 0,
  dirty = false,
  octave = 3,
  held = false,
  toastTimer;
function get(path) {
  return path.split('.').reduce((a, k) => a[k], patch);
}
function set(path, val) {
  const ks = path.split('.'),
    k = ks.pop(),
    o = ks.reduce((a, b) => a[b], patch);
  o[k] = val;
  dirty = true;
  updateTitle();
  updateAudio(path);
  queueDraw();
}
const def = {};
const units = {
  pct: v => Math.round(v * 100) + '%',
  sec: v => v.toFixed(v < .1 ? 3 : 2) + 's',
  hz: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v) + ' Hz',
  num: v => Number(v.toFixed(2)).toString(),
  signed: v => (v > 0 ? '+' : '') + v,
  cent: v => (v > 0 ? '+' : '') + Math.round(v) + '¢',
  ms: v => v.toFixed(1) + ' ms',
  oct: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' oct'
};
function control(host, path, label, min, max, step, fmt = 'num', log = false) {
  def[path] = {
    min,
    max,
    step,
    fmt,
    log
  };
  const el = document.createElement('div');
  el.className = 'ctrl';
  el.innerHTML = `<label for="ctl-${path}">${label}<output id="out-${path}"></output></label><input id="ctl-${path}" aria-label="${label}" type="range" min="${log ? 0 : min}" max="${log ? 1000 : max}" step="${log ? 1 : step}" data-range="${path}">`;
  host.append(el);
  const input = el.querySelector('input');
  input.addEventListener('input', () => {
    const v = log ? min * Math.pow(max / min, +input.value / 1000) : +input.value;
    set(path, v);
    renderControl(path, false);
  });
  input.addEventListener('dblclick', () => {
    set(path, path.split('.').reduce((a, k) => a[k], init));
    renderControl(path, true);
  });
}
const add = (id, arr) => arr.forEach(x => control($(id), ...x));
const tables = {
  analog: ['Analog morph', 'Sine → Triangle → Saw → Square'],
  pulse: ['Pulse width', '50% → 8% pulse'],
  digital: ['Digital spectra', 'Bright folded harmonics'],
  spectral: ['Spectral morph', 'Sparse → rich harmonics'],
  vowel: ['Vowel morph', 'Formant A → E → O'],
  organ: ['Drawbar', 'Fundamental → layered partials'],
  custom: ['Custom wave', 'Your drawn waveform']
};
for (const id of ['a', 'b']) {
  const el = document.createElement('div');
  el.className = 'panel osc ' + id;
  el.innerHTML = `<div class="panelhead"><h2>OSC ${id.toUpperCase()}</h2><div class="group"><span class="chip" id="uni-${id}">1V</span><button class="power" data-toggle="${id}.on">ON</button></div></div><div class="waveview"><canvas id="wave-${id}" aria-label="Oscillator ${id} waveform; drag to morph"></canvas><span class="wavecap" id="cap-${id}">WAVETABLE</span></div><div class="wavefoot"><select aria-label="Oscillator ${id} wavetable" data-bind="${id}.table">${Object.entries(tables).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select><button data-edit="${id}">EDIT ✎</button></div><div class="controls" id="controls-${id}"></div>`;
  $('oscillators').append(el);
  const arr = [['pos', 'Position', 0, 1, .01, 'pct'], ['level', 'Level', 0, 1, .01, 'pct'], ['oct', 'Octave', -3, 3, 1, 'signed'], ['semi', 'Semi', -12, 12, 1, 'signed'], ['fine', 'Fine', -100, 100, 1, 'cent'], ['unison', 'Unison', 1, 5, 1, 'num'], ['detune', 'Spread', 0, 45, 1, 'cent'], ['pan', 'Pan', -1, 1, .01, 'num']];
  add('controls-' + id, arr.map(([p, ...x]) => [id + '.' + p, ...x]));
}
add('filterControls', [['filter.cutoff', 'Cutoff', 30, 18000, 1, 'hz', true], ['filter.res', 'Resonance', .1, 18, .1, 'num'], ['filter.env', 'Env depth', -5, 5, .1, 'oct']]);
const envDefs = p => [[p + '.a', 'Attack', .002, 4, .002, 'sec'], [p + '.d', 'Decay', .01, 4, .01, 'sec'], [p + '.s', 'Sustain', 0, 1, .01, 'pct'], [p + '.r', 'Release', .01, 5, .01, 'sec']];
add('ampControls', envDefs('amp'));
add('envControls', envDefs('env'));
add('extraControls', [['extra.sub', 'Sub level', 0, 1, .01, 'pct'], ['extra.noise', 'Noise level', 0, 1, .01, 'pct'], ['extra.fm', 'FM index', 0, 12, .05, 'num'], ['extra.ratio', 'FM ratio', .25, 8, .01, 'num']]);
add('lfoControls', [['lfo.rate', 'Rate', .05, 30, .01, 'hz', true]]);
add('matrixControls', [['lfo.pitch', 'Pitch', -200, 200, 1, 'cent'], ['lfo.cutoff', 'Filter', -4, 4, .05, 'oct'], ['lfo.amp', 'Tremolo', 0, 1, .01, 'pct'], ['lfo.pan', 'Stereo pan', -1, 1, .01, 'num'], ['lfo.scanA', 'OSC A position', -.5, .5, .01, 'num'], ['lfo.scanB', 'OSC B position', -.5, .5, .01, 'num']]);
const fxDefs = [['Drive', 'Harmonic saturation', [['fx.drive', 'Amount', 0, 1, .01, 'pct']]], ['Chorus', 'Modulated stereo delay', [['fx.chorus', 'Mix', 0, .8, .01, 'pct'], ['fx.chorusRate', 'Rate', .05, 5, .01, 'hz', true], ['fx.chorusDepth', 'Depth', .5, 12, .1, 'ms']]], ['Delay', 'Stereo echo', [['fx.delay', 'Mix', 0, .8, .01, 'pct'], ['fx.time', 'Time', .04, 1, .01, 'sec'], ['fx.feedback', 'Feedback', 0, .78, .01, 'pct']]], ['Reverb', 'Synthetic room impulse', [['fx.reverb', 'Mix', 0, .85, .01, 'pct'], ['fx.size', 'Size', .05, 1, .01, 'pct']]]];
for (const [i, [name, desc, arr]] of fxDefs.entries()) {
  const p = document.createElement('div');
  p.className = 'panel';
  p.innerHTML = `<div class="panelhead"><h2>${name}</h2><span class="chip">0${i + 1}</span></div><small>${desc}</small><div class="controls two" id="fx${i}"></div>`;
  $('fxPanels').append(p);
  add('fx' + i, arr);
}
add('voiceControls', [['voice.glide', 'Glide', 0, .8, .01, 'sec'], ['voice.master', 'Master', 0, 1, .01, 'pct']]);
function validate(raw) {
  const p = merge(clone(init), raw && typeof raw === 'object' ? raw : {});
  for (const [key, d] of Object.entries(def)) {
    const a = key.split('.'),
      k = a.pop(),
      o = a.reduce((x, y) => x[y], p),
      v = +o[k];
    o[k] = Number.isFinite(v) ? clamp(v, d.min, d.max) : a.reduce((x, y) => x[y], init)[k];
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
function renderControl(path, thumb = true) {
  const d = def[path],
    v = get(path);
  const input = $('ctl-' + path);
  if (thumb) input.value = d.log ? 1000 * Math.log(v / d.min) / Math.log(d.max / d.min) : v;
  input.style.setProperty('--fill', (+input.value - +input.min) / (+input.max - +input.min) * 100 + '%');
  $('out-' + path).textContent = units[d.fmt](v);
}
function updateTitle() {
  $('presetName').textContent = currentName + (dirty ? ' *' : '');
  $('presetCategory').textContent = currentCat + ' · Browse sounds';
}
function sync() {
  Object.keys(def).forEach(p => renderControl(p));
  document.querySelectorAll('[data-bind]').forEach(e => e.value = get(e.dataset.bind));
  document.querySelectorAll('[data-toggle]').forEach(e => {
    const on = get(e.dataset.toggle);
    e.textContent = on ? 'ON' : 'OFF';
    e.classList.toggle('enabled', on);
    e.setAttribute('aria-pressed', on);
  });
  for (const id of ['a', 'b']) {
    $('uni-' + id).textContent = patch[id].unison + 'V';
    $('cap-' + id).textContent = tables[patch[id].table][0].toUpperCase() + ' · ' + Math.round(patch[id].pos * 100) + '%';
  }
  updateTitle();
  queueDraw();
}
document.querySelectorAll('[data-bind]').forEach(e => e.addEventListener('change', () => {
  set(e.dataset.bind, e.value);
  sync();
}));
document.querySelectorAll('[data-toggle]').forEach(e => e.onclick = () => {
  set(e.dataset.toggle, !get(e.dataset.toggle));
  sync();
});
document.querySelectorAll('[data-tab]').forEach(e => e.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b === e));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + e.dataset.tab));
  queueDraw();
});
// Wavetable synthesis. Every frame is a harmonic spectrum; the browser handles band-limiting.
const NH = 64;
function spectrum(kind, pos, custom) {
  const real = new Float32Array(NH + 1),
    imag = new Float32Array(NH + 1);
  pos = clamp(pos, 0, 1);
  const analog = (n, i) => i === 0 ? n === 1 ? 1 : 0 : i === 1 ? n % 2 ? Math.pow(-1, (n - 1) / 2) / (n * n) : 0 : i === 2 ? Math.pow(-1, n + 1) / n : n % 2 ? 1 / n : 0;
  for (let n = 1; n <= NH; n++) {
    let x = 0;
    if (kind === 'analog') {
      let t = pos * 3,
        k = Math.min(2, Math.floor(t)),
        f = t - k;
      x = analog(n, k) * (1 - f) + analog(n, k + 1) * f;
    } else if (kind === 'pulse') {
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
function waveSamples(kind, pos, custom, count = 128) {
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
let ctx,
  master,
  analyser,
  voiceBus,
  drive,
  chorusDry,
  chorusWet,
  chorusDelay,
  chorusLFO,
  chorusDepth,
  delayDry,
  delayWet,
  delayNode,
  feedback,
  reverbDry,
  reverbWet,
  convolver,
  compressor,
  noiseBuffer,
  voices = new Map(),
  activeTails = new Set(),
  lastMonoFreq = null,
  cache = new Map(),
  lastSize = -1,
  lastDrive = -1;
const noteFreq = n => 440 * Math.pow(2, (n - 69) / 12);
const smooth = (param, val, t = .025) => {
  if (ctx && Number.isFinite(val)) param.setTargetAtTime(val, ctx.currentTime, t);
};
function connectMix(input, dry, wet, output) {
  input.connect(dry);
  dry.connect(output);
  wet.connect(output);
}
function impulse(size) {
  const len = Math.floor(ctx.sampleRate * (.2 + size * 3.3)),
    b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let z = 12345 + c * 971;
    for (let i = 0; i < len; i++) {
      z = 1664525 * z + 1013904223 >>> 0;
      d[i] = (z / 4294967296 * 2 - 1) * Math.pow(1 - i / len, 2.2) * (1 - Math.exp(-i / (ctx.sampleRate * .003)));
    }
  }
  return b;
}
async function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw Error('Web Audio is unavailable');
    ctx = new AC({
      latencyHint: 'interactive'
    });
    voiceBus = ctx.createGain();
    voiceBus.gain.value = .34;
    drive = ctx.createWaveShaper();
    drive.oversample = '2x';
    voiceBus.connect(drive);
    let chOut = ctx.createGain();
    chorusDry = ctx.createGain();
    chorusWet = ctx.createGain();
    chorusDelay = ctx.createDelay(.08);
    chorusDelay.delayTime.value = .018;
    chorusLFO = ctx.createOscillator();
    chorusDepth = ctx.createGain();
    chorusLFO.connect(chorusDepth).connect(chorusDelay.delayTime);
    chorusLFO.start();
    drive.connect(chorusDelay);
    chorusDelay.connect(chorusWet);
    connectMix(drive, chorusDry, chorusWet, chOut);
    let delayOut = ctx.createGain();
    delayDry = ctx.createGain();
    delayWet = ctx.createGain();
    delayNode = ctx.createDelay(1.2);
    feedback = ctx.createGain();
    chOut.connect(delayNode);
    delayNode.connect(feedback).connect(delayNode);
    delayNode.connect(delayWet);
    connectMix(chOut, delayDry, delayWet, delayOut);
    let revOut = ctx.createGain();
    reverbDry = ctx.createGain();
    reverbWet = ctx.createGain();
    convolver = ctx.createConvolver();
    delayOut.connect(convolver).connect(reverbWet);
    connectMix(delayOut, reverbDry, reverbWet, revOut);
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    master = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    revOut.connect(compressor).connect(master).connect(analyser).connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    let d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    updateFX(true);
    ctx.onstatechange = () => audioUI();
  }
  if (ctx.state !== 'running') await ctx.resume();
  audioUI();
}
function audioUI() {
  const ok = ctx && ctx.state === 'running';
  $('audioStatus').textContent = ok ? '● AUDIO ON' : '○ AUDIO OFF';
  $('audioStatus').classList.toggle('live', !!ok);
  $('audioStart').textContent = ok ? 'Audio on' : 'Enable audio';
  $('audioStart').classList.toggle('primary', !ok);
}
$('audioStart').onclick = () => ensureAudio().catch(e => toast(e.message));
function updateFX(force = false, path = '') {
  if (!ctx) return;
  const f = patch.fx;
  if (force || lastDrive !== f.drive) {
    const n = 2048,
      curve = new Float32Array(n),
      k = 1 + f.drive * 18,
      den = Math.tanh(k);
    for (let i = 0; i < n; i++) {
      let a = 2 * i / (n - 1) - 1;
      curve[i] = f.drive === 0 ? a : (1 - f.drive) * a + f.drive * Math.tanh(k * a) / den;
    }
    drive.curve = curve;
    lastDrive = f.drive;
  }
  smooth(chorusDry.gain, 1 - f.chorus * .5);
  smooth(chorusWet.gain, f.chorus);
  smooth(chorusLFO.frequency, f.chorusRate);
  smooth(chorusDepth.gain, f.chorusDepth / 1000);
  smooth(delayDry.gain, 1 - f.delay * .3);
  smooth(delayWet.gain, f.delay);
  smooth(delayNode.delayTime, f.time);
  smooth(feedback.gain, f.feedback);
  smooth(reverbDry.gain, 1 - f.reverb * .4);
  smooth(reverbWet.gain, f.reverb);
  if (force || Math.abs(lastSize - f.size) > .035) {
    convolver.buffer = impulse(f.size);
    lastSize = f.size;
  }
  smooth(master.gain, patch.voice.master * .8);
}
function periodic(s, pos = s.pos) {
  const step = Math.round(clamp(pos, 0, 1) * 48),
    key = s.table + ':' + step + ':' + (s.table === 'custom' ? s.custom.join(',') : '');
  if (cache.has(key)) return cache.get(key);
  let sp = spectrum(s.table, step / 48, s.custom),
    w = ctx.createPeriodicWave(sp.real, sp.imag);
  if (cache.size > 400) cache.clear();
  cache.set(key, w);
  return w;
}
function envStart(param, e, t, peak = 1, base = 0) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(base, t);
  param.linearRampToValueAtTime(base + peak, t + e.a);
  param.linearRampToValueAtTime(base + peak * e.s, t + e.a + e.d);
}
function filterEnv(v, start = false) {
  const f = patch.filter,
    e = patch.env,
    t = ctx.currentTime;
  v.filter.type = f.type;
  v.filter.gain.value = 8;
  smooth(v.filter.Q, f.res);
  const base = f.cutoff,
    peak = clamp(base * Math.pow(2, f.env), 25, ctx.sampleRate * .45),
    sus = clamp(base * Math.pow(2, f.env * e.s), 25, ctx.sampleRate * .45);
  if (start) {
    v.filter.frequency.setValueAtTime(base, t);
    v.filter.frequency.exponentialRampToValueAtTime(peak, t + e.a);
    v.filter.frequency.exponentialRampToValueAtTime(sus, t + e.a + e.d);
  } else {
    v.filter.frequency.cancelScheduledValues(t);
    smooth(v.filter.frequency, sus);
  }
  smooth(v.filterDry.gain, f.on ? 0 : 1);
  smooth(v.filterWet.gain, f.on ? 1 : 0);
}
function makeOsc(v, id, oldFreq) {
  const s = patch[id],
    t = ctx.currentTime,
    out = ctx.createGain(),
    pan = ctx.createStereoPanner();
  out.gain.value = s.on ? s.level / Math.sqrt(s.unison) : 0;
  out.connect(pan).connect(v.mix);
  pan.pan.value = s.pan;
  const arr = [],
    fmArr = [];
  for (let i = 0; i < s.unison; i++) {
    let o = ctx.createOscillator(),
      p = ctx.createStereoPanner(),
      g = ctx.createGain(),
      spread = s.unison === 1 ? 0 : i / (s.unison - 1) * 2 - 1,
      f = v.freq * Math.pow(2, s.oct + s.semi / 12);
    o.setPeriodicWave(periodic(s));
    o.frequency.setValueAtTime(oldFreq ? oldFreq * Math.pow(2, s.oct + s.semi / 12) : f, t);
    if (oldFreq && patch.voice.glide > 0) o.frequency.exponentialRampToValueAtTime(f, t + patch.voice.glide);
    o.detune.value = s.fine + spread * s.detune;
    p.pan.value = spread * .7;
    g.gain.value = 1;
    o.connect(p).connect(g).connect(out);
    v.pitchMod.connect(o.detune);
    if (id === 'a') {
      const mod = ctx.createOscillator(),
        depth = ctx.createGain();
      mod.frequency.value = f * patch.extra.ratio;
      depth.gain.value = f * patch.extra.ratio * patch.extra.fm;
      mod.connect(depth).connect(o.frequency);
      mod.start();
      fmArr.push({
        mod,
        depth
      });
      v.sources.push(mod);
    }
    o.start();
    arr.push({
      o,
      p,
      g,
      spread
    });
    v.sources.push(o);
  }
  return {
    id,
    out,
    pan,
    arr,
    fmArr,
    lastPos: -1
  };
}
function createVoice(n, oldFreq = null) {
  let t = ctx.currentTime,
    f = noteFreq(n),
    mix = ctx.createGain(),
    filter = ctx.createBiquadFilter(),
    filterDry = ctx.createGain(),
    filterWet = ctx.createGain(),
    amp = ctx.createGain(),
    trem = ctx.createGain(),
    pan = ctx.createStereoPanner(),
    lfo = ctx.createOscillator(),
    pitchMod = ctx.createGain(),
    cutMod = ctx.createGain(),
    ampMod = ctx.createGain(),
    panMod = ctx.createGain();
  mix.connect(filterDry).connect(amp);
  mix.connect(filter).connect(filterWet).connect(amp);
  amp.connect(trem).connect(pan).connect(voiceBus);
  lfo.connect(pitchMod);
  lfo.connect(cutMod).connect(filter.detune);
  lfo.connect(ampMod).connect(trem.gain);
  lfo.connect(panMod).connect(pan.pan);
  const v = {
    n,
    freq: f,
    mix,
    filter,
    filterDry,
    filterWet,
    amp,
    trem,
    pan,
    lfo,
    pitchMod,
    cutMod,
    ampMod,
    panMod,
    sources: [lfo],
    start: t,
    osc: {},
    released: false
  };
  v.osc.a = makeOsc(v, 'a', oldFreq);
  v.osc.b = makeOsc(v, 'b', oldFreq);
  v.sub = ctx.createOscillator();
  v.sub.type = 'sine';
  v.sub.frequency.value = f / 2;
  v.subGain = ctx.createGain();
  v.subGain.gain.value = patch.extra.sub * .65;
  v.sub.connect(v.subGain).connect(mix);
  v.pitchMod.connect(v.sub.detune);
  v.noise = ctx.createBufferSource();
  v.noise.buffer = noiseBuffer;
  v.noise.loop = true;
  v.noiseGain = ctx.createGain();
  v.noiseGain.gain.value = patch.extra.noise * .45;
  v.noise.connect(v.noiseGain).connect(mix);
  v.sources.push(v.sub, v.noise);
  v.sub.start();
  v.noise.start(0, Math.random());
  lfo.start();
  envStart(amp.gain, patch.amp, t, .85);
  filterEnv(v, true);
  updateMod(v);
  return v;
}
function updateMod(v) {
  const l = patch.lfo;
  v.lfo.type = l.shape;
  smooth(v.lfo.frequency, l.rate);
  smooth(v.pitchMod.gain, l.pitch);
  smooth(v.cutMod.gain, l.cutoff * 1200);
  smooth(v.trem.gain, 1 - l.amp * .5);
  smooth(v.ampMod.gain, l.amp * .5);
  smooth(v.panMod.gain, l.pan);
}
function updateVoiceOsc(v, id, path) {
  const s = patch[id],
    x = v.osc[id];
  smooth(x.out.gain, s.on ? s.level / Math.sqrt(s.unison) : 0);
  smooth(x.pan.pan, s.pan);
  const f = v.freq * Math.pow(2, s.oct + s.semi / 12);
  for (const q of x.arr) {
    if (path.endsWith('.table') || path.endsWith('.pos') || path.endsWith('.custom')) q.o.setPeriodicWave(periodic(s));
    smooth(q.o.frequency, f);
    smooth(q.o.detune, s.fine + q.spread * s.detune);
  }
  for (const q of x.fmArr) {
    smooth(q.mod.frequency, f * patch.extra.ratio);
    smooth(q.depth.gain, f * patch.extra.ratio * patch.extra.fm);
  }
}
function releaseVoice(v, fast = false) {
  if (!v || v.released) return;
  v.released = true;
  activeTails.add(v);
  const t = ctx.currentTime,
    r = fast ? .025 : patch.amp.r;
  const hold = p => {
    if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);else {
      const x = p.value;
      p.cancelScheduledValues(t);
      p.setValueAtTime(x, t);
    }
  };
  hold(v.amp.gain);
  v.amp.gain.linearRampToValueAtTime(0, t + r);
  hold(v.filter.frequency);
  v.filter.frequency.exponentialRampToValueAtTime(Math.max(25, patch.filter.cutoff), t + Math.min(r, patch.env.r));
  for (const s of v.sources) {
    try {
      s.stop(t + r + .04);
    } catch (e) {}
  }
  setTimeout(() => {
    try {
      v.pan.disconnect();
      v.mix.disconnect();
    } catch (e) {}
    activeTails.delete(v);
  }, (r + .09) * 1000);
}
function hardStop(v) {
  if (!v || !ctx) return;
  try {
    v.amp.gain.cancelScheduledValues(ctx.currentTime);
    v.amp.gain.setValueAtTime(0, ctx.currentTime);
    for (const s of v.sources) {
      try {
        s.stop();
      } catch (e) {}
    }
    v.pan.disconnect();
  } catch (e) {}
  activeTails.delete(v);
}
function stopAll() {
  if (ctx) {
    for (const v of voices.values()) hardStop(v);
    for (const v of activeTails) hardStop(v);
    voices.clear();
    activeTails.clear();
    lastMonoFreq = null;
  }
  pointers.clear();
  downKeys.clear();
  latched.clear();
  held = false;
  $('hold').setAttribute('aria-pressed', 'false');
  updateKeys();
  $('noteLabel').textContent = '—';
}
function rebuildVoices() {
  const ns = [...voices.keys()];
  for (const v of voices.values()) releaseVoice(v, true);
  voices.clear();
  for (const n of ns.slice(-12)) {
    voices.set(n, createVoice(n));
  }
}
function updateAudio(path) {
  if (!ctx) return;
  if (path.startsWith('fx.') || path === 'voice.master') {
    updateFX(false, path);
    return;
  }
  if (path === 'a.unison' || path === 'b.unison') {
    rebuildVoices();
    return;
  }
  if (path === 'voice.mode') {
    stopAll();
    return;
  }
  for (const v of voices.values()) {
    if (path.startsWith('a.') || path.startsWith('b.')) updateVoiceOsc(v, path[0], path);
    if (path.startsWith('filter.') || path.startsWith('env.')) filterEnv(v);
    if (path.startsWith('lfo.')) updateMod(v);
    if (path.startsWith('extra.')) {
      smooth(v.subGain.gain, patch.extra.sub * .65);
      smooth(v.noiseGain.gain, patch.extra.noise * .45);
      updateVoiceOsc(v, 'a', path);
    }
  }
}
function lfoVal(t, shape) {
  let a = (t % 1 + 1) % 1;
  return shape === 'sine' ? Math.sin(TAU * a) : shape === 'triangle' ? 1 - 4 * Math.abs(a - .5) : shape === 'sawtooth' ? a * 2 - 1 : a < .5 ? 1 : -1;
}
setInterval(() => {
  if (!ctx || ctx.state !== 'running') return;
  const l = patch.lfo;
  if (!l.scanA && !l.scanB) return;
  for (const v of voices.values()) {
    let a = lfoVal((ctx.currentTime - v.start) * l.rate, l.shape);
    for (const [id, depth] of [['a', l.scanA], ['b', l.scanB]]) {
      if (!depth) continue;
      let s = patch[id],
        x = v.osc[id],
        pos = clamp(s.pos + a * depth, 0, 1),
        step = Math.round(pos * 48);
      if (step !== x.lastPos) {
        x.lastPos = step;
        const w = periodic(s, pos);
        for (const q of x.arr) q.o.setPeriodicWave(w);
      }
    }
  }
}, 45);
async function noteOn(n) {
  if (voices.has(n)) return;
  try {
    await ensureAudio();
    if (!isWanted(n) || voices.has(n)) return;
    if (patch.voice.mode === 'mono') {
      for (const v of voices.values()) releaseVoice(v, true);
      voices.clear();
    } else if (voices.size >= 12) {
      let oldest = voices.keys().next().value;
      releaseVoice(voices.get(oldest), true);
      voices.delete(oldest);
    }
    while (activeTails.size >= 16) hardStop(activeTails.values().next().value);
    const old = patch.voice.mode === 'mono' ? lastMonoFreq : null;
    const v = createVoice(n, old);
    voices.set(n, v);
    lastMonoFreq = v.freq;
    $('noteLabel').textContent = noteName(n);
    updateKeys();
  } catch (e) {
    toast('Audio error: ' + e.message);
  }
}
function noteOff(n) {
  if (isWanted(n)) return;
  const v = voices.get(n);
  if (v) {
    releaseVoice(v);
    voices.delete(n);
  }
  if (patch.voice.mode === 'mono' && !voices.size) {
    const other = [...pointers.values(), ...downKeys.values(), ...latched].filter(x => x !== n).pop();
    if (other !== undefined) noteOn(other);
  }
  if (!voices.size) $('noteLabel').textContent = '—';
  updateKeys();
}
const pointers = new Map(),
  downKeys = new Map(),
  latched = new Set(),
  names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const noteName = n => names[n % 12] + (Math.floor(n / 12) - 1),
  baseNote = () => 12 * (octave + 1);
function isWanted(n) {
  return [...pointers.values(), ...downKeys.values()].includes(n) || latched.has(n);
}
function updateKeys() {
  document.querySelectorAll('.key').forEach(k => k.classList.toggle('active', voices.has(+k.dataset.note) || isWanted(+k.dataset.note)));
}
function buildKeys() {
  let k = $('keys');
  k.replaceChildren();
  const whites = [0, 2, 4, 5, 7, 9, 11],
    blacks = [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]];
  for (let o = 0; o < 2; o++) {
    for (const i of whites) {
      const n = baseNote() + o * 12 + i,
        b = document.createElement('button');
      b.className = 'key white';
      b.dataset.note = n;
      b.textContent = i === 0 ? noteName(n) : names[i];
      b.setAttribute('aria-label', noteName(n));
      k.append(b);
    }
    for (const [i, p] of blacks) {
      const n = baseNote() + o * 12 + i,
        b = document.createElement('button');
      b.className = 'key black';
      b.dataset.note = n;
      b.style.left = (o * 7 + p) / 14 * 100 - 2.3 + '%';
      b.textContent = names[i];
      b.setAttribute('aria-label', noteName(n));
      k.append(b);
    }
  }
  $('octLabel').textContent = 'C' + octave + '–B' + (octave + 1);
}
function keyAt(x, y) {
  return document.elementFromPoint(x, y)?.closest('.key');
}
function pointerNote(e, start = false) {
  const k = keyAt(e.clientX, e.clientY),
    n = k ? +k.dataset.note : undefined,
    old = pointers.get(e.pointerId);
  if (old === n) return;
  if (old !== undefined) {
    pointers.delete(e.pointerId);
    noteOff(old);
  }
  if (n !== undefined) {
    pointers.set(e.pointerId, n);
    if (held) {
      if (start && latched.has(n)) {
        latched.delete(n);
        pointers.delete(e.pointerId);
        noteOff(n);
        return;
      }
      latched.add(n);
    }
    noteOn(n);
  }
  updateKeys();
}
$('keys').addEventListener('pointerdown', e => {
  e.preventDefault();
  $('keys').setPointerCapture(e.pointerId);
  pointerNote(e, true);
});
$('keys').addEventListener('pointermove', e => {
  if ($('keys').hasPointerCapture(e.pointerId)) pointerNote(e);
});
function endPointer(e) {
  const n = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (n !== undefined) noteOff(n);
}
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) $('keys').addEventListener(ev, endPointer);
const keyMap = {
  z: 0,
  s: 1,
  x: 2,
  d: 3,
  c: 4,
  v: 5,
  g: 6,
  b: 7,
  h: 8,
  n: 9,
  j: 10,
  m: 11,
  q: 12,
  '2': 13,
  w: 14,
  '3': 15,
  e: 16,
  r: 17,
  '5': 18,
  t: 19,
  '6': 20,
  y: 21,
  '7': 22,
  u: 23
};
window.addEventListener('keydown', e => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.querySelector('.overlay[open]')) return;
  const i = keyMap[e.key.toLowerCase()];
  if (i === undefined) return;
  e.preventDefault();
  const n = baseNote() + i;
  downKeys.set(e.code, n);
  if (held) latched.add(n);
  noteOn(n);
  updateKeys();
});
window.addEventListener('keyup', e => {
  let n = downKeys.get(e.code);
  downKeys.delete(e.code);
  if (n !== undefined) noteOff(n);
});
$('keys').addEventListener('click', e => {
  if (e.detail !== 0 || !e.target.matches('.key')) return;
  let n = +e.target.dataset.note;
  latched.add(n);
  noteOn(n);
  setTimeout(() => {
    latched.delete(n);
    noteOff(n);
  }, 300);
});
$('hold').onclick = () => {
  held = !held;
  $('hold').setAttribute('aria-pressed', held);
  if (!held) {
    let old = [...latched];
    latched.clear();
    old.forEach(noteOff);
  }
};
for (const [id, d] of [['octDown', -1], ['octUp', 1]]) $(id).onclick = () => {
  stopAll();
  octave = clamp(octave + d, 1, 6);
  buildKeys();
};
$('panic').onclick = () => {
  stopAll();
  toast('All notes stopped');
};
window.addEventListener('blur', stopAll);
window.addEventListener('pagehide', () => {
  stopAll();
  if (ctx?.state === 'running') void ctx.suspend().catch(() => {});
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAll();
});
// Visual editors and preset library.
const canvases = ['wave-a', 'wave-b', 'filterGraph', 'ampGraph', 'filterEnvGraph', 'lfoGraph'];
let drawQueued = false;
function canvas(id) {
  const c = $(id),
    r = c.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const d = Math.min(devicePixelRatio || 1, 2);
  if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) {
    c.width = Math.round(r.width * d);
    c.height = Math.round(r.height * d);
  }
  const g = c.getContext('2d');
  g.setTransform(d, 0, 0, d, 0, 0);
  return {
    g,
    w: r.width,
    h: r.height
  };
}
function grid(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.lineWidth = 1;
  g.strokeStyle = '#2b2b31';
  g.beginPath();
  for (let i = 1; i < 8; i++) {
    g.moveTo(i * w / 8, 0);
    g.lineTo(i * w / 8, h);
  }
  for (let i = 1; i < 4; i++) {
    g.moveTo(0, i * h / 4);
    g.lineTo(w, i * h / 4);
  }
  g.stroke();
}
function plot(id, arr, color, stack = false) {
  const c = canvas(id);
  if (!c) return;
  const {
    g,
    w,
    h
  } = c;
  grid(g, w, h);
  const draw = (values, dy, alpha, scale) => {
    g.beginPath();
    g.globalAlpha = alpha;
    g.strokeStyle = color;
    g.lineWidth = alpha === 1 ? 1.8 : 1;
    values.forEach((v, i) => {
      const x = 5 + i / (values.length - 1) * (w - 10),
        y = h * .53 - v * h * scale + dy;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.stroke();
    g.globalAlpha = 1;
  };
  if (stack) {
    draw(arr, -12, .12, .25);
    draw(arr, -6, .25, .28);
  }
  draw(arr, 0, 1, .36);
}
function envPoints(e, w, h) {
  let l = 12,
    r = w - 12,
    t = 11,
    b = h - 12,
    usable = r - l;
  return [[l, b], [l + usable * .33 * e.a / 4, t], [l + usable * .33 * e.a / 4 + usable * .26 * e.d / 4, t + (b - t) * (1 - e.s)], [l + usable * .72, t + (b - t) * (1 - e.s)], [l + usable * (.72 + .28 * e.r / 5), b]];
}
function drawEnv(id, e, color) {
  let c = canvas(id);
  if (!c) return;
  const {
    g,
    w,
    h
  } = c;
  grid(g, w, h);
  let pts = envPoints(e, w, h);
  g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.lineTo(pts[0][0], pts[0][1]);
  g.closePath();
  g.fillStyle = color + '19';
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 1.6;
  g.stroke();
  for (let i = 1; i < pts.length; i++) {
    g.beginPath();
    g.arc(...pts[i], 3.6, 0, TAU);
    g.fillStyle = color;
    g.fill();
  }
}
function drawFilter() {
  let c = canvas('filterGraph');
  if (!c) return;
  const {
    g,
    w,
    h
  } = c;
  grid(g, w, h);
  let f = patch.filter,
    pts = [];
  for (let i = 0; i <= w; i += 2) {
    const hz = 25 * Math.pow(800, i / w),
      x = hz / f.cutoff,
      A = 1 - x * x,
      B = x / Math.max(.1, f.res),
      den = Math.sqrt(A * A + B * B);
    let mag = f.type === 'lowpass' ? 1 / den : f.type === 'highpass' ? x * x / den : f.type === 'bandpass' ? B / den : f.type === 'notch' ? Math.abs(A) / den : Math.sqrt(A * A + Math.pow(B * 2.5, 2)) / den;
    let db = f.on ? 20 * Math.log10(Math.max(.001, mag)) : 0;
    pts.push([i, clamp(h * .32 - db * h / 55, 3, h - 3)]);
  }
  g.beginPath();
  g.moveTo(0, h);
  for (const [x, y] of pts) g.lineTo(x, y);
  g.lineTo(w, h);
  g.closePath();
  g.fillStyle = '#ffb00017';
  g.fill();
  g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.strokeStyle = '#ffb000';
  g.lineWidth = 1.7;
  g.stroke();
  let x = Math.log(f.cutoff / 25) / Math.log(800) * w;
  g.strokeStyle = '#ffb00070';
  g.setLineDash([3, 4]);
  g.beginPath();
  g.moveTo(x, 0);
  g.lineTo(x, h);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#a4a4ad';
  g.font = '9px system-ui';
  g.fillText('25 Hz', 5, h - 4);
  g.fillText('20 kHz', w - 33, h - 4);
}
function redraw() {
  drawQueued = false;
  for (const id of ['a', 'b']) {
    const s = patch[id];
    if ($('wave-' + id).offsetWidth) plot('wave-' + id, waveSamples(s.table, s.pos, s.custom), id === 'a' ? '#ffb000' : '#71a7ff', true);
    $('cap-' + id).textContent = tables[s.table][0].toUpperCase() + ' · ' + Math.round(s.pos * 100) + '%';
    $('uni-' + id).textContent = s.unison + 'V';
  }
  drawEnv('ampGraph', patch.amp, '#ffb000');
  drawEnv('filterEnvGraph', patch.env, '#71a7ff');
  drawFilter();
  plot('lfoGraph', Array.from({
    length: 128
  }, (_, i) => lfoVal(i / 127, patch.lfo.shape)), '#71a7ff');
}
function queueDraw() {
  if (!drawQueued) {
    drawQueued = true;
    requestAnimationFrame(redraw);
  }
}
window.addEventListener('resize', queueDraw);
function dragCanvas(id, fn, begin) {
  const c = $(id);
  let active = null;
  c.addEventListener('pointerdown', e => {
    e.preventDefault();
    active = e.pointerId;
    c.setPointerCapture(active);
    const r = c.getBoundingClientRect();
    begin?.(e.clientX - r.left, e.clientY - r.top, r);
    fn(e.clientX - r.left, e.clientY - r.top, r, true);
  });
  c.addEventListener('pointermove', e => {
    if (active !== e.pointerId) return;
    const r = c.getBoundingClientRect();
    fn(e.clientX - r.left, e.clientY - r.top, r, false);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) c.addEventListener(type, () => {
    active = null;
  });
}
for (const id of ['a', 'b']) dragCanvas('wave-' + id, (x, y, r) => {
  set(id + '.pos', clamp(x / r.width, 0, 1));
  renderControl(id + '.pos');
});
dragCanvas('filterGraph', (x, y, r) => {
  set('filter.cutoff', clamp(25 * Math.pow(800, clamp(x / r.width, 0, 1)), 30, 18000));
  set('filter.res', clamp(Math.pow(18, 1 - clamp(y / r.height, 0, 1)) * .6, .1, 18));
  renderControl('filter.cutoff');
  renderControl('filter.res');
});
for (const [id, p] of [['ampGraph', 'amp'], ['filterEnvGraph', 'env']]) {
  let point = 1;
  dragCanvas(id, (x, y, r) => {
    const e = patch[p],
      u = r.width - 24,
      l = 12;
    let v, path;
    if (point === 1) {
      path = p + '.a';
      v = clamp((x - l) / (u * .33) * 4, .002, 4);
    } else if (point === 2) {
      path = p + '.d';
      v = clamp((x - l - u * .33 * e.a / 4) / (u * .26) * 4, .01, 4);
      set(p + '.s', clamp(1 - (y - 11) / (r.height - 23), 0, 1));
      renderControl(p + '.s');
    } else if (point === 3) {
      path = p + '.s';
      v = clamp(1 - (y - 11) / (r.height - 23), 0, 1);
    } else {
      path = p + '.r';
      v = clamp(((x - l) / u - .72) / .28 * 5, .01, 5);
    }
    set(path, v);
    renderControl(path);
  }, (x, y, r) => {
    const pts = envPoints(patch[p], r.width, r.height);
    point = [1, 2, 3, 4].reduce((a, i) => Math.hypot(x - pts[i][0], y - pts[i][1]) < Math.hypot(x - pts[a][0], y - pts[a][1]) ? i : a, 1);
  });
}
let waveEdit = 'a',
  waveData = defaultWave(),
  lastDraw = null;
function showWaveEditor(id) {
  waveEdit = id;
  waveData = patch[id].table === 'custom' ? clone(patch[id].custom) : waveSamples(patch[id].table, patch[id].pos, patch[id].custom);
  $('waveTitle').textContent = 'Oscillator ' + id.toUpperCase();
  openModal('waveModal');
  requestAnimationFrame(drawEditor);
}
document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => showWaveEditor(b.dataset.edit));
function harmonicValues(samples) {
  let out = [];
  for (let n = 1; n <= 16; n++) {
    let s = 0,
      c = 0;
    for (let i = 0; i < 128; i++) {
      s += samples[i] * Math.sin(TAU * n * i / 128);
      c += samples[i] * Math.cos(TAU * n * i / 128);
    }
    out.push(clamp(Math.hypot(s, c) / 64, 0, 1));
  }
  return out;
}
function fromHarmonics() {
  let h = [...$('harmonics').querySelectorAll('input')].map(x => +x.value);
  let a = Array.from({
      length: 128
    }, (_, i) => h.reduce((s, v, j) => s + v * Math.sin(TAU * (j + 1) * i / 128), 0)),
    peak = Math.max(1, ...a.map(Math.abs));
  waveData = a.map(x => x / peak);
  plot('drawWave', waveData, '#ffb000');
}
for (let i = 0; i < 16; i++) {
  let inp = document.createElement('input');
  inp.type = 'range';
  inp.min = 0;
  inp.max = 1;
  inp.step = .01;
  inp.value = i ? 0 : 1;
  inp.setAttribute('aria-label', 'Harmonic ' + (i + 1));
  inp.title = 'Harmonic ' + (i + 1);
  inp.addEventListener('input', fromHarmonics);
  $('harmonics').append(inp);
}
function drawEditor() {
  plot('drawWave', waveData, '#ffb000');
  const a = harmonicValues(waveData);
  [...$('harmonics').children].forEach((el, i) => el.value = a[i]);
}
dragCanvas('drawWave', (x, y, r, first) => {
  let i = Math.round(clamp(x / r.width, 0, 1) * 127),
    v = clamp((r.height * .53 - y) / (r.height * .36), -1, 1);
  if (first || !lastDraw) {
    waveData[i] = v;
  } else {
    let [j, z] = lastDraw;
    for (let k = Math.min(i, j); k <= Math.max(i, j); k++) waveData[k] = i === j ? v : z + (v - z) * (k - j) / (i - j);
  }
  lastDraw = [i, v];
  drawEditor();
}, () => lastDraw = null);
$('waveSine').onclick = () => {
  waveData = defaultWave();
  drawEditor();
};
$('waveSaw').onclick = () => {
  waveData = Array.from({
    length: 128
  }, (_, i) => i / 64 - 1);
  drawEditor();
};
$('waveClear').onclick = () => {
  waveData = Array(128).fill(0);
  drawEditor();
};
$('waveRandom').onclick = () => {
  [...$('harmonics').children].forEach((x, i) => x.value = i === 0 ? .9 : Math.random() / (i + 1) ** .75);
  fromHarmonics();
};
$('applyWave').onclick = () => {
  set(waveEdit + '.custom', clone(waveData));
  set(waveEdit + '.table', 'custom');
  set(waveEdit + '.pos', 0);
  cache.clear();
  updateAudio(waveEdit + '.custom');
  sync();
  closeModal('waveModal');
  toast('Custom waveform applied');
};
function openModal(id) {
  const dialog = $(id);
  if (!dialog.open) dialog.showModal();
}
function closeModal(id) {
  $(id).close();
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => {
  if (e.target === o) closeModal(o.id);
}));
function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2400);
}
function bank() {
  return [...presets, ...userPresets];
}
let category = 'All';
function populateLibrary() {
  const cats = ['All', ...new Set(bank().map(p => p.cat))];
  $('cats').replaceChildren();
  for (const c of cats) {
    let b = document.createElement('button');
    b.textContent = c;
    b.classList.toggle('on', c === category);
    b.onclick = () => {
      category = c;
      populateLibrary();
    };
    $('cats').append(b);
  }
  let list = $('presetList');
  list.replaceChildren();
  const q = $('search').value.toLowerCase();
  bank().forEach((p, i) => {
    if (category !== 'All' && p.cat !== category || !(p.name + ' ' + p.cat).toLowerCase().includes(q)) return;
    let b = document.createElement('button'),
      s = document.createElement('strong'),
      sm = document.createElement('small');
    s.textContent = p.name;
    sm.textContent = p.cat;
    b.className = 'presetitem' + (i === presetIndex && !dirty ? ' selected' : '');
    b.append(s, sm);
    b.onclick = () => {
      loadPreset(i);
      closeModal('presetModal');
    };
    list.append(b);
  });
  if (!list.children.length) {
    let p = document.createElement('p');
    p.className = 'notes';
    p.textContent = 'No matching presets.';
    list.append(p);
  }
}
function loadPreset(i) {
  let p = bank()[i];
  if (!p) return;
  stopAll();
  patch = validate(p.patch);
  currentName = p.name;
  currentCat = p.cat;
  presetIndex = i;
  dirty = false;
  sync();
  if (ctx) updateFX(true);
  toast(p.name);
}
$('openPresets').onclick = () => {
  category = 'All';
  $('search').value = '';
  populateLibrary();
  openModal('presetModal');
};
$('search').oninput = populateLibrary;
$('prev').onclick = () => loadPreset((presetIndex - 1 + bank().length) % bank().length);
$('next').onclick = () => loadPreset((presetIndex + 1) % bank().length);
$('init').onclick = () => loadPreset(0);
$('libraryInit').onclick = () => {
  loadPreset(0);
  closeModal('presetModal');
};
$('save').onclick = () => {
  $('saveName').value = dirty ? currentName + ' Edit' : currentName;
  openModal('saveModal');
  $('saveName').focus();
};
$('saveConfirm').onclick = () => {
  let name = $('saveName').value.trim();
  if (!name) return;
  const existing = userPresets.findIndex(p => p.name === name),
    p = {
      name,
      cat: 'User',
      patch: clone(patch)
    };
  if (existing >= 0) userPresets[existing] = p;else userPresets.push(p);
  try {
    localStorage.setItem('form-presets-v1', JSON.stringify(userPresets));
  } catch (e) {
    toast('Saved for this session only — storage unavailable');
  }
  currentName = name;
  currentCat = 'User';
  presetIndex = presets.length + (existing >= 0 ? existing : userPresets.length - 1);
  dirty = false;
  updateTitle();
  closeModal('saveModal');
  toast('Preset saved');
};
function exportPatch() {
  const p = {
      format: 'FORM Synth Patch',
      version: 1,
      name: currentName,
      patch
    },
    blob = new Blob([JSON.stringify(p, null, 2)], {
      type: 'application/json'
    }),
    u = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = u;
  a.download = (currentName.replace(/[^a-z0-9_-]/gi, '_') || 'form-patch') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
$('export').onclick = $('libraryExport').onclick = exportPatch;
$('import').onclick = () => $('file').click();
$('file').onchange = async () => {
  try {
    let f = $('file').files[0];
    if (!f) return;
    if (f.size > 1e6) throw Error('Patch file is too large');
    let p = JSON.parse(await f.text());
    if (!p.patch || typeof p.patch !== 'object' || Array.isArray(p.patch)) throw Error('Invalid patch file');
    let imported = validate(p.patch);
    stopAll();
    patch = imported;
    currentName = String(p.name || 'Imported patch').slice(0, 48);
    currentCat = 'User';
    dirty = true;
    sync();
    if (ctx) updateFX(true);
    toast('Patch imported');
  } catch (e) {
    toast(e.message);
  }
  $('file').value = '';
};
$('randomize').onclick = () => {
  stopAll();
  let s = clone(init),
    r = Math.random,
    types = Object.keys(tables).filter(x => x !== 'custom');
  s.a.table = types[Math.floor(r() * types.length)];
  s.a.pos = r();
  s.a.unison = 1 + Math.floor(r() * 3);
  s.a.detune = r() * 20;
  s.b.on = r() > .4;
  s.b.table = types[Math.floor(r() * types.length)];
  s.b.pos = r();
  s.b.level = .2 + r() * .3;
  s.b.oct = [-1, 0, 1][Math.floor(r() * 3)];
  s.filter.cutoff = 200 * Math.pow(50, r());
  s.filter.res = .3 + r() * 5;
  s.filter.env = r() * 2;
  s.extra.fm = r() > .6 ? r() * 2 : 0;
  s.amp.a = .005 + r() * .45;
  s.amp.r = .12 + r() * .9;
  s.lfo.rate = .2 + r() * 4;
  s.lfo.scanA = r() * .3;
  s.fx.reverb = r() * .4;
  s.fx.delay = r() * .25;
  patch = s;
  currentName = 'Random patch';
  currentCat = 'Experimental';
  dirty = true;
  sync();
  if (ctx) updateFX(true);
  toast('Random patch generated');
};
// Restore user presets after controls and wavetable metadata exist.
try {
  const saved = JSON.parse(localStorage.getItem('form-presets-v1') || '[]');
  if (Array.isArray(saved)) userPresets = saved.filter(x => x && typeof x.name === 'string' && x.patch).map(x => ({
    name: x.name.slice(0, 48),
    cat: 'User',
    patch: validate(x.patch)
  }));
} catch (e) {}
const scope = $('scope').getContext('2d'),
  samples = new Float32Array(1024);
function meterLoop() {
  requestAnimationFrame(meterLoop);
  if (!ctx || ctx.state !== 'running') return;
  analyser.getFloatTimeDomainData(samples);
  let rms = 0;
  for (const x of samples) rms += x * x;
  rms = Math.sqrt(rms / samples.length);
  $('meterFill').style.width = clamp(rms * 300, 0, 100) + '%';
  scope.clearRect(0, 0, 120, 38);
  scope.strokeStyle = '#ffb000';
  scope.lineWidth = 1.5;
  scope.beginPath();
  for (let i = 0; i < 120; i++) {
    let y = 19 - clamp(samples[i * 4] * 45, -18, 18);
    i ? scope.lineTo(i, y) : scope.moveTo(i, y);
  }
  scope.stroke();
}
buildKeys();
sync();
meterLoop();

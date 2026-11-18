import "../src/pwa/register";
import { TAU, clone, defaultWave, init, loadUserPresets, presets, USER_PRESETS_KEY, validatePatch } from './patches.js';
import { envDefs, extraControls, filterControls, fxDefs, lfoControls, matrixControls, oscillatorControls, tables, voiceControls } from './controlSpecs.js';
import { lfoValue, waveSamples } from './waveforms.js';
import { createSynthVoiceEngine } from './voiceEngine.js';

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
let userPresets = loadUserPresets();
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
  if (path.startsWith('amp.')) updateAmpBehavior();
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
for (const id of ['a', 'b']) {
  const el = document.createElement('div');
  el.className = 'panel osc ' + id;
  el.innerHTML = `<div class="panelhead"><h2>OSC ${id.toUpperCase()}</h2><div class="group"><span class="chip" id="uni-${id}">1V</span><button class="power" data-toggle="${id}.on">ON</button></div></div><div class="waveview"><canvas id="wave-${id}" aria-label="Oscillator ${id} waveform; drag to morph"></canvas><span class="wavecap" id="cap-${id}">WAVETABLE</span></div><div class="wavefoot"><select aria-label="Oscillator ${id} wavetable" data-bind="${id}.table">${Object.entries(tables).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select><button data-edit="${id}">EDIT ✎</button></div><div class="controls" id="controls-${id}"></div>`;
  $('oscillators').append(el);
  add('controls-' + id, oscillatorControls(id));
}
add('filterControls', filterControls);
add('ampControls', envDefs('amp'));
add('envControls', envDefs('env'));
add('extraControls', extraControls);
add('lfoControls', lfoControls);
add('matrixControls', matrixControls);
for (const [i, [name, desc, arr]] of fxDefs.entries()) {
  const p = document.createElement('div');
  p.className = 'panel';
  p.innerHTML = `<div class="panelhead"><h2>${name}</h2><span class="chip">0${i + 1}</span></div><small>${desc}</small><div class="controls two" id="fx${i}"></div>`;
  $('fxPanels').append(p);
  add('fx' + i, arr);
}
add('voiceControls', voiceControls);
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
function updateAmpBehavior() {
  const { a, d, s } = patch.amp;
  $('ampBehavior').textContent = s === 0
    ? 'Fades in ' + units.sec(a + d) + ' even while held'
    : 'Sustains at ' + units.pct(s) + ' while held';
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
  updateAmpBehavior();
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
let ctx;
let engine;

async function ensureAudio() {
  if (!ctx) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw Error('Web Audio is unavailable');
    ctx = new Audio({ latencyHint: 'interactive' });
    engine = createSynthVoiceEngine(ctx, patch, ctx.destination, { meter: true });
    ctx.onstatechange = audioUI;
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
function stopAll() {
  engine?.stopAll();
  pointers.clear();
  downKeys.clear();
  latched.clear();
  held = false;
  $('hold').setAttribute('aria-pressed', 'false');
  updateKeys();
  $('noteLabel').textContent = '—';
}

function updateAudio(path) {
  if (path === 'voice.mode') stopAll();
  else engine?.updateAudio(path);
}

async function noteOn(note) {
  if (engine?.hasVoice(note)) return;
  try {
    await ensureAudio();
    if (!isWanted(note) || engine.hasVoice(note)) return;
    engine.press(note);
    $('noteLabel').textContent = noteName(note);
    updateKeys();
  } catch (error) {
    toast('Audio error: ' + error.message);
  }
}

function noteOff(note) {
  if (isWanted(note)) return;
  engine?.lift(note);
  if (patch.voice.mode === 'mono' && !engine?.hasVoices()) {
    const other = [...pointers.values(), ...downKeys.values(), ...latched].filter(value => value !== note).pop();
    if (other !== undefined) noteOn(other);
  }
  if (!engine?.hasVoices()) $('noteLabel').textContent = '—';
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
  document.querySelectorAll('.key').forEach(k => k.classList.toggle('active', engine?.hasVoice(+k.dataset.note) || isWanted(+k.dataset.note)));
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
  }, (_, i) => lfoValue(i / 127, patch.lfo.shape)), '#71a7ff');
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
  engine?.clearWaveCache();
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
    sm.textContent = p.cat + ' · ' + (p.patch.amp.s > 0 ? 'Sustains' : 'Fades while held');
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
  patch = validatePatch(p.patch);
  currentName = p.name;
  currentCat = p.cat;
  presetIndex = i;
  dirty = false;
  sync();
  engine?.setPatch(patch);
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
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
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
    let imported = validatePatch(p.patch);
    stopAll();
    patch = imported;
    currentName = String(p.name || 'Imported patch').slice(0, 48);
    currentCat = 'User';
    dirty = true;
    sync();
    engine?.setPatch(patch);
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
  engine?.setPatch(patch);
  toast('Random patch generated');
};
const scope = $('scope').getContext('2d'),
  samples = new Float32Array(1024);
function meterLoop() {
  requestAnimationFrame(meterLoop);
  if (!ctx || ctx.state !== 'running') return;
  engine.analyser.getFloatTimeDomainData(samples);
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

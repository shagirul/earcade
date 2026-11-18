import { lfoValue, spectrum } from './waveforms.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const impulseBuffers = new WeakMap();
const noiseBuffers = new WeakMap();

function noiseFor(ctx) {
  if (noiseBuffers.has(ctx)) return noiseBuffers.get(ctx);
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

function impulseFor(ctx, size) {
  if (!impulseBuffers.has(ctx)) impulseBuffers.set(ctx, new Map());
  const buffers = impulseBuffers.get(ctx);
  if (buffers.has(size)) return buffers.get(size);
  if (buffers.size >= 8) buffers.delete(buffers.keys().next().value);
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
  buffers.set(size, b);
  return b;
}

export function createSynthVoiceEngine(ctx, initialPatch, destination, { meter = false } = {}) {
  let patch = initialPatch;
  let master,
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
    lastDrive = -1,
    fxInitialized = false;
  const noteFreq = n => 440 * Math.pow(2, (n - 69) / 12);
  const smooth = (param, val, t = .025) => {
    if (ctx && Number.isFinite(val)) param.setTargetAtTime(val, ctx.currentTime, t);
  };
  function connectMix(input, dry, wet, output) {
    input.connect(dry);
    dry.connect(output);
    wet.connect(output);
  }
  function updateFX(force = false) {
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
    const apply = fxInitialized
      ? smooth
      : (param, value) => param.setValueAtTime(value, ctx.currentTime);
    apply(chorusDry.gain, 1 - f.chorus * .5);
    apply(chorusWet.gain, f.chorus);
    apply(chorusLFO.frequency, f.chorusRate);
    apply(chorusDepth.gain, f.chorusDepth / 1000);
    apply(delayDry.gain, 1 - f.delay * .3);
    apply(delayWet.gain, f.delay);
    apply(delayNode.delayTime, f.time);
    apply(feedback.gain, f.feedback);
    apply(reverbDry.gain, 1 - f.reverb * .4);
    apply(reverbWet.gain, f.reverb);
    if (f.reverb > 0 && (force || Math.abs(lastSize - f.size) > .035)) {
      convolver.buffer = impulseFor(ctx, f.size);
      lastSize = f.size;
    }
    apply(master.gain, patch.voice.master * .8);
    fxInitialized = true;
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
    for (const voice of voices.values()) hardStop(voice);
    for (const voice of activeTails) hardStop(voice);
    voices.clear();
    activeTails.clear();
    lastMonoFreq = null;
    updateScan();
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
      updateFX();
      return;
    }
    if (path === 'a.unison' || path === 'b.unison') {
      rebuildVoices();
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
    if (path.startsWith('lfo.')) updateScan();
  }
  let scanTimer;
  function scanVoices() {
    if (!ctx || ctx.state !== 'running') return;
    const l = patch.lfo;
    if (!l.scanA && !l.scanB) return;
    for (const v of voices.values()) {
      let a = lfoValue((ctx.currentTime - v.start) * l.rate, l.shape);
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
  }
  function updateScan() {
    const shouldScan = voices.size && (patch.lfo.scanA || patch.lfo.scanB);
    if (shouldScan && scanTimer === undefined) {
      scanTimer = setInterval(scanVoices, 45);
    } else if (!shouldScan && scanTimer !== undefined) {
      clearInterval(scanTimer);
      scanTimer = undefined;
    }
  }
  function press(note) {
    if (voices.has(note)) return;
    if (patch.voice.mode === 'mono') {
      for (const voice of voices.values()) releaseVoice(voice, true);
      voices.clear();
    } else if (voices.size >= 12) {
      const oldest = voices.keys().next().value;
      releaseVoice(voices.get(oldest), true);
      voices.delete(oldest);
    }
    while (activeTails.size >= 16) hardStop(activeTails.values().next().value);
    const oldFrequency = patch.voice.mode === 'mono' ? lastMonoFreq : null;
    const voice = createVoice(note, oldFrequency);
    voices.set(note, voice);
    lastMonoFreq = voice.freq;
    updateScan();
    return voice;
  }
  function lift(note) {
    const voice = voices.get(note);
    if (voice) {
      releaseVoice(voice);
      voices.delete(note);
    }
    updateScan();
  }
  function setPatch(nextPatch) {
    stopAll();
    patch = nextPatch;
    updateFX(true);
  }
  function scheduleCue(note, hold) {
    const voice = press(note);
    if (!voice) throw new Error("Note is already playing");
    const { a, d, s, r } = patch.amp;
    const keyUp = voice.start + hold;
    const release = s === 0 && hold >= a + d ? 0 : r;
    const level = hold < a
      ? .85 * hold / a
      : .85 * (1 - (1 - s) * Math.min(1, (hold - a) / d));
    voice.amp.gain.cancelScheduledValues(keyUp);
    voice.amp.gain.linearRampToValueAtTime(level, keyUp);
    if (release) voice.amp.gain.linearRampToValueAtTime(0, keyUp + release);
    for (const source of voice.sources) source.stop(keyUp + release + .04);
    return voice.start;
  }
  function dispose() {
    stopAll();
    chorusLFO.stop();
    for (const node of [
      chorusLFO, voiceBus, drive, chorusDry, chorusWet, chorusDelay, chorusDepth,
      delayDry, delayWet, delayNode, feedback, reverbDry, reverbWet, convolver,
      chOut, delayOut, revOut, compressor, master, analyser,
    ]) node?.disconnect();
  }
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
  if (meter) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
  }
  revOut.connect(compressor).connect(master).connect(analyser || destination);
  if (analyser) analyser.connect(destination);
  noiseBuffer = noiseFor(ctx);
  updateFX(true);

  return {
    analyser,
    press,
    lift,
    stopAll,
    hasVoice: note => voices.has(note),
    hasVoices: () => voices.size > 0,
    updateAudio,
    setPatch,
    clearWaveCache: () => cache.clear(),
    scheduleCue,
    dispose,
  };
}

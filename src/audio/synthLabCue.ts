import type { SynthLabPatch } from "../../synth-lab/patches.js";
import { createSynthVoiceEngine } from "../../synth-lab/voiceEngine.js";

export function planSynthLabCue(patch: SynthLabPatch, holdSeconds: number) {
  const { amp, fx } = patch;
  const sustains = amp.s > 0;
  const hold = sustains ? holdSeconds : amp.a + amp.d;
  const release = sustains ? amp.r : 0;
  const echoes = fx.feedback > 0 ? 1 + Math.floor(Math.log(.01) / Math.log(fx.feedback)) : 1;
  const tail = Math.min(
    3,
    (fx.chorus > 0 ? .018 + fx.chorusDepth / 1000 : 0)
      + (fx.delay > 0 ? echoes * fx.time : 0)
      + (fx.reverb > 0 ? .2 + fx.size * 3.3 : 0),
  );

  return { hold, duration: hold + release + tail };
}

export function playSynthLabCue(
  context: AudioContext,
  output: AudioNode,
  midi: number,
  patch: SynthLabPatch,
  holdSeconds: number,
  onStart: (startedAt: number, duration: number) => void,
) {
  const { hold, duration } = planSynthLabCue(patch, holdSeconds);
  const gate = context.createGain();
  gate.gain.value = 0;
  gate.connect(output);
  const engine = createSynthVoiceEngine(context, patch, gate);
  const startedAt = engine.scheduleCue(midi, hold);
  const endsAt = startedAt + duration;
  gate.gain.setValueAtTime(1, startedAt);
  gate.gain.setValueAtTime(1, endsAt - Math.min(.025, duration / 2));
  gate.gain.linearRampToValueAtTime(0, endsAt);

  const endMarker = context.createConstantSource();
  let stopped = false;
  function dispose() {
    gate.disconnect();
    engine.dispose();
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    endMarker.onended = null;
    endMarker.stop();
    if (context.currentTime >= endsAt || context.state !== "running") {
      dispose();
      return;
    }
    const now = context.currentTime;
    if (typeof gate.gain.cancelAndHoldAtTime === "function") {
      gate.gain.cancelAndHoldAtTime(now);
    } else {
      const level = gate.gain.value;
      gate.gain.cancelScheduledValues(now);
      gate.gain.setValueAtTime(level, now);
    }
    gate.gain.linearRampToValueAtTime(0, now + .012);
    window.setTimeout(dispose, 20);
  }

  endMarker.onended = stop;
  endMarker.start(startedAt);
  endMarker.stop(endsAt);
  onStart(startedAt, duration);
  return stop;
}

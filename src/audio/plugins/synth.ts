import type { SoundEvent, SoundPlugin } from "../types";
import { playSynthLabCue } from "../synthLabCue";

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const PIANO_PARTIALS = [
  [1, 0.27, 0.75],
  [2, 0.075, 0.45],
  [3, 0.045, 0.32],
  [4, 0.025, 0.19],
  [5, 0.012, 0.13],
];
const PIANO_STOP_MARGIN = 0.025;
export const PIANO_CUE_SECONDS = Math.max(...PIANO_PARTIALS.map(([, , decay]) => decay)) + PIANO_STOP_MARGIN;

function playPiano(ctx: AudioContext, master: GainNode, midi: number, at: number) {
  const frequency = midiToFreq(midi);
  const voices = new Set<OscillatorNode>();

  for (const [harmonic, volume, decay] of PIANO_PARTIALS) {
    const voice = ctx.createOscillator();
    const gain = ctx.createGain();
    voice.frequency.value = frequency * harmonic;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    voice.connect(gain);
    gain.connect(master);
    voices.add(voice);
    voice.onended = () => {
      voices.delete(voice);
      voice.disconnect();
      gain.disconnect();
    };
    voice.start(at);
    voice.stop(at + decay + PIANO_STOP_MARGIN);
  }

  return () => {
    for (const voice of voices) voice.stop();
    voices.clear();
  };
}

export const SynthPlugin: SoundPlugin = {
  id: "synth",
  label: "Basic Synth",
  handles: ["note", "interval", "feedback", "synth-lab-cue"],
  init() {
    // no-op (stateless)
  },
  play(ctx, master, event: SoundEvent) {
    if (event.type === "synth-lab-cue") {
      return playSynthLabCue(ctx, master, event.midi, event.patch, event.holdSeconds, event.onStart);
    }
    const at = event.at ?? ctx.currentTime;

    if (event.type === "feedback") {
      const midi = event.kind === "success" ? 84 : 48;
      const dur = event.kind === "success" ? 0.08 : 0.24;
      const wave: OscillatorType = event.kind === "success" ? "sine" : "sawtooth";
      return SynthPlugin.play(ctx, master, { type: "note", midi, duration: dur, wave, at });
    }

    if (event.type === "interval") {
      const duration = event.duration ?? 0.8;
      const wave = event.wave ?? "triangle";
      const rootAt = at;
      const secondAt = at + duration * 0.8;
      SynthPlugin.play(ctx, master, { type: "note", midi: event.rootMidi, duration, wave, at: rootAt });
      SynthPlugin.play(ctx, master, { type: "note", midi: event.rootMidi + event.semitones, duration, wave, at: secondAt });
      return;
    }

    if (event.type === "note") {
      if (event.timbre === "piano") {
        return playPiano(ctx, master, event.midi, at);
      }
      const duration = event.duration ?? 0.5;
      const wave = event.wave ?? "triangle";

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(midiToFreq(event.midi), at);

      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.4, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, at + duration);

      osc.connect(gain);
      gain.connect(master);

      osc.start(at);
      osc.stop(at + duration);
    }
  },
};

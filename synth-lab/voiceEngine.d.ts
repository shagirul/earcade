import type { SynthLabPatch } from "./patches.js";

export function createSynthVoiceEngine(
  context: AudioContext,
  patch: SynthLabPatch,
  output: AudioNode,
): {
  scheduleCue(note: number, hold: number): number;
  dispose(): void;
};

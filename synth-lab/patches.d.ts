export interface SynthLabPatch {
  amp: { a: number; d: number; s: number; r: number };
  fx: {
    chorus: number;
    chorusDepth: number;
    delay: number;
    time: number;
    feedback: number;
    reverb: number;
    size: number;
  };
}

export interface SynthLabPreset {
  name: string;
  cat: string;
  patch: SynthLabPatch;
}

export const presets: SynthLabPreset[];
export function loadUserPresets(): SynthLabPreset[];

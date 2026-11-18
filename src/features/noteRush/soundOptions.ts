import { loadUserPresets, presets, type SynthLabPatch } from "../../../synth-lab/patches.js";
import { NOTE_RUSH_SOUNDS } from "../../audio/noteRushSounds";

export type RushSound = { id: string; label: string; group: string; patch?: SynthLabPatch };

export const PIANO_SOUND: RushSound = { id: "piano", label: NOTE_RUSH_SOUNDS.piano.label, group: "Piano" };
export const DEFAULT_HOLD_SECONDS = 2.5;
export const HOLD_CHOICES = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];
export const TIMED_SOUND_IDS = new Set(["piano", "sine", "triangle", "pluck"]);

const basicSoundIds = new Map<string, string>([
  [NOTE_RUSH_SOUNDS.sine.label, "sine"],
  [NOTE_RUSH_SOUNDS.triangle.label, "triangle"],
  [NOTE_RUSH_SOUNDS.pluck.label, "pluck"],
]);

export function loadRushSounds(): RushSound[] {
  return [
    PIANO_SOUND,
    ...presets.map(({ name, cat, patch }) => ({
      id: basicSoundIds.get(name) ?? "factory:" + name,
      label: name,
      group: cat,
      patch,
    })),
    ...loadUserPresets().map(({ name, patch }) => ({
      id: "user:" + name,
      label: name,
      group: "Your presets",
      patch,
    })),
  ];
}

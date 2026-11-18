import { Activity } from "lucide-react";
import type { RhythmTrack, StageConfig } from "./types";
// import { Clock, Music } from "lucide-react";
// import type { IntervalKey } from "./types";

export const RHYTHM_TRACKS: RhythmTrack[] = [
  { id: "kick",  label: "Kick",  pillClass: "bg-red-500/10 text-red-400 border-red-500/20",      cellOnClass: "bg-red-500 border-white/20" },
  { id: "snare", label: "Snare", pillClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",   cellOnClass: "bg-blue-500 border-white/20" },
  { id: "hihat", label: "Hi‑Hat",pillClass: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20", cellOnClass: "bg-yellow-500 border-white/20" },
  { id: "clap",  label: "Clap",  pillClass: "bg-purple-500/10 text-purple-300 border-purple-500/20", cellOnClass: "bg-purple-500 border-white/20" },
];

export const PIANO_OCTAVE = [
  { midi: 0,  label: "C",  isBlack: false },
  { midi: 1,  label: "C#", isBlack: true },
  { midi: 2,  label: "D",  isBlack: false },
  { midi: 3,  label: "D#", isBlack: true },
  { midi: 4,  label: "E",  isBlack: false },
  { midi: 5,  label: "F",  isBlack: false },
  { midi: 6,  label: "F#", isBlack: true },
  { midi: 7,  label: "G",  isBlack: false },
  { midi: 8,  label: "G#", isBlack: true },
  { midi: 9,  label: "A",  isBlack: false },
  { midi: 10, label: "A#", isBlack: true },
  { midi: 11, label: "B",  isBlack: false },
] as const;

/*
const intervalDefs: Record<IntervalKey, { label: string; semitones: number }> = {
  m2: { label: "Minor 2nd", semitones: 1 },
  M2: { label: "Major 2nd", semitones: 2 },
  m3: { label: "Minor 3rd", semitones: 3 },
  M3: { label: "Major 3rd", semitones: 4 },
  P5: { label: "Perfect 5th", semitones: 7 },
};
*/

export const KEY_SENSE: StageConfig = {
  id: "keys",
  title: "Key Sense",
  desc: "Match the pitch to the right piano key",
  icon: Activity,
  theme: { accent: "accentA", accentHex: "#10b981" },
  levels: [],
};

export const STAGES: StageConfig[] = [
  KEY_SENSE,
  /* Rhythm Arcade and Interval Lab are paused while Key Sense runs Note Rush.
  {
    id: "rhythm",
    title: "Rhythm Arcade",
    desc: "Multi-track drum sequence master",
    icon: Clock,
    theme: { accent: "accentB", accentHex: "#f97316" },
    levels: Array.from({ length: 20 }, (_, i) => ({
      kind: "rhythm" as const,
      index: i + 1,
      bpm: 100 + i * 2,
      tracksEnabled: i < 3 ? 1 : i < 7 ? 2 : i < 12 ? 3 : 4,
      steps: 8,
      count: 5,
    })),
  },
  {
    id: "intervals",
    title: "Interval Lab",
    desc: "Identify the distance between notes",
    icon: Music,
    theme: { accent: "brand", accentHex: "#3b82f6" },
    intervals: intervalDefs,
    levels: Array.from({ length: 20 }, (_, i) => ({
      kind: "intervals" as const,
      index: i + 1,
      choices: (i < 5 ? (["M2", "m3"] as const) : (["m2", "M2", "m3", "M3", "P5"] as const)) as unknown as IntervalKey[],
      rootRange: [60, 72],
      count: 10,
    })),
  },
  */
];

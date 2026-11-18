import type { LucideIcon } from "lucide-react";

export type StageId = "keys" | "rhythm" | "intervals";

export type StageTheme = {
  accent: "accentA" | "accentB" | "brand";
  accentHex: string;
};

export type KeysLevelSpec = {
  kind: "keys";
  index: number;
  possibleNotes: number[];
  count: number;
  octaveMidi: number; // base MIDI for octave root (e.g. 60 = middle C)
};

export type RhythmLevelSpec = {
  kind: "rhythm";
  index: number;
  bpm: number;
  tracksEnabled: number; // 1..4
  steps: number; // 8
  count: number; // questions per level
};

export type IntervalKey = "m2" | "M2" | "m3" | "M3" | "P5";
export type IntervalDef = { label: string; semitones: number };

export type IntervalsLevelSpec = {
  kind: "intervals";
  index: number;
  choices: IntervalKey[];
  rootRange: [number, number]; // inclusive min, exclusive max
  count: number;
};

export type LevelSpec = KeysLevelSpec | RhythmLevelSpec | IntervalsLevelSpec;

export type StageConfig = {
  id: StageId;
  title: string;
  desc: string;
  icon: LucideIcon;
  theme: StageTheme;
  levels: LevelSpec[];
  intervals?: Record<IntervalKey, IntervalDef>;
};

export type RhythmTrackId = "kick" | "snare" | "hihat" | "clap";

export type RhythmTrack = {
  id: RhythmTrackId;
  label: string;
  pillClass: string; // static Tailwind (no runtime interpolation)
  cellOnClass: string;
};

export type RhythmGrid = Record<RhythmTrackId, boolean[]>;

export type Question =
  | { kind: "keys"; correct: number; octaveMidi: number }
  | { kind: "rhythm"; correct: RhythmGrid }
  | { kind: "intervals"; correct: IntervalKey; rootMidi: number };

export type SessionResult = Question & {
  userAnswer: unknown;
  isCorrect: boolean;
};

export type UserProgress = {
  xp: number;
  streak: number;
  unlocked: Record<StageId, number>; // next playable level number (1..20)
};

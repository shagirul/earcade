export type SoundEvent =
  | { type: "note"; midi: number; duration?: number; wave?: OscillatorType; timbre?: "piano"; at?: number }
  | { type: "interval"; rootMidi: number; semitones: number; duration?: number; wave?: OscillatorType; at?: number }
  | { type: "drum"; drum: "kick" | "snare" | "hihat" | "clap"; at?: number }
  | { type: "tick"; high?: boolean; at?: number }
  | { type: "feedback"; kind: "success" | "fail"; at?: number };

export type SoundPlugin = {
  id: string;
  label: string;
  handles: SoundEvent["type"][];
  init(ctx: AudioContext, master: GainNode): void;
  play(ctx: AudioContext, master: GainNode, event: SoundEvent): void | (() => void);
};

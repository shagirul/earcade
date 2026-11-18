import { AudioEngine } from "./engine";
import { SynthPlugin } from "./plugins/synth";
import { DrumPlugin } from "./plugins/drums";
import { TickPlugin } from "./plugins/tick";

export const audio = new AudioEngine(0.3);

// Register plugins (future-ready)
audio.register(SynthPlugin);
audio.register(DrumPlugin);
audio.register(TickPlugin);

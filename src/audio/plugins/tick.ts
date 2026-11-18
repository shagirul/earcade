import type { SoundEvent, SoundPlugin } from "../types";

export const TickPlugin: SoundPlugin = {
  id: "tick",
  label: "Metronome",
  handles: ["tick"],
  init() {},
  play(ctx, master, event: SoundEvent) {
    if (event.type !== "tick") return;
    const at = event.at ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(event.high ? 1000 : 500, at);

    gain.gain.setValueAtTime(0.02, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.01);

    osc.connect(gain);
    gain.connect(master);

    osc.start(at);
    osc.stop(at + 0.01);
  },
};

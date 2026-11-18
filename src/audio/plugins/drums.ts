import type { SoundEvent, SoundPlugin } from "../types";

// Simple drum synths (kick/snare/hihat/clap), isolated for future plugin swaps.
export const DrumPlugin: SoundPlugin = {
  id: "drums",
  label: "Drum Kit",
  handles: ["drum"],
  init() {},
  play(ctx, master, event: SoundEvent) {
    if (event.type !== "drum") return;
    const at = event.at ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (event.drum) {
      case "kick": {
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, at);
        osc.frequency.exponentialRampToValueAtTime(0.01, at + 0.3);
        gain.gain.setValueAtTime(1, at);
        gain.gain.exponentialRampToValueAtTime(0.01, at + 0.3);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + 0.3);
        return;
      }
      case "snare": {
        const bufferSize = Math.floor(ctx.sampleRate * 0.1);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, at);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, at + 0.1);

        noise.connect(noiseGain);
        noiseGain.connect(master);

        noise.start(at);
        noise.stop(at + 0.11);
        return;
      }
      case "hihat": {
        osc.type = "square";
        osc.frequency.setValueAtTime(10000, at);
        gain.gain.setValueAtTime(0.12, at);
        gain.gain.exponentialRampToValueAtTime(0.01, at + 0.05);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + 0.05);
        return;
      }
      case "clap": {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, at);
        gain.gain.setValueAtTime(0.2, at);
        gain.gain.exponentialRampToValueAtTime(0.01, at + 0.03);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + 0.03);
        return;
      }
    }
  },
};

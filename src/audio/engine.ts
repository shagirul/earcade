import type { SoundEvent, SoundPlugin } from "./types";

/**
 * Plugin-based audio engine.
 * - Keeps sound generators in isolated plugins (future: more instruments)
 * - Lazily creates/resumes AudioContext on first user gesture
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private plugins: SoundPlugin[] = [];
  private handlers = new Map<SoundEvent["type"], SoundPlugin>();

  constructor(private defaultGain = 0.3) {}

  register(plugin: SoundPlugin) {
    this.plugins.push(plugin);
    for (const t of plugin.handles) this.handlers.set(t, plugin);
    // If engine already started, init immediately
    if (this.ctx && this.master) plugin.init(this.ctx, this.master);
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  async unlock() {
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.defaultGain;
      this.master.connect(this.ctx.destination);
      for (const p of this.plugins) p.init(this.ctx, this.master);
    }
    if (this.ctx.state !== "running") {
      try { await this.ctx.resume(); } catch { return false; }
    }
    return this.ctx.state === "running";
  }

  async play(event: SoundEvent) {
    if (this.handlers.has(event.type) && await this.unlock()) {
      this.playUnlocked(event);
    }
  }

  playUnlocked(event: SoundEvent) {
    if (this.ctx?.state !== "running" || !this.master) return;
    return this.handlers.get(event.type)?.play(this.ctx, this.master, event);
  }
}

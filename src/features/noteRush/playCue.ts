import { audio } from "../../audio";
import { PIANO_CUE_SECONDS } from "../../audio/plugins/synth";
import type { RushSound } from "./soundOptions";

export type CuePlayback = { startedAt: number; duration: number };

function soundNote(offset: number, sound: RushSound | undefined, holdSeconds: number, at = audio.currentTime) {
  const midi = 60 + offset;
  let timing: CuePlayback = { startedAt: at, duration: PIANO_CUE_SECONDS };
  const stop = sound?.patch
    ? audio.playUnlocked({ type: "synth-lab-cue", midi, patch: sound.patch, holdSeconds,
        onStart: (startedAt, duration) => { timing = { startedAt, duration }; } })
    : audio.playUnlocked({ type: "note", midi, timbre: "piano", at: timing.startedAt });
  if (!stop) throw new Error("Audio is unavailable");
  return { ...timing, stop };
}

export function playRushCue(target: number, sound: RushSound | undefined, holdSeconds: number,
  show: (cue: CuePlayback) => void, pair?: {
    root: number;
    releaseReference: () => void;
    ready: () => void;
    failed: () => void;
  }) {
  const first = soundNote(pair?.root ?? target, sound, holdSeconds);
  if (!pair) {
    if (sound) show(first);
    return first.stop;
  }
  const { releaseReference, ready, failed } = pair;
  const { startedAt, duration } = first;
  const secondAt = startedAt + duration + 0.12;
  show({ startedAt, duration: secondAt - startedAt + duration });
  let frame = 0;
  // Piano supports native scheduling. Live synth patches create their voice at note-on.
  let second = sound?.patch ? undefined : soundNote(target, sound, holdSeconds, secondAt);
  let referenceDown = true;
  function tick() {
    const now = audio.currentTime;
    if (referenceDown && now >= startedAt + duration) {
      referenceDown = false;
      releaseReference();
    }
    if (!second && now >= secondAt) {
      first.stop();
      try {
        second = soundNote(target, sound, holdSeconds);
      } catch {
        failed();
        return;
      }
      show({ startedAt, duration: second.startedAt - startedAt + second.duration });
    }
    if (second && now >= second.startedAt + second.duration) {
      ready();
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    first.stop();
    second?.stop();
  };
}

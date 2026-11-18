import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { audio } from "../../audio";
import { PIANO_CUE_SECONDS } from "../../audio/plugins/synth";
import { PIANO_OCTAVE } from "../../game/stages";
import { loadJson, saveJson } from "../../lib/storage";
import { DEFAULT_HOLD_SECONDS, HOLD_CHOICES, loadRushSounds, PIANO_SOUND, TIMED_SOUND_IDS, type RushSound } from "./soundOptions";

export const ROUND_SECONDS = 30;
const BONUS_SECONDS = 30;
const WRONG_PENALTY = 2;
const FEEDBACK_MS = 650;
const BEST_KEY = "earcade_note_rush_best";
const PRACTICE_SOUND_KEY = "earcade_note_rush_practice_sound";
const HOLD_SECONDS_KEY = "earcade_note_rush_hold_seconds";
const OCTAVE_MIDI = 60;

export function loadNoteRushBest() {
  return loadJson(BEST_KEY, 0);
}

type Feedback = { picked: number; timeDelta: number; nextAt: number };
export type CuePlayback = { startedAt: number; duration: number };
type ActiveNote = {
  phase: "active";
  target: number;
  sound: RushSound;
  feedback?: Feedback;
};
type TimedRound = ActiveNote & {
  mode: "timed";
  deadline: number;
  playedAt: number;
  score: number;
  attempts: number;
  totalCorrectMs: number;
  bonusRemaining: number;
  confirmingExit: boolean;
};
type ActiveRound = TimedRound | (ActiveNote & { mode: "endless" });

type Round =
  | { phase: "ready" }
  | ActiveRound
  | {
      phase: "finished";
      score: number;
      attempts: number;
      totalCorrectMs: number;
      personalBest: boolean;
    };

function pickNote(previous: number | null = null) {
  const noteCount = PIANO_OCTAVE.length;
  if (previous === null) return Math.floor(Math.random() * noteCount);
  const index = Math.floor(Math.random() * (noteCount - 1));
  return index < previous ? index : index + 1;
}

function loadHoldSeconds() {
  const saved = loadJson(HOLD_SECONDS_KEY, DEFAULT_HOLD_SECONDS);
  return HOLD_CHOICES.includes(saved) ? saved : DEFAULT_HOLD_SECONDS;
}

export function useNoteRush(
  canPlay: boolean,
  onComplete: (score: number, attempts: number) => void,
) {
  const [round, setRound] = useState<Round>({ phase: "ready" });
  const currentRound = useRef(round);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(loadNoteRushBest);
  const [sounds] = useState(loadRushSounds);
  const [holdSeconds, setHoldSeconds] = useState(loadHoldSeconds);
  const holdRef = useRef(holdSeconds);
  const practiceSound = useRef<RushSound>();
  const lastTimedSound = useRef<string>();
  const [cue, setCue] = useState<CuePlayback>();
  const [starting, setStarting] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [warmupPress, setWarmupPress] = useState<{ note: number }>();
  const audioRequest = useRef(0);
  const startPending = useRef(false);
  const stopVoice = useRef<() => void>();
  const pausedAt = useRef<number>();

  function update(next: Round) {
    currentRound.current = next;
    setRound(next);
  }

  function stopCue() {
    stopVoice.current?.();
    stopVoice.current = undefined;
    setCue(undefined);
  }

  function playNote(note: number, sound?: RushSound) {
    stopCue();
    const midi = OCTAVE_MIDI + note;
    try {
      if (sound?.patch) {
        stopVoice.current = audio.playUnlocked({
          type: "synth-lab-cue",
          midi,
          patch: sound.patch,
          holdSeconds: holdRef.current,
          onStart: (startedAt, duration) => setCue({ startedAt, duration }),
        }) ?? undefined;
      } else {
        const startedAt = audio.currentTime;
        stopVoice.current = audio.playUnlocked({ type: "note", midi, timbre: "piano", at: startedAt }) ?? undefined;
        if (sound && stopVoice.current) setCue({ startedAt, duration: PIANO_CUE_SECONDS });
      }
    } catch {
      setAudioError(true);
    }
  }

  function finish(active: TimedRound) {
    stopCue();
    setSeconds(0);
    const { score, attempts, totalCorrectMs } = active;
    const personalBest = score > best;
    if (personalBest) {
      setBest(score);
      saveJson(BEST_KEY, score);
    }
    update({ phase: "finished", score, attempts, totalCorrectMs, personalBest });
    onComplete(score, attempts);
  }

  function getActiveRound(now = performance.now()) {
    if (pausedAt.current !== undefined) return;
    const active = currentRound.current;
    if (active.phase !== "active") return;
    // Let the final answer's feedback finish before opening the results.
    if (active.mode === "timed" && now >= active.deadline && now >= (active.feedback?.nextAt ?? active.deadline)) {
      finish(active);
      return;
    }
    return active;
  }

  function nextNote(active: ActiveRound, now: number) {
    const target = pickNote(active.target);
    playNote(target, active.sound);
    const next = { ...active, target, feedback: undefined };
    update(next.mode === "timed" ? { ...next, playedAt: now } : next);
  }

  const timed = round.phase === "active" && round.mode === "timed";
  const practiceFeedback = round.phase === "active" && round.mode === "endless" ? round.feedback : undefined;

  useEffect(() => {
    if (!canPlay || !timed) return;
    let frame: number;

    function tick() {
      const now = performance.now();
      const active = getActiveRound(now);
      if (active?.mode !== "timed") return;
      setSeconds(Math.max(0, Math.ceil((active.deadline - now) / 1000)));
      if (!active.confirmingExit && active.feedback && now >= active.feedback.nextAt) {
        nextNote(active, now);
      }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [canPlay, timed, best, onComplete]);

  useEffect(() => {
    if (!canPlay || !practiceFeedback) return;
    const timeout = window.setTimeout(() => {
      const active = getActiveRound();
      if (active?.mode === "endless" && active.feedback === practiceFeedback) {
        nextNote(active, performance.now());
      }
    }, Math.max(0, practiceFeedback.nextAt - performance.now()));
    return () => window.clearTimeout(timeout);
  }, [canPlay, practiceFeedback]);

  useLayoutEffect(() => {
    if (!canPlay) {
      pausedAt.current = performance.now();
      audioRequest.current++;
      stopCue();
      startPending.current = false;
      setStarting(false);
      setWarmupPress(undefined);
      return;
    }

    if (pausedAt.current === undefined) return;
    const pausedFor = performance.now() - pausedAt.current;
    pausedAt.current = undefined;
    const active = currentRound.current;
    if (active.phase !== "active") return;

    const resumed = {
      ...active,
      feedback: active.feedback && {
        ...active.feedback,
        nextAt: active.feedback.nextAt + pausedFor,
      },
    };
    update(resumed.mode === "timed" ? {
      ...resumed,
      deadline: resumed.deadline + pausedFor,
      playedAt: resumed.playedAt + pausedFor,
    } : resumed);
    void replay();
  }, [canPlay]);

  useEffect(() => {
    if (!warmupPress) return;
    const timeout = window.setTimeout(() => setWarmupPress(undefined), 140);
    return () => window.clearTimeout(timeout);
  }, [warmupPress]);

  useEffect(() => () => {
    audioRequest.current++;
    stopVoice.current?.();
  }, []);

  async function startRound(mode: ActiveRound["mode"]) {
    startPending.current = true;
    setStarting(true);
    setAudioError(false);
    setWarmupPress(undefined);
    const request = ++audioRequest.current;
    const ready = await audio.unlock().catch(() => false);
    if (request !== audioRequest.current) return;
    startPending.current = false;
    setStarting(false);
    if (!ready) {
      setAudioError(true);
      return;
    }
    if (mode === "endless" && currentRound.current.phase === "finished") return;

    const playedAt = performance.now();
    const target = pickNote();
    if (mode === "endless") {
      const savedSound = loadJson<unknown>(PRACTICE_SOUND_KEY, PIANO_SOUND.id);
      const sound = practiceSound.current ??= sounds.find(option => option.id === savedSound) ?? PIANO_SOUND;
      playNote(target, sound);
      update({ phase: "active", mode, target, sound });
      return;
    }
    const pool = sounds.filter(sound => TIMED_SOUND_IDS.has(sound.id) && sound.id !== lastTimedSound.current);
    const sound = pool[Math.floor(Math.random() * pool.length)];
    lastTimedSound.current = sound.id;
    playNote(target, sound);
    setSeconds(ROUND_SECONDS);
    update({
      phase: "active",
      mode,
      deadline: playedAt + ROUND_SECONDS * 1000,
      target,
      sound,
      playedAt,
      score: 0,
      attempts: 0,
      totalCorrectMs: 0,
      bonusRemaining: BONUS_SECONDS,
      confirmingExit: false,
    });
  }

  function start() {
    if (pausedAt.current !== undefined || startPending.current || currentRound.current.phase === "active") return;
    return startRound("timed");
  }

  function togglePractice() {
    if (pausedAt.current !== undefined || startPending.current) return;
    const current = currentRound.current;
    if (current.phase === "finished") return;
    if (current.phase === "active" && current.mode === "endless") {
      audioRequest.current++;
      stopCue();
      setAudioError(false);
      setSeconds(ROUND_SECONDS);
      update({ phase: "ready" });
      return;
    }
    if (current.phase === "active" && (current.confirmingExit || performance.now() >= current.deadline)) return;
    return startRound("endless");
  }

  function changePracticeSound(id: string) {
    const active = getActiveRound();
    const sound = sounds.find(option => option.id === id);
    if (active?.mode !== "endless" || !sound || active.sound === sound) return;
    practiceSound.current = sound;
    saveJson(PRACTICE_SOUND_KEY, sound.id);
    update({ ...active, sound });
    if (!active.feedback) void replay();
  }

  function changeHoldSeconds(value: number) {
    const current = currentRound.current;
    if (current.phase !== "ready" && (current.phase !== "active" || current.mode !== "endless")) return;
    if (!HOLD_CHOICES.includes(value) || value === holdRef.current) return;
    holdRef.current = value;
    setHoldSeconds(value);
    saveJson(HOLD_SECONDS_KEY, value);
    if (current.phase === "active" && !current.feedback) void replay();
  }

  async function choose(note: number) {
    if (pausedAt.current !== undefined) return;
    if (currentRound.current.phase === "ready") {
      if (startPending.current) return;
      const request = ++audioRequest.current;
      const ready = await audio.unlock().catch(() => false);
      if (request !== audioRequest.current) return;
      setAudioError(!ready);
      if (ready) {
        playNote(note);
        setWarmupPress({ note });
      }
      return;
    }

    const now = performance.now();
    const active = getActiveRound(now);
    if (!active || active.feedback) return;
    if (active.mode === "endless") {
      stopCue();
      update({ ...active, feedback: { picked: note, timeDelta: 0, nextAt: now + FEEDBACK_MS } });
      return;
    }
    if (active.confirmingExit) return;
    stopCue();
    const correct = note === active.target;
    const elapsed = now - active.playedAt;
    const speedBonus = Math.max(0, Math.min(3, 4 - Math.ceil(elapsed / 1000)));
    const bonus = correct ? Math.min(active.bonusRemaining, speedBonus) : 0;
    const timeDelta = correct ? bonus : -WRONG_PENALTY;
    const deadline = active.deadline + timeDelta * 1000;
    const answered = {
      ...active,
      deadline,
      score: active.score + Number(correct),
      attempts: active.attempts + 1,
      totalCorrectMs: active.totalCorrectMs + (correct ? elapsed : 0),
      bonusRemaining: active.bonusRemaining - bonus,
      feedback: { picked: note, timeDelta, nextAt: now + FEEDBACK_MS },
    };

    setSeconds(Math.max(0, Math.ceil((deadline - now) / 1000)));
    update(answered);
  }

  async function replay() {
    const active = getActiveRound();
    if (!active || active.feedback || (active.mode === "timed" && active.confirmingExit)) return;
    const request = ++audioRequest.current;
    const ready = await audio.unlock().catch(() => false);
    if (request !== audioRequest.current || getActiveRound() !== active) return;
    setAudioError(!ready);
    if (ready) playNote(active.target, active.sound);
  }

  function confirmExit() {
    const now = performance.now();
    const active = getActiveRound(now);
    if (active?.mode !== "timed" || active.confirmingExit || now >= active.deadline) return;
    stopCue();
    update({ ...active, confirmingExit: true });
  }

  function resume() {
    const now = performance.now();
    const active = getActiveRound(now);
    if (active?.mode !== "timed" || !active.confirmingExit || now >= active.deadline) return;
    const resumed = { ...active, confirmingExit: false };
    if (resumed.feedback) {
      nextNote(resumed, now);
    } else {
      update(resumed);
      void replay();
    }
  }

  return {
    round, seconds, best, sounds, holdSeconds, cue, starting, audioError, pressed: warmupPress?.note,
    start, togglePractice, changePracticeSound, changeHoldSeconds, choose, replay, confirmExit, resume,
  };
}

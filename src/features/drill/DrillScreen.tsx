import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LevelSpec,
  SessionResult,
  StageConfig,
  RhythmGrid as Grid,
  IntervalKey,
} from "../../game/types";
import { makeInitialUserGrid, makeQuestions } from "../../game/questionFactory";
import { RHYTHM_TRACKS } from "../../game/stages";
import { calcAccuracy, calcXp } from "../../game/scoring";
import { audio } from "../../audio";
import { LevelHeader } from "../../ui/game/LevelHeader";
import { TransportBar, type TransportStatus } from "../../ui/game/TransportBar";
import { RhythmGrid } from "./RhythmGrid";
import { Piano } from "./Piano";
import { IntervalChoices } from "./IntervalChoices";
import { KineticButton } from "../../ui/primitives/KineticButton";

export function DrillScreen({
  stage,
  level,
  onExit,
  onFinish,
}: {
  stage: StageConfig;
  level: LevelSpec;
  onExit: () => void;
  onFinish: (payload: {
    results: SessionResult[];
    accuracy: number;
    xp: number;
    level: LevelSpec;
    stage: StageConfig;
  }) => void;
}) {
  const questions = useMemo(() => makeQuestions(stage, level), [stage, level]);

  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [status, setStatus] = useState<TransportStatus>("idle");
  const [playhead, setPlayhead] = useState(-1);

  // Per-question UI states
  const [grid, setGrid] = useState<Grid>(() =>
    makeInitialUserGrid(level.kind === "rhythm" ? level.steps : 8),
  );
  const [pickedMidi, setPickedMidi] = useState<number | null>(null);
  const [pickedInterval, setPickedInterval] = useState<IntervalKey | null>(
    null,
  );

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const q = questions[idx];
  const progress = idx / questions.length;

  const canInteract = status !== "answered" && status !== "playing";
  const showFeedback = status === "answered";

  function resetForNextQuestion() {
    setStatus("idle");
    setPlayhead(-1);
    setGrid(makeInitialUserGrid(level.kind === "rhythm" ? level.steps : 8));
    setPickedMidi(null);
    setPickedInterval(null);
  }

  async function playPrompt() {
    if (status === "playing") return;
    setStatus("playing");
    clearTimers();

    if (q.kind === "keys") {
      await audio.play({
        type: "note",
        midi: q.octaveMidi + q.correct,
        duration: 0.8,
        wave: "sine",
      });
      timers.current.push(window.setTimeout(() => setStatus("idle"), 900));
      return;
    }

    if (q.kind === "intervals") {
      const semis = stage.intervals![q.correct].semitones;
      await audio.play({
        type: "interval",
        rootMidi: q.rootMidi,
        semitones: semis,
        duration: 0.8,
        wave: "triangle",
      });
      timers.current.push(window.setTimeout(() => setStatus("idle"), 1600));
      return;
    }

    if (q.kind === "rhythm" && level.kind === "rhythm") {
      const beatLen = 60 / level.bpm;
      const stepLen = beatLen / 2; // eighth notes
      const total = level.steps;

      for (let i = 0; i < total; i++) {
        const at = audio.currentTime + i * stepLen;
        timers.current.push(
          window.setTimeout(() => setPlayhead(i), i * stepLen * 1000),
        );
        audio.play({ type: "tick", high: i % 4 === 0, at });

        Object.entries(q.correct).forEach(([trackId, pattern]) => {
          if ((pattern as boolean[])[i])
            audio.play({ type: "drum", drum: trackId as any, at });
        });
      }

      timers.current.push(
        window.setTimeout(
          () => {
            setStatus("idle");
            setPlayhead(-1);
          },
          total * stepLen * 1000 + 120,
        ),
      );
    }
  }

  async function submit(choice: unknown) {
    if (!canInteract) return;

    let isCorrect = false;
    if (q.kind === "rhythm") {
      isCorrect = JSON.stringify(choice) === JSON.stringify(q.correct);
    } else if (q.kind === "keys") {
      isCorrect = choice === q.correct;
    } else {
      isCorrect = choice === q.correct;
    }

    setResults((prev) => [...prev, { ...q, userAnswer: choice, isCorrect }]);
    setStatus("answered");

    audio.play({ type: "feedback", kind: isCorrect ? "success" : "fail" });

    timers.current.push(
      window.setTimeout(() => {
        const nextIdx = idx + 1;
        if (nextIdx < questions.length) {
          setIdx(nextIdx);
          resetForNextQuestion();
        } else {
          const finalResults = [
            ...results,
            { ...q, userAnswer: choice, isCorrect },
          ];
          const accuracy = calcAccuracy(finalResults);
          const xp = calcXp(accuracy);
          onFinish({ results: finalResults, accuracy, xp, level, stage });
        }
      }, 900),
    );
  }

  // Rhythm
  const onToggleCell = async (trackId: keyof Grid, step: number) => {
    if (!canInteract) return;
    setGrid((prev) => {
      const next: Grid = { ...prev, [trackId]: [...prev[trackId]] } as any;
      next[trackId][step] = !next[trackId][step];
      return next;
    });
    audio.play({ type: "drum", drum: trackId as any });
  };

  // Keys
  const onPressKey = async (midiOffset: number) => {
    if (!canInteract || q.kind !== "keys") return;
    setPickedMidi(midiOffset);
    await audio.play({
      type: "note",
      midi: q.octaveMidi + midiOffset,
      duration: 0.5,
      wave: "sine",
    });
    submit(midiOffset);
  };

  // Intervals
  const onPickInterval = async (choice: IntervalKey) => {
    if (!canInteract || q.kind !== "intervals") return;
    setPickedInterval(choice);
    submit(choice);
  };

  return (
    <div className="min-h-[100svh] bg-surface0 text-white flex flex-col">
      {/* Header */}
      <div className="mx-auto w-full max-w-md px-6">
        <LevelHeader
          stage={stage}
          level={level}
          progress={progress}
          onClose={onExit}
        />
      </div>

      {/* Main (flex-1 = perfect centering + consistent spacing) */}
      <main className="mx-auto w-full max-w-md px-6 flex-1 flex flex-col py-6">
        {q.kind === "rhythm" && level.kind === "rhythm" ? (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <p className="ear-label mb-1">Match the Pattern</p>
              <p className="ear-body italic text-zinc-400">
                “{level.bpm} BPM • 4/4 Time”
              </p>
            </div>

            <RhythmGrid
              tracks={RHYTHM_TRACKS}
              grid={grid}
              enabledTracks={level.tracksEnabled}
              playhead={playhead}
              disabled={!canInteract}
              onToggle={onToggleCell}
            />

            <div className="mt-2">
              <KineticButton
                disabled={!canInteract}
                variant="accentB"
                className="w-full py-4 rounded-xl text-lg"
                onClick={() => submit(grid)}
              >
                SUBMIT SEQUENCE
              </KineticButton>
            </div>
          </div>
        ) : q.kind === "keys" ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <p className="ear-label mb-1">Find the Played Note</p>
              <div className="ear-heading italic text-accentA font-black text-3xl">
                PITCH PERFECT
              </div>
            </div>

            {/* ensure full width alignment with header/progress */}
            <div className="w-full">
              <Piano
                className="h-64"
                disabled={!canInteract}
                correct={q.correct}
                picked={pickedMidi}
                showFeedback={showFeedback}
                onPress={onPressKey}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <p className="ear-label mb-1">Name the Interval</p>
              <div className="ear-heading italic text-brand font-black text-3xl">
                INTERVAL LAB
              </div>
            </div>

            <IntervalChoices
              stage={stage}
              choices={(level.kind === "intervals" ? level.choices : []) as any}
              correct={(q.kind === "intervals" ? q.correct : "M2") as any}
              picked={pickedInterval}
              showFeedback={showFeedback}
              disabled={!canInteract}
              onPick={onPickInterval}
            />
          </div>
        )}
      </main>

      {/* Transport */}
      <TransportBar
        status={status}
        onReplay={playPrompt}
        onPlay={playPrompt}
        disabled={status === "answered"}
      />
    </div>
  );
}

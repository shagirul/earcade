import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Smartphone } from "lucide-react";
import { audio } from "../../audio";
import { PIANO_OCTAVE } from "../../game/stages";
import { cn } from "../../lib/cn";
import { Piano } from "../drill/Piano";
import { HOLD_CHOICES, type RushSound } from "./soundOptions";
import { ROUND_SECONDS, useNoteRush, type CuePlayback } from "./useNoteRush";
import "./noteRush.css";

const SHORTCUTS = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
const AUDIO_ERROR = "Sound unavailable. Enable audio in your browser and try again.";
const LANDSCAPE = "(orientation: landscape)";

function subscribeToOrientation(listener: () => void) {
  const media = window.matchMedia(LANDSCAPE);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function isLandscapeViewport() {
  return window.matchMedia(LANDSCAPE).matches;
}

function RoundDialog({
  children,
  onCancel,
  confirmation,
}: {
  children: ReactNode;
  onCancel?: () => void;
  confirmation?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>(".primary")?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="round-dialog-title"
      className={cn("overlay round-dialog", confirmation && "confirm")}
      onCancel={(event) => {
        event.preventDefault();
        onCancel?.();
      }}
    >
      <div className="result">{children}</div>
    </dialog>
  );
}

function ResultMetric({ label, value }: { label: string; value: ReactNode }) {
  return <div><strong>{value}</strong><small>{label}</small></div>;
}

function RoundCounter({
  label,
  value,
  delta = 0,
  attempt,
  seconds,
  urgent,
  endless = false,
  onToggle,
  disabled,
}: {
  label: string;
  value: string | number;
  delta?: number;
  attempt?: number;
  seconds?: number;
  urgent?: boolean;
  endless?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const change = delta === 0 ? undefined : delta > 0 ? "gain" : "loss";

  const content = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        <span key={change ? attempt : undefined} className="note-rush-value" data-change={change}>{value}</span>
      </span>
      {seconds !== undefined && (
        <span className="timer-track" aria-hidden="true">
          <span className="timer-fill" style={{ width: Math.min(100, seconds / ROUND_SECONDS * 100) + "%" }} />
        </span>
      )}
      {change && (
        <span key={attempt} aria-hidden="true" className="note-rush-delta" data-change={change}>
          {delta > 0 ? "+" : "−"}{Math.abs(delta)}{seconds !== undefined && "s"}
        </span>
      )}
    </>
  );
  if (!onToggle) return <div className="stat">{content}</div>;

  return (
    <button
      type="button"
      className={cn("stat timer", urgent && "urgent")}
      aria-label="Endless practice"
      aria-pressed={endless}
      title={endless ? "Switch to timed play" : "Switch to endless practice"}
      disabled={disabled}
      onClick={onToggle}
    >
      {content}
    </button>
  );
}

function noteName(note: number) {
  return PIANO_OCTAVE[note].label.replace("#", "♯");
}

function ReplayButton({ cue, disabled, onClick }: { cue?: CuePlayback; disabled: boolean; onClick: () => void }) {
  const progress = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const fill = progress.current!;
    fill.style.transform = "scaleX(0)";
    fill.dataset.phase = cue ? "playing" : "idle";
    if (!cue) return;
    const { startedAt, duration } = cue;
    let frame: number;

    function draw() {
      const played = Math.max(0, Math.min(1, (audio.currentTime - startedAt) / duration));
      fill.style.transform = "scaleX(" + played + ")";
      if (played < 1) frame = requestAnimationFrame(draw);
      else fill.dataset.phase = "complete";
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [cue]);

  return (
    <button type="button" className="replay cue-replay" disabled={disabled} onClick={onClick}>
      <span ref={progress} className="cue-progress" aria-hidden="true" />
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h4l5-4v14l-5-4H3zM16 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />
      </svg>
      <span>Play note again</span>
    </button>
  );
}

export function NoteRushScreen({
  onExit,
  onComplete,
}: {
  onExit: () => void;
  onComplete: (score: number, attempts: number) => void;
}) {
  const landscape = useSyncExternalStore(subscribeToOrientation, isLandscapeViewport);
  const {
    round, seconds, best, sounds, holdSeconds, cue, starting, audioError, pressed,
    start, togglePractice, changePracticeSound, changeHoldSeconds, choose, replay, confirmExit, resume,
  } = useNoteRush(landscape, onComplete);
  const soundGroups = useMemo(() => {
    const groups = new Map<string, RushSound[]>();
    for (const sound of sounds) {
      const group = groups.get(sound.group);
      if (group) group.push(sound);
      else groups.set(sound.group, [sound]);
    }
    return Array.from(groups);
  }, [sounds]);
  const active = round.phase === "active" ? round : undefined;
  const timed = active?.mode === "timed" ? active : undefined;
  const practice = active?.mode === "endless" ? active : undefined;
  const endless = !!practice;
  const canSetHold = round.phase === "ready" || (practice?.sound.patch?.amp.s ?? 0) > 0;
  const finished = round.phase === "finished" ? round : undefined;
  const feedback = active?.feedback;
  const correct = !!feedback && feedback.picked === active?.target;
  const answeredAttempt = feedback ? timed?.attempts : undefined;
  const clock = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  const startButton = useRef<HTMLButtonElement>(null);

  let eyebrow = "30s challenge · up to 60s";
  let message = "Hear it. Find it.";
  let detail = "Listen to a note and tap the matching key.";
  if (active || finished) {
    eyebrow = endless ? "Endless practice" : "Listen and identify";
    if (timed) eyebrow += " · " + timed.sound.label;
    message = "Which note is it?";
    detail = "Tap the matching piano key.";
  }
  if (feedback && active) {
    const target = noteName(active.target);
    eyebrow = "Next note coming";
    message = correct ? "Correct! " + target : "It was " + target;
    detail = correct
      ? feedback.timeDelta ? "+" + feedback.timeDelta + "s added to the clock." : "Nice. Keep going."
      : "You picked " + noteName(feedback.picked) + (timed ? " · −" + Math.abs(feedback.timeDelta) + "s" : "");
  }

  useEffect(() => {
    if (landscape) startButton.current?.focus({ preventScroll: true });
  }, [landscape]);

  useEffect(() => {
    if (!landscape) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target instanceof HTMLSelectElement) return;
      if (finished || timed?.confirmingExit) return;
      if (event.key === "Escape") {
        if (timed) confirmExit();
        else onExit();
        return;
      }
      if (event.code === "Space" && active && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        void replay();
        return;
      }
      const note = SHORTCUTS.indexOf(event.key.toLowerCase());
      if (note !== -1) {
        event.preventDefault();
        void choose(note);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [landscape, active, timed, finished, choose, replay, confirmExit, onExit]);

  if (!landscape) {
    return (
      <main className="rotate-screen">
        <div className="panel rotate-panel">
          <Smartphone aria-hidden="true" className="rotate-symbol" size={38} />
          <p className="eyebrow">EARCADE / NOTE RUSH</p>
          <h1 className="display">Rotate to landscape</h1>
          <p className="detail">Turn your device sideways to {active ? "resume the round" : "play"}.</p>
          <button type="button" className="secondary" onClick={onExit}>Back to exercises</button>
        </div>
      </main>
    );
  }

  return (
    <div className="game-shell">
      <main className="app" aria-label="Earcade note guessing game">
        <header className="top">
          <div className="rush-heading">
            <button
              type="button"
              className="exit back-control"
              aria-label={timed ? "Back to exercises, end round" : "Back to exercises"}
              onClick={timed ? confirmExit : onExit}
              disabled={!!finished || (!!timed && seconds === 0)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m14 5-7 7 7 7M7 12h14" />
              </svg>
            </button>
            <div className="display rush-title">Note Rush</div>
          </div>
          <div className="stats">
            {practice && (
              <label className="stat sound-stat">
                <span className="stat-label">Sound</span>
                <select value={practice.sound.id} onChange={(event) => changePracticeSound(event.currentTarget.value)}>
                  {soundGroups.map(([group, options]) => (
                    <optgroup key={group} label={group}>
                      {options.map(sound => <option key={sound.id} value={sound.id}>{sound.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
            )}
            {canSetHold && (
              <label className="stat sound-stat hold-stat" title="Time before a sustained note is released">
                <span className="stat-label">Hold</span>
                <select value={holdSeconds} onChange={(event) => changeHoldSeconds(Number(event.currentTarget.value))}>
                  {HOLD_CHOICES.map(duration => (
                    <option key={duration} value={duration}>{duration}s</option>
                  ))}
                </select>
              </label>
            )}
            {!endless && <RoundCounter label="Score" value={timed?.score ?? finished?.score ?? 0} delta={Number(correct)} attempt={answeredAttempt} />}
            <RoundCounter
              label={endless ? "Endless" : "Time left"}
              value={endless ? "∞" : clock}
              delta={feedback?.timeDelta}
              attempt={answeredAttempt}
              seconds={endless ? undefined : seconds}
              urgent={!endless && seconds <= 5}
              endless={endless}
              onToggle={togglePractice}
              disabled={starting || !!finished || (!!timed && seconds === 0)}
            />
            {!endless && <RoundCounter label="Best" value={best} />}
          </div>
        </header>

        <section className="prompt">
          <div className="prompt-copy">
            <p className="eyebrow">{eyebrow}</p>
            <div role="status" aria-atomic="true">
              <p className={cn("message", feedback && (correct ? "good" : "bad"))}>{message}</p>
              <p className="detail">{detail}</p>
              {correct && timed && <span className="sr">+1 point.</span>}
            </div>
            {audioError && !finished && <p role="alert" className="detail bad">{AUDIO_ERROR}</p>}
          </div>
          <div className="controls">
            {active || finished ? (
              <ReplayButton cue={cue} disabled={!!feedback || !!finished} onClick={replay} />
            ) : (
              <button type="button" className="primary" ref={startButton} disabled={starting} onClick={start}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5a1 1 0 0 0-1.5.9v11.2a1 1 0 0 0 1.5.9l10-5.6a1 1 0 0 0 0-1.8z" />
                </svg>
                Start round
              </button>
            )}
          </div>
        </section>

        <Piano onPress={choose} disabled={starting || !!feedback || !!finished} correct={active?.target} picked={feedback?.picked} pressed={pressed} showFeedback={!!feedback} />

        <footer className="foot">
          {endless ? <span>Tap ∞ for timed play</span> : <span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
            </svg>
            Fast +1–3s · Miss −2s
          </span>}
          {correct && !!feedback?.timeDelta && <span className="bonus" aria-hidden="true">+{feedback.timeDelta}s</span>}
          <span>
            {active || finished ? "One guess per note" : <>Tap keys to warm up <span className="desktop-hint">· A–J + W/E/T/Y/U</span></>}
          </span>
        </footer>

        {timed?.confirmingExit && (
          <RoundDialog key="exit" confirmation onCancel={resume}>
            <h1 id="round-dialog-title">End this round?</h1>
            <p>Your current score will not count. The clock keeps running.</p>
            <div className="result-actions">
              <button type="button" className="secondary" onClick={onExit}>End round</button>
              <button type="button" className="primary" onClick={resume}>Keep playing</button>
            </div>
          </RoundDialog>
        )}

        {finished && (
          <RoundDialog key="result">
            <p className="eyebrow">{finished.personalBest ? "New personal best!" : "Round complete"}</p>
            <h1 id="round-dialog-title">Time's up!</h1>
            <div className="score-big">{finished.score}</div>
            <p className="result-note">{finished.score === 1 ? "Correct note" : "Correct notes"}</p>
            <div className="result-metrics">
              <ResultMetric label="Accuracy" value={finished.attempts ? Math.round(finished.score / finished.attempts * 100) + "%" : "—"} />
              <ResultMetric label="Avg. correct time" value={finished.score ? (finished.totalCorrectMs / finished.score / 1000).toFixed(1) + "s" : "—"} />
              <ResultMetric label="Personal best" value={best} />
            </div>
            {audioError && <p role="alert" className="detail bad">{AUDIO_ERROR}</p>}
            <div className="result-actions">
              <button type="button" className="secondary" onClick={onExit}>Done</button>
              <button type="button" className="primary" disabled={starting} onClick={start}>Play again</button>
            </div>
          </RoundDialog>
        )}
      </main>
    </div>
  );
}

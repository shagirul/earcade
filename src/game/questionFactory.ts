import { createRNG, getDailySeed } from "./rng";
import { RHYTHM_TRACKS } from "./stages";
import type { Question, RhythmGrid, StageConfig, LevelSpec } from "./types";

function emptyGrid(steps: number): RhythmGrid {
  return {
    kick: Array(steps).fill(false),
    snare: Array(steps).fill(false),
    hihat: Array(steps).fill(false),
    clap: Array(steps).fill(false),
  };
}

export function makeQuestions(stage: StageConfig, level: LevelSpec, now = new Date()): Question[] {
  const rng = createRNG(getDailySeed(now) + level.index);
  const qs: Question[] = [];

  for (let i = 0; i < level.count; i++) {
    if (stage.id === "rhythm" && level.kind === "rhythm") {
      const grid = emptyGrid(level.steps);
      // Build a deterministic but varied groove
      RHYTHM_TRACKS.forEach((t, trackIdx) => {
        if (trackIdx < level.tracksEnabled) {
          if (t.id === "kick") grid.kick[0] = true;
          if (t.id === "snare") grid.snare[4] = true;
          for (let j = 0; j < level.steps; j++) {
            if (rng() > 0.82) (grid as any)[t.id][j] = true;
          }
        }
      });
      qs.push({ kind: "rhythm", correct: grid });
      continue;
    }

    if (stage.id === "keys" && level.kind === "keys") {
      const correct = level.possibleNotes[Math.floor(rng() * level.possibleNotes.length)];
      qs.push({ kind: "keys", correct, octaveMidi: level.octaveMidi });
      continue;
    }

    if (stage.id === "intervals" && level.kind === "intervals") {
      const correct = level.choices[Math.floor(rng() * level.choices.length)];
      const [min, max] = level.rootRange;
      const rootMidi = Math.floor(rng() * (max - min)) + min;
      qs.push({ kind: "intervals", correct, rootMidi });
      continue;
    }
  }

  return qs;
}

export function makeInitialUserGrid(steps = 8): RhythmGrid {
  const g = emptyGrid(steps);
  // keep arrays shared lengths stable
  Object.keys(g).forEach((k) => ((g as any)[k] = Array(steps).fill(false)));
  return g;
}

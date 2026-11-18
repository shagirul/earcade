import type { SessionResult } from "./types";

export function calcAccuracy(results: SessionResult[]): number {
  if (results.length === 0) return 0;
  const ok = results.filter((r) => r.isCorrect).length;
  return ok / results.length;
}

export function calcXp(accuracy: number): number {
  return Math.round(accuracy * 100);
}

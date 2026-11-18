import { RotateCcw, Trophy } from "lucide-react";
import type { LevelSpec, StageConfig, SessionResult } from "../../game/types";
import { Screen } from "../../ui/layout/Screen";
import { Card } from "../../ui/primitives/Card";
import { KineticButton } from "../../ui/primitives/KineticButton";

export function ResultsScreen({
  stage,
  level,
  results,
  accuracy,
  xpGained,
  onContinue,
  onRetry,
}: {
  stage: StageConfig;
  level: LevelSpec;
  results: SessionResult[];
  accuracy: number;
  xpGained: number;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const isSuccess = accuracy >= 0.8;

  return (
    <Screen padded>
      <div className="pt-10 flex flex-col items-center text-center">
        <div className={"w-24 h-24 rounded-xl flex items-center justify-center mb-6 " + (isSuccess ? "bg-emerald-500" : "bg-surface1 border border-surface2")}>
          {isSuccess ? <Trophy size={48} /> : <RotateCcw size={48} />}
        </div>

        <h2 className="text-4xl font-black tracking-tight mb-2">
          {isSuccess ? "LEVEL CLEARED" : "KEEP PRACTICING"}
        </h2>

        <p className="ear-body text-zinc-500 mb-8 max-w-xs">
          {isSuccess
            ? "Excellent performance — your ear is sharpening fast."
            : "Focus on the relationship between sound and layout. Replay with intention."}
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
          <Card className="rounded-xl">
            <div className="ear-label mb-1">Accuracy</div>
            <div className="text-2xl font-black text-brand tabular-nums">{Math.round(accuracy * 100)}%</div>
          </Card>
          <Card className="rounded-xl">
            <div className="ear-label mb-1">XP Gained</div>
            <div className="text-2xl font-black text-accentB tabular-nums">+{xpGained}</div>
          </Card>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <KineticButton
            variant="primary"
            className="w-full py-4 rounded-xl"
            onClick={onContinue}
          >
            CONTINUE
          </KineticButton>

          {!isSuccess && (
            <KineticButton
              variant="surface"
              className="w-full py-4 rounded-xl"
              onClick={onRetry}
            >
              TRY AGAIN
            </KineticButton>
          )}
        </div>

        <div className="mt-10 w-full max-w-sm text-left">
          <div className="ear-label mb-2">Session recap</div>
          <div className="space-y-2">
            {results.slice(0, 6).map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-surface1 border border-surface2 rounded-lg px-4 py-3">
                <div className="text-sm font-bold text-zinc-300">Q{i + 1}</div>
                <div className={r.isCorrect ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {r.isCorrect ? "OK" : "MISS"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

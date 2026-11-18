import type { IntervalKey, StageConfig } from "../../game/types";
import { cn } from "../../lib/cn";

export function IntervalChoices({
  stage,
  choices,
  correct,
  picked,
  showFeedback,
  disabled,
  onPick,
}: {
  stage: StageConfig;
  choices: IntervalKey[];
  correct: IntervalKey;
  picked: IntervalKey | null;
  showFeedback: boolean;
  disabled?: boolean;
  onPick: (c: IntervalKey) => void;
}) {
  const defs = stage.intervals!;
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
      {choices.map((c) => {
        const isCorrect = showFeedback && c === correct;
        const isWrong = showFeedback && picked === c && c !== correct;

        return (
          <button
            key={c}
            onClick={() => onPick(c)}
            disabled={disabled}
            className={cn(
              "p-6 rounded-lg border-2 font-black text-xl transition-all",
              "active:scale-95 active:translate-y-0.5",
              !showFeedback && "bg-surface1 border-surface2 hover:border-zinc-700 text-zinc-200",
              isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
              isWrong && "bg-red-500/20 border-red-500 text-red-400",
              showFeedback && !isCorrect && !isWrong && "bg-surface1 border-surface2 text-zinc-700"
            )}
          >
            {defs[c].label}
          </button>
        );
      })}
    </div>
  );
}

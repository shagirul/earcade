import { XCircle } from "lucide-react";
import type { StageConfig, LevelSpec } from "../../game/types";
import { ProgressBar } from "../primitives/ProgressBar";

const accentBar: Record<StageConfig["theme"]["accent"], string> = {
  accentA: "bg-accentA",
  accentB: "bg-accentB",
  brand: "bg-brand",
};

export function LevelHeader({
  stage,
  level,
  progress,
  onClose,
}: {
  stage: StageConfig;
  level: LevelSpec;
  progress: number;
  onClose: () => void;
}) {
  return (
    <header className="pt-6">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <XCircle />
        </button>
        <div className="text-center">
          <div className="ear-label">{stage.title}</div>
          <div className="text-sm font-bold">Level {level.index}</div>
        </div>
        <div className="w-8" />
      </div>

      <div className="mt-4">
        <ProgressBar progress={progress} barClassName={accentBar[stage.theme.accent]} />
      </div>
    </header>
  );
}

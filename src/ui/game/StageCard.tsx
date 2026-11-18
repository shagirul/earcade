import type { StageConfig } from "../../game/types";
import { Card } from "../primitives/Card";

export function StageCard({
  stage,
  exercise,
  onOpen,
}: {
  stage: StageConfig;
  exercise: string;
  onOpen: () => void;
}) {
  const Icon = stage.icon;
  const pill =
    stage.theme.accent === "accentA"
      ? "bg-accentA/10 text-accentA border-emerald-500/20"
      : stage.theme.accent === "accentB"
      ? "bg-accentB/10 text-accentB border-orange-500/20"
      : "bg-brand/10 text-brand border-blue-500/20";

  return (
    <Card onClick={onOpen} className="flex items-center gap-4">
      <span className={"w-12 h-12 rounded-lg border flex items-center justify-center " + pill}>
        <Icon size={24} />
      </span>

      <span className="flex-1">
        <span className="flex items-center justify-between gap-2 mb-1">
          <span className="ear-heading">{stage.title}</span>
          <span className="ear-label">{exercise}</span>
        </span>
        <span className="ear-body text-zinc-400">{stage.desc}</span>
      </span>
    </Card>
  );
}

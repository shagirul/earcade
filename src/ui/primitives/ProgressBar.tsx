import { cn } from "../../lib/cn";

export function ProgressBar({
  progress,
  barClassName = "bg-brand",
}: {
  progress: number; // 0..1
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
      <div
        className={cn("h-full transition-all duration-300", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

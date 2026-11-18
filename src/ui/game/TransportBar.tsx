import { Play, RotateCcw } from "lucide-react";
import { KineticButton } from "../primitives/KineticButton";

export type TransportStatus = "idle" | "playing" | "answered";

export function TransportBar({
  status,
  onReplay,
  onPlay,
  disabled,
}: {
  status: TransportStatus;
  onReplay: () => void;
  onPlay: () => void;
  disabled?: boolean;
}) {
  const isPlaying = status === "playing";
  return (
    <div className="sticky bottom-0 bg-surface1 border-t border-surface2">
      <div className="mx-auto w-full max-w-md px-6 py-4 flex items-center justify-between">
        <div className="flex gap-3">
          <KineticButton
            disabled={disabled}
            variant="surface"
            className="w-12 h-12 p-0 flex items-center justify-center rounded-full"
            onClick={onReplay}
          >
            <RotateCcw size={20} className="text-zinc-300" />
          </KineticButton>

          <KineticButton
            disabled={disabled}
            variant="primary"
            className={"w-12 h-12 p-0 flex items-center justify-center rounded-full " + (isPlaying ? "opacity-90" : "")}
            onClick={onPlay}
          >
            <Play size={20} fill="currentColor" />
          </KineticButton>
        </div>

        <div className="text-right">
          <div className="ear-label">Audio Ready</div>
          <div className="text-sm font-medium text-zinc-300 italic">Earcade Engine</div>
        </div>
      </div>
    </div>
  );
}

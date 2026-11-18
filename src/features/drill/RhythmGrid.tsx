import type { RhythmGrid as Grid, RhythmTrack } from "../../game/types";
import { cn } from "../../lib/cn";

export function RhythmGrid({
  tracks,
  grid,
  enabledTracks,
  playhead,
  disabled,
  onToggle,
}: {
  tracks: RhythmTrack[];
  grid: Grid;
  enabledTracks: number;
  playhead: number; // -1 when idle
  disabled?: boolean;
  onToggle: (trackId: keyof Grid, step: number) => void;
}) {
  const steps = grid.kick.length;

  return (
    <div className="space-y-4">
      {tracks.map((track, idx) => {
        const enabled = idx < enabledTracks;
        return (
          <div
            key={track.id}
            className={cn(
              "transition-opacity duration-300",
              enabled ? "opacity-100" : "opacity-20 pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="ear-label text-zinc-400">{track.label}</span>
              <span className={cn("px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-[0.2em]", track.pillClass)}>
                {track.id}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 relative">
              {playhead !== -1 && (
                <div
                  className="absolute inset-y-0 bg-brand/10 pointer-events-none rounded-lg transition-all duration-75"
                  style={{
                    left: `${(playhead / steps) * 100}%`,
                    width: `${(1 / steps) * 100}%`,
                    zIndex: 0,
                  }}
                />
              )}

              {grid[track.id].map((val, step) => (
                <button
                  key={step}
                  disabled={disabled}
                  onClick={() => onToggle(track.id, step)}
                  className={cn(
                    "h-12 rounded-lg border-2 transition-all relative z-10",
                    "active:scale-95 active:translate-y-0.5",
                    val ? track.cellOnClass : "bg-surface1 border-surface2 active:bg-surface2",
                    step % 4 === 0 ? "border-zinc-600" : ""
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

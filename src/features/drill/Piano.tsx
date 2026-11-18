import type { CSSProperties } from "react";
import { PIANO_OCTAVE } from "../../game/stages";
import { cn } from "../../lib/cn";

type Props = {
  disabled?: boolean;
  correct?: number;
  picked?: number | null;
  pressed?: number;
  showFeedback?: boolean;
  className?: string;
  onPress: (midi: number) => void;
};

const keys = [
  ...PIANO_OCTAVE.filter((key) => !key.isBlack),
  ...PIANO_OCTAVE.filter((key) => key.isBlack),
];
const blackPositions: Partial<Record<number, number>> = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };
const flats: Partial<Record<number, string>> = { 1: "D", 3: "E", 6: "G", 8: "A", 10: "B" };

export function Piano({ disabled, correct, picked, pressed, showFeedback, className, onPress }: Props) {
  return (
    <section role="group" aria-label="One octave piano keyboard, C4 to B4" className={cn("piano", className)}>
      <div className="keybed">
        {keys.map(({ midi, label, isBlack }) => (
          <button
            key={midi}
            type="button"
            aria-label={isBlack ? label[0] + " sharp or " + flats[midi] + " flat" : label}
            className={cn(
              "key",
              isBlack ? "black" : "white",
              showFeedback && (midi === correct ? "correct" : midi === picked && "wrong"),
              pressed === midi && "pressed",
            )}
            style={isBlack ? { "--pos": blackPositions[midi] } as CSSProperties : undefined}
            disabled={disabled}
            onClick={() => onPress(midi)}
          >
            <span>{label.replace("#", "♯")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

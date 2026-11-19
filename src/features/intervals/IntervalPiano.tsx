import { cn } from "../../lib/cn";
import { intervalKeys } from "./intervals";

export function IntervalPiano({ keys, disabled, pressed, picked, target, onPress }: {
  keys: ReturnType<typeof intervalKeys>;
  disabled: boolean;
  pressed?: number;
  picked?: number;
  target?: number;
  onPress: (note: number) => void;
}) {
  return (
    <section className="piano interval-piano" role="group" aria-label={`Piano from ${keys[0].name} to ${keys[12].name}`}>
      <div className="keybed">
        {keys.map(({ offset, black, left, width, name, shortcut }, i) => (
          <button type="button" key={offset} disabled={disabled}
            aria-label={name + (i === 0 ? ", reference" : "")} aria-keyshortcuts={shortcut.toUpperCase()}
            title={name + " · " + shortcut.toUpperCase()}
            className={cn("key", black ? "black" : "white", pressed === offset && "pressed",
              picked !== undefined && (offset === target ? "correct" : offset === picked && "wrong"))}
            style={{ left: `calc(${left}% + 1px)`, width: `calc(${width}% - 2px)` }}
            onClick={() => onPress(offset)}>
            {i === 0 && <small>Ref</small>}
            <span>{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

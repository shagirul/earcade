import { Home, LayoutGrid, Settings, Trophy } from "lucide-react";
import { cn } from "../../lib/cn";

export type NavKey = "studio" | "library" | "hall" | "gear";

const items: Array<{ key: NavKey; label: string; Icon: any }> = [
  { key: "studio", label: "Studio", Icon: Home },
  { key: "library", label: "Library", Icon: LayoutGrid },
  { key: "hall", label: "Hall", Icon: Trophy },
  { key: "gear", label: "Gear", Icon: Settings },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface1 border-t border-surface2">
      <div className="mx-auto w-full max-w-md px-6 py-4 flex items-center justify-around">
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center gap-1",
                isActive ? "text-brand" : "text-zinc-600"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

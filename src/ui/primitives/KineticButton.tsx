import { cn } from "../../lib/cn";

type Variant =
  | "primary"
  | "surface"
  | "success"
  | "danger"
  | "accentA"
  | "accentB";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white border border-blue-400/20 shadow-kinetic active:shadow-none",
  surface:
    "bg-surface1 text-white border border-surface2 shadow-kinetic active:shadow-none",
  accentA:
    "bg-[#079669] text-black border border-emerald-300/20 shadow-kinetic active:shadow-none hover:bg-accentA",
  accentB:
    "bg-accentB text-black border border-orange-300/20 shadow-kinetic active:shadow-none",
  success:
    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-kinetic active:shadow-none",
  danger:
    "bg-red-500/20 text-red-400 border border-red-500/40 shadow-kinetic active:shadow-none",
};

export function KineticButton({
  children,
  className,
  variant = "surface",
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-3 font-black transition-all select-none",
        "active:scale-95 active:translate-y-0.5",
        "disabled:opacity-30 disabled:active:scale-100 disabled:active:translate-y-0",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

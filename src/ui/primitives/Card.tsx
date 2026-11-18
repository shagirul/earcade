import { cn } from "../../lib/cn";

export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const baseClassName = "bg-surface2 border border-surface2 rounded-lg p-4";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClassName,
          "w-full text-left transition-all active:scale-95 hover:border-zinc-700",
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return <div className={cn(baseClassName, className)}>{children}</div>;
}

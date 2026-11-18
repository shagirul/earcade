import { cn } from "../../lib/cn";

export function Screen({
  children,
  className,
  padded = true,
  bottomPad = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  bottomPad?: boolean;
}) {
  return (
    <div className={cn("min-h-screen bg-surface0 text-white", className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-md",
          padded && "px-6",
          bottomPad && "pb-24"
        )}
      >
        {children}
      </div>
    </div>
  );
}

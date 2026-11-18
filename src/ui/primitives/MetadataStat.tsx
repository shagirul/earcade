export function MetadataStat({
  label,
  value,
  rightSlot,
}: {
  label: string;
  value: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <div className="ear-label">{label}</div>
      <div className="flex items-center justify-end gap-1 text-xl font-black tabular-nums">
        {rightSlot}
        {value}
      </div>
    </div>
  );
}

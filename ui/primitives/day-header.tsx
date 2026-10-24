interface DayHeaderProps {
  label: string;
}

export function DayHeader({ label }: DayHeaderProps) {
  return (
    <div className="flex h-7 items-end px-3 pb-1 text-mini font-semibold tracking-wide text-fg-3 uppercase">
      {label}
    </div>
  );
}

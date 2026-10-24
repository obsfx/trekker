interface ProgressMeterProps {
  percent: number;
  label: string;
}

export function ProgressMeter({ percent, label }: ProgressMeterProps) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="h-1 flex-1 overflow-hidden rounded-pill bg-canvas-3">
        <span
          className="block h-full rounded-pill bg-success"
          style={{ width: `${String(percent)}%` }}
        />
      </span>
      <span className="text-micro text-fg-3 tabular-nums">{label}</span>
    </span>
  );
}

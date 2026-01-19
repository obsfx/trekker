import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SubtaskProgressProps {
  completed: number;
  total: number;
}

export function SubtaskProgress({ completed, total }: SubtaskProgressProps) {
  if (total === 0) return null;

  const percentage = Math.round((completed / total) * 100);

  const getColorClass = (pct: number): string => {
    if (pct === 100) return "[&>div]:bg-green-500";
    if (pct >= 67) return "[&>div]:bg-blue-500";
    if (pct >= 34) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <Progress
        value={percentage}
        className={cn("flex-1 h-1.5", getColorClass(percentage))}
      />
      <span className="font-mono text-xs text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  );
}

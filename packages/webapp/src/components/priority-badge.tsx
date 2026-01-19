import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/constants";

interface PriorityBadgeProps {
  priority: number;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES[2];

  return (
    <Badge
      className="font-mono text-xs"
      title={PRIORITY_LABELS[priority]}
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      P{priority}
    </Badge>
  );
}

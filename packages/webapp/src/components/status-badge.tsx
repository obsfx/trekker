import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || { bg: "#6b7280", text: "#ffffff" };

  return (
    <Badge
      className="text-xs"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

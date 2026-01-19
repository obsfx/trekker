"use client";

import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

const STATUS_CONFIG = {
  connected: {
    color: "bg-green-500",
    label: "Connected to live updates",
  },
  connecting: {
    color: "bg-yellow-500",
    label: "Connecting...",
  },
  disconnected: {
    color: "bg-red-500",
    label: "Disconnected",
  },
} as const;

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2 w-2 rounded-full", config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}

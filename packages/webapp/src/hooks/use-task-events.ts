"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUIStore } from "@/stores";
import { STATUS_LABELS } from "@/lib/constants";

interface TaskStatusChangedEvent {
  type: "task_status_changed";
  taskId: string;
  taskTitle: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

interface ConnectedEvent {
  type: "connected";
}

type SSEEvent = TaskStatusChangedEvent | ConnectedEvent;

export function useTaskEvents(onTaskChange?: () => void) {
  const connectionStatus = useUIStore((state) => state.connectionStatus);

  // Store callbacks in refs to avoid dependency issues
  const onTaskChangeRef = useRef(onTaskChange);
  onTaskChangeRef.current = onTaskChange;

  useEffect(() => {
    const setStatus = useUIStore.getState().setConnectionStatus;
    setStatus("connecting");

    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      setStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        if (data.type === "connected") {
          setStatus("connected");
        } else if (data.type === "task_status_changed") {
          const newStatusLabel = STATUS_LABELS[data.newStatus] || data.newStatus;
          const previousStatusLabel = STATUS_LABELS[data.previousStatus] || data.previousStatus;

          toast.info(`Task ${data.taskId} updated`, {
            description: `"${data.taskTitle}" moved from ${previousStatusLabel} to ${newStatusLabel}`,
          });

          onTaskChangeRef.current?.();
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setStatus("disconnected");
    };

    return () => {
      eventSource.close();
      setStatus("disconnected");
    };
  }, []); // Empty dependency array - runs once on mount

  return { connectionStatus };
}

"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUIStore } from "@/stores";
import { STATUS_LABELS } from "@/lib/constants";
import { sendNotification } from "@/lib/notifications";

interface TaskCreatedEvent {
  type: "task_created";
  taskId: string;
  taskTitle: string;
  status: string;
  timestamp: string;
}

interface TaskUpdatedEvent {
  type: "task_updated";
  taskId: string;
  taskTitle: string;
  status: string;
  timestamp: string;
}

interface TaskDeletedEvent {
  type: "task_deleted";
  taskId: string;
  taskTitle: string;
  timestamp: string;
}

interface EpicCreatedEvent {
  type: "epic_created";
  epicId: string;
  epicTitle: string;
  status: string;
  timestamp: string;
}

interface EpicUpdatedEvent {
  type: "epic_updated";
  epicId: string;
  epicTitle: string;
  status: string;
  timestamp: string;
}

interface EpicDeletedEvent {
  type: "epic_deleted";
  epicId: string;
  epicTitle: string;
  timestamp: string;
}

interface ConnectedEvent {
  type: "connected";
}

type SSEEvent =
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskDeletedEvent
  | EpicCreatedEvent
  | EpicUpdatedEvent
  | EpicDeletedEvent
  | ConnectedEvent;

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
          return;
        }

        let title = "";
        let description = "";

        switch (data.type) {
          case "task_created":
            title = `Task ${data.taskId} created`;
            description = `"${data.taskTitle}"`;
            break;
          case "task_updated":
            title = `Task ${data.taskId} updated`;
            description = `"${data.taskTitle}" → ${STATUS_LABELS[data.status] || data.status}`;
            break;
          case "task_deleted":
            title = `Task ${data.taskId} deleted`;
            description = `"${data.taskTitle}"`;
            break;
          case "epic_created":
            title = `Epic ${data.epicId} created`;
            description = `"${data.epicTitle}"`;
            break;
          case "epic_updated":
            title = `Epic ${data.epicId} updated`;
            description = `"${data.epicTitle}" → ${STATUS_LABELS[data.status] || data.status}`;
            break;
          case "epic_deleted":
            title = `Epic ${data.epicId} deleted`;
            description = `"${data.epicTitle}"`;
            break;
        }

        toast.info(title, { description });
        sendNotification({ title, body: description, tag: data.type });
        onTaskChangeRef.current?.();
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

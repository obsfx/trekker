import { NextRequest } from "next/server";
import { getDb, tasks, epics } from "@/lib/db";

export const dynamic = "force-dynamic";

interface TaskState {
  id: string;
  status: string;
  title: string;
  updatedAt: Date;
}

interface EpicState {
  id: string;
  status: string;
  title: string;
  updatedAt: Date;
}

type SSEEvent =
  | { type: "task_created"; taskId: string; taskTitle: string; status: string }
  | { type: "task_updated"; taskId: string; taskTitle: string; status: string }
  | { type: "task_deleted"; taskId: string; taskTitle: string }
  | { type: "epic_created"; epicId: string; epicTitle: string; status: string }
  | { type: "epic_updated"; epicId: string; epicTitle: string; status: string }
  | { type: "epic_deleted"; epicId: string; epicTitle: string };

let lastTaskState: Map<string, TaskState> = new Map();
let lastEpicState: Map<string, EpicState> = new Map();

async function getChanges(): Promise<SSEEvent[]> {
  const db = getDb();
  const [currentTasks, currentEpics] = await Promise.all([
    db.select().from(tasks),
    db.select().from(epics),
  ]);

  const events: SSEEvent[] = [];

  // Track task changes
  const currentTaskIds = new Set<string>();
  for (const task of currentTasks) {
    currentTaskIds.add(task.id);
    const previous = lastTaskState.get(task.id);

    if (!previous) {
      events.push({
        type: "task_created",
        taskId: task.id,
        taskTitle: task.title,
        status: task.status,
      });
    } else if (previous.updatedAt.getTime() !== task.updatedAt.getTime()) {
      events.push({
        type: "task_updated",
        taskId: task.id,
        taskTitle: task.title,
        status: task.status,
      });
    }
  }

  for (const [id, task] of lastTaskState) {
    if (!currentTaskIds.has(id)) {
      events.push({
        type: "task_deleted",
        taskId: id,
        taskTitle: task.title,
      });
    }
  }

  // Track epic changes
  const currentEpicIds = new Set<string>();
  for (const epic of currentEpics) {
    currentEpicIds.add(epic.id);
    const previous = lastEpicState.get(epic.id);

    if (!previous) {
      events.push({
        type: "epic_created",
        epicId: epic.id,
        epicTitle: epic.title,
        status: epic.status,
      });
    } else if (previous.updatedAt.getTime() !== epic.updatedAt.getTime()) {
      events.push({
        type: "epic_updated",
        epicId: epic.id,
        epicTitle: epic.title,
        status: epic.status,
      });
    }
  }

  for (const [id, epic] of lastEpicState) {
    if (!currentEpicIds.has(id)) {
      events.push({
        type: "epic_deleted",
        epicId: id,
        epicTitle: epic.title,
      });
    }
  }

  // Update state
  lastTaskState.clear();
  for (const task of currentTasks) {
    lastTaskState.set(task.id, {
      id: task.id,
      status: task.status,
      title: task.title,
      updatedAt: task.updatedAt,
    });
  }

  lastEpicState.clear();
  for (const epic of currentEpics) {
    lastEpicState.set(epic.id, {
      id: epic.id,
      status: epic.status,
      title: epic.title,
      updatedAt: epic.updatedAt,
    });
  }

  return events;
}

// Initialize state on first load
async function initializeState() {
  if (lastTaskState.size === 0 && lastEpicState.size === 0) {
    try {
      const db = getDb();
      const [currentTasks, currentEpics] = await Promise.all([
        db.select().from(tasks),
        db.select().from(epics),
      ]);

      for (const task of currentTasks) {
        lastTaskState.set(task.id, {
          id: task.id,
          status: task.status,
          title: task.title,
          updatedAt: task.updatedAt,
        });
      }

      for (const epic of currentEpics) {
        lastEpicState.set(epic.id, {
          id: epic.id,
          status: epic.status,
          title: epic.title,
          updatedAt: epic.updatedAt,
        });
      }
    } catch {
      // DB might not be ready yet
    }
  }
}

export async function GET(request: NextRequest) {
  await initializeState();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Poll for changes every 2 seconds
      const interval = setInterval(async () => {
        try {
          const events = await getChanges();
          for (const event of events) {
            const sseData = {
              ...event,
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`)
            );
          }
        } catch {
          // Ignore errors during polling
        }
      }, 2000);

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

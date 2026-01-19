import { NextRequest } from "next/server";
import { getDb, tasks } from "@/lib/db";

interface TaskState {
  id: string;
  status: string;
  title: string;
  updatedAt: Date;
}

let lastKnownState: Map<string, TaskState> = new Map();

async function getTaskChanges(): Promise<Array<{ task: TaskState; previousStatus: string }>> {
  const db = getDb();
  const currentTasks = await db.select().from(tasks);
  const changes: Array<{ task: TaskState; previousStatus: string }> = [];

  for (const task of currentTasks) {
    const previous = lastKnownState.get(task.id);
    if (previous && previous.status !== task.status) {
      changes.push({
        task: {
          id: task.id,
          status: task.status,
          title: task.title,
          updatedAt: task.updatedAt,
        },
        previousStatus: previous.status,
      });
    }
  }

  // Update state
  lastKnownState.clear();
  for (const task of currentTasks) {
    lastKnownState.set(task.id, {
      id: task.id,
      status: task.status,
      title: task.title,
      updatedAt: task.updatedAt,
    });
  }

  return changes;
}

// Initialize state on first load
async function initializeState() {
  if (lastKnownState.size === 0) {
    try {
      const db = getDb();
      const currentTasks = await db.select().from(tasks);
      for (const task of currentTasks) {
        lastKnownState.set(task.id, {
          id: task.id,
          status: task.status,
          title: task.title,
          updatedAt: task.updatedAt,
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
          const changes = await getTaskChanges();
          for (const change of changes) {
            const event = {
              type: "task_status_changed",
              taskId: change.task.id,
              taskTitle: change.task.title,
              previousStatus: change.previousStatus,
              newStatus: change.task.status,
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
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

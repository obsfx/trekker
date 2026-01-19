"use client";

import { useAppData } from "@/hooks/use-data";
import { useTaskEvents } from "@/hooks/use-task-events";
import { useUIStore } from "@/stores";
import { AppHeader } from "@/components/app-header";
import { KanbanBoard } from "@/components/kanban";
import { TaskDetailModal } from "@/components/task-detail";
import { EpicDetailModal } from "@/components/epic-detail";
import { CreateModal } from "@/components/create-modal";
import { ConnectionIndicator } from "@/components/shared/connection-indicator";

export default function Home() {
  const { tasks, epics, project, isLoading, error, refetch } = useAppData();
  const {
    selectedTaskId,
    selectedEpicId,
    showCreateModal,
    createModalDefaults,
    connectionStatus,
    openTaskDetail,
    openEpicDetail,
    openCreateModal,
    closeTaskDetail,
    closeEpicDetail,
    closeCreateModal,
  } = useUIStore();

  // Subscribe to SSE events
  useTaskEvents(refetch);

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) || null
    : null;

  const selectedEpic = selectedEpicId
    ? epics.find((e) => e.id === selectedEpicId) || null
    : null;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-destructive">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        projectName={project?.name}
        onNewClick={() => openCreateModal({ status: "todo" })}
      />

      <main className="flex-1 p-4 overflow-x-auto">
        <KanbanBoard
          tasks={tasks}
          epics={epics}
          onAddClick={(status) => openCreateModal({ status })}
          onTaskClick={(task) => openTaskDetail(task.id)}
          onEpicClick={(epic) => openEpicDetail(epic.id)}
        />
      </main>

      <footer className="px-4 py-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {tasks.length} tasks across {epics.length} epics
          </span>
          <ConnectionIndicator status={connectionStatus} />
        </div>
      </footer>

      {/* Modals */}
      <TaskDetailModal
        task={selectedTask}
        epics={epics}
        allTasks={tasks}
        open={selectedTask !== null}
        onClose={closeTaskDetail}
        onUpdate={refetch}
        onTaskClick={(task) => openTaskDetail(task.id)}
        onEpicClick={(epic) => {
          closeTaskDetail();
          openEpicDetail(epic.id);
        }}
      />

      <EpicDetailModal
        epic={selectedEpic}
        tasks={selectedEpic ? tasks.filter((t) => t.epicId === selectedEpic.id) : []}
        open={selectedEpic !== null}
        onClose={closeEpicDetail}
        onUpdate={refetch}
        onTaskClick={(task) => {
          closeEpicDetail();
          const fullTask = tasks.find((t) => t.id === task.id);
          if (fullTask) openTaskDetail(fullTask.id);
        }}
      />

      <CreateModal
        open={showCreateModal}
        onClose={closeCreateModal}
        onCreated={refetch}
        epics={epics}
        tasks={tasks}
        defaultStatus={createModalDefaults.status || "todo"}
      />
    </div>
  );
}

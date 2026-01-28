import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { resetDbState, closeDb } from "../../src/db/client-node";
import { initProject, isTrekkerInitialized, wipeProject } from "../../src/services/project";
import { createTask, getTask, listTasks, listSubtasks, updateTask, deleteTask } from "../../src/services/task";
import { createEpic, getEpic, listEpics, updateEpic, deleteEpic, completeEpic } from "../../src/services/epic";
import { createComment, getComment, listComments, updateComment, deleteComment } from "../../src/services/comment";
import { addDependency, removeDependency, getDependencies } from "../../src/services/dependency";
import { search } from "../../src/services/search";
import { listAll } from "../../src/services/list";
import { getHistory } from "../../src/services/history";
import type {
  Task,
  Epic,
  Comment,
  Dependency,
  CreateTaskInput,
  UpdateTaskInput,
  CreateEpicInput,
  UpdateEpicInput,
  TaskStatus,
  EpicStatus,
  CreateCommentInput,
  UpdateCommentInput,
} from "../../src/types";

// Store original cwd to restore after tests
let originalCwd: string;

export interface ServiceContext {
  cwd: string;
  // Project
  init: () => Promise<void>;
  isInitialized: () => boolean;
  wipe: () => void;
  // Tasks
  createTask: (input: CreateTaskInput) => Promise<Task>;
  getTask: (id: string) => Promise<Task | undefined>;
  listTasks: (options?: { status?: TaskStatus; epicId?: string; parentTaskId?: string | null }) => Promise<Task[]>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  // Subtasks (use task functions with parentTaskId)
  createSubtask: (parentTaskId: string, input: Omit<CreateTaskInput, "parentTaskId">) => Promise<Task>;
  listSubtasks: (parentTaskId: string) => Promise<Task[]>;
  // Epics
  createEpic: (input: CreateEpicInput) => Promise<Epic>;
  getEpic: (id: string) => Promise<Epic | undefined>;
  listEpics: (status?: EpicStatus) => Promise<Epic[]>;
  updateEpic: (id: string, input: UpdateEpicInput) => Promise<Epic>;
  deleteEpic: (id: string) => Promise<void>;
  completeEpic: (id: string) => Promise<{ epic: string; status: string; archived: { tasks: number; subtasks: number } }>;
  // Comments
  createComment: (input: CreateCommentInput) => Promise<Comment>;
  getComment: (id: string) => Promise<Comment | undefined>;
  listComments: (taskId: string) => Promise<Comment[]>;
  updateComment: (id: string, input: UpdateCommentInput) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
  // Dependencies
  addDependency: (taskId: string, dependsOnId: string) => Promise<Dependency>;
  removeDependency: (taskId: string, dependsOnId: string) => Promise<void>;
  getDependencies: (taskId: string) => Promise<{
    dependsOn: { taskId: string; dependsOnId: string }[];
    blocks: { taskId: string; dependsOnId: string }[];
  }>;
  // Search & List
  search: typeof search;
  listAll: typeof listAll;
  getHistory: typeof getHistory;
  // Cleanup
  cleanup: () => void;
}

/**
 * Creates an in-process test context that calls services directly.
 * Much faster than spawning CLI subprocesses (~10-20x).
 *
 * The subprocess approach spawns a new process for each command,
 * adding ~100-200ms overhead per call. In-process testing eliminates this.
 */
export function createServiceContext(): ServiceContext {
  // Skip embeddings for faster tests (prevents background async tasks)
  process.env.TREKKER_SKIP_EMBEDDINGS = "1";

  // Save original cwd on first call
  if (!originalCwd) {
    originalCwd = process.cwd();
  }

  // Create temp directory
  const cwd = mkdtempSync(join(tmpdir(), "trekker-test-"));

  // Reset DB state to clear any cached connection
  resetDbState();

  // Change to test directory
  process.chdir(cwd);

  return {
    cwd,

    // Project
    init: () => initProject(cwd),
    isInitialized: () => isTrekkerInitialized(cwd),
    wipe: () => wipeProject(cwd),

    // Tasks
    createTask: (input) => createTask(input),
    getTask: (id) => getTask(id),
    listTasks: (options) => listTasks(options),
    updateTask: (id, input) => updateTask(id, input),
    deleteTask: (id) => deleteTask(id),

    // Subtasks
    createSubtask: (parentTaskId, input) => createTask({ ...input, parentTaskId }),
    listSubtasks: (parentTaskId) => listSubtasks(parentTaskId),

    // Epics
    createEpic: (input) => createEpic(input),
    getEpic: (id) => getEpic(id),
    listEpics: (status) => listEpics(status),
    updateEpic: (id, input) => updateEpic(id, input),
    deleteEpic: (id) => deleteEpic(id),
    completeEpic: (id) => completeEpic(id),

    // Comments
    createComment: (input) => createComment(input),
    getComment: (id) => getComment(id),
    listComments: (taskId) => listComments(taskId),
    updateComment: (id, input) => updateComment(id, input),
    deleteComment: (id) => deleteComment(id),

    // Dependencies
    addDependency: (taskId, dependsOnId) => addDependency(taskId, dependsOnId),
    removeDependency: (taskId, dependsOnId) => removeDependency(taskId, dependsOnId),
    getDependencies: (taskId) => getDependencies(taskId),

    // Search & List
    search: (query, options) => search(query, options),
    listAll: (options) => listAll(options),
    getHistory: (options) => getHistory(options),

    cleanup: () => {
      // Close DB connection first
      closeDb();
      // Reset state for next test
      resetDbState();
      // Restore original cwd
      process.chdir(originalCwd);
      // Remove temp directory
      rmSync(cwd, { recursive: true, force: true });
    },
  };
}

/**
 * Helper to initialize trekker in the context
 */
export async function initTrekkerService(ctx: ServiceContext): Promise<void> {
  await ctx.init();
}

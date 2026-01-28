import { Command } from "commander";
import {
  requireSqliteInstance,
  isSqliteVecAvailable,
  upsertEmbedding,
  setEmbeddingMeta,
} from "../db/client";
import { ensureModelLoaded, embedBatch, resetModelState } from "../services/embedding";
import { handleCommandError, success, info, isToonMode, output } from "../utils/output";

interface ReindexResult {
  success: boolean;
  total: number;
  tasks: number;
  epics: number;
  comments: number;
  lastReindex: string;
}

interface TaskRow {
  id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
}

interface EpicRow {
  id: string;
  title: string;
  description: string | null;
}

interface CommentRow {
  id: string;
  content: string;
}

export const reindexCommand = new Command("reindex")
  .description("Rebuild semantic search embeddings")
  .option("--embeddings", "Rebuild semantic search embeddings (required)")
  .action(async (options) => {
    try {
      if (!options.embeddings) {
        throw new Error(
          "No reindex target specified. Use --embeddings to rebuild semantic search embeddings."
        );
      }

      const result = await reindexEmbeddings();

      if (isToonMode()) {
        output(result);
      } else {
        success(`Reindex complete. ${result.total} entities indexed.`);
      }
    } catch (err) {
      handleCommandError(err);
    }
  });

async function reindexEmbeddings(): Promise<ReindexResult> {
  info("Rebuilding semantic search index...");

  // 1. Get database (this initializes sqlite-vec check)
  const sqlite = requireSqliteInstance();

  // 2. Check sqlite-vec is available
  if (!isSqliteVecAvailable()) {
    throw new Error(
      "Cannot reindex: sqlite-vec extension is not available. Your SQLite build does not support dynamic extension loading."
    );
  }

  // 3. Ensure model loads (reset state first to allow retry)
  resetModelState();
  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    throw new Error("Cannot reindex: embedding model failed to load");
  }

  // 4. Clear existing embeddings
  sqlite.run("DELETE FROM embeddings");

  // 5. Fetch all entities
  const tasks = sqlite
    .query<TaskRow, []>(
      "SELECT id, parent_task_id, title, description FROM tasks"
    )
    .all();
  const epics = sqlite
    .query<EpicRow, []>("SELECT id, title, description FROM epics")
    .all();
  const comments = sqlite
    .query<CommentRow, []>("SELECT id, content FROM comments")
    .all();

  const total = tasks.length + epics.length + comments.length;
  info(`Indexing ${total} entities...`);

  let tasksIndexed = 0;
  let epicsIndexed = 0;
  let commentsIndexed = 0;

  // 6. Index tasks
  if (tasks.length > 0) {
    const taskTexts = tasks.map((t) => {
      const parts = [t.title];
      if (t.description) parts.push(t.description);
      return parts.join(" ");
    });

    const taskEmbeddings = await embedBatch(taskTexts);
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const entityType = task.parent_task_id ? "subtask" : "task";
      upsertEmbedding(task.id, entityType, taskEmbeddings[i]);
      tasksIndexed++;
    }
    info(`  ✓ ${tasksIndexed} tasks indexed`);
  }

  // 7. Index epics
  if (epics.length > 0) {
    const epicTexts = epics.map((e) => {
      const parts = [e.title];
      if (e.description) parts.push(e.description);
      return parts.join(" ");
    });

    const epicEmbeddings = await embedBatch(epicTexts);
    for (let i = 0; i < epics.length; i++) {
      upsertEmbedding(epics[i].id, "epic", epicEmbeddings[i]);
      epicsIndexed++;
    }
    info(`  ✓ ${epicsIndexed} epics indexed`);
  }

  // 8. Index comments
  if (comments.length > 0) {
    const commentTexts = comments.map((c) => c.content);

    const commentEmbeddings = await embedBatch(commentTexts);
    for (let i = 0; i < comments.length; i++) {
      upsertEmbedding(comments[i].id, "comment", commentEmbeddings[i]);
      commentsIndexed++;
    }
    info(`  ✓ ${commentsIndexed} comments indexed`);
  }

  // 9. Update metadata
  const lastReindex = new Date().toISOString();
  setEmbeddingMeta("last_reindex", lastReindex);

  return {
    success: true,
    total,
    tasks: tasksIndexed,
    epics: epicsIndexed,
    comments: commentsIndexed,
    lastReindex,
  };
}

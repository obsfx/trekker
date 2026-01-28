import { Command } from "commander";
import { getDb, requireSqliteInstance } from "../db/client-node";
import { clearAllEmbeddings, upsertEmbedding } from "../db/vectors";
import { ensureModelLoaded, embedBatch, resetModelState } from "../services/embedding";
import { handleCommandError, success, info, isToonMode, output } from "../utils/output";
import { buildEntityText } from "../utils/text";

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

  // Initialize database first (async with sql.js)
  await getDb();
  const sqlite = requireSqliteInstance();

  resetModelState();
  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    throw new Error("Cannot reindex: embedding model failed to load");
  }

  await clearAllEmbeddings();

  // Fetch all entities using sql.js prepared statements
  const tasksStmt = sqlite.prepare("SELECT id, parent_task_id, title, description FROM tasks");
  const tasks: TaskRow[] = [];
  while (tasksStmt.step()) {
    tasks.push(tasksStmt.getAsObject() as TaskRow);
  }
  tasksStmt.free();

  const epicsStmt = sqlite.prepare("SELECT id, title, description FROM epics");
  const epics: EpicRow[] = [];
  while (epicsStmt.step()) {
    epics.push(epicsStmt.getAsObject() as EpicRow);
  }
  epicsStmt.free();

  const commentsStmt = sqlite.prepare("SELECT id, content FROM comments");
  const comments: CommentRow[] = [];
  while (commentsStmt.step()) {
    comments.push(commentsStmt.getAsObject() as CommentRow);
  }
  commentsStmt.free();

  const total = tasks.length + epics.length + comments.length;
  info(`Indexing ${total} entities...`);

  const tasksIndexed = await indexTasks(tasks);
  const epicsIndexed = await indexEpics(epics);
  const commentsIndexed = await indexComments(comments);
  const lastReindex = new Date().toISOString();

  return {
    success: true,
    total,
    tasks: tasksIndexed,
    epics: epicsIndexed,
    comments: commentsIndexed,
    lastReindex,
  };
}

async function indexTasks(tasks: TaskRow[]): Promise<number> {
  if (tasks.length === 0) return 0;

  const texts = tasks.map((t) => buildEntityText(t));
  const embeddings = await embedBatch(texts);

  for (let i = 0; i < tasks.length; i++) {
    const entityType = tasks[i].parent_task_id ? "subtask" : "task";
    await upsertEmbedding(tasks[i].id, entityType, embeddings[i]);
  }

  info(`  ✓ ${tasks.length} tasks indexed`);
  return tasks.length;
}

async function indexEpics(epics: EpicRow[]): Promise<number> {
  if (epics.length === 0) return 0;

  const texts = epics.map((e) => buildEntityText(e));
  const embeddings = await embedBatch(texts);

  for (let i = 0; i < epics.length; i++) {
    await upsertEmbedding(epics[i].id, "epic", embeddings[i]);
  }

  info(`  ✓ ${epics.length} epics indexed`);
  return epics.length;
}

async function indexComments(comments: CommentRow[]): Promise<number> {
  if (comments.length === 0) return 0;

  const texts = comments.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  for (let i = 0; i < comments.length; i++) {
    await upsertEmbedding(comments[i].id, "comment", embeddings[i]);
  }

  info(`  ✓ ${comments.length} comments indexed`);
  return comments.length;
}

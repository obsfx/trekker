import { Command } from "commander";
import {
  createComment,
  listComments,
  updateComment,
  deleteComment,
} from "../services/comment";
import { validateRequired } from "../utils/validator";
import {
  success,
  formatComment,
  formatCommentList,
  handleCommandError,
  outputResult,
  isToonMode,
  output,
} from "../utils/output";

export const commentCommand = new Command("comment").description("Manage comments");

commentCommand
  .command("add <task-id>")
  .description("Add a comment to a task")
  .requiredOption("-a, --author <author>", "Comment author")
  .requiredOption("-c, --content <content>", "Comment content")
  .action(async (taskId, options) => {
    try {
      validateRequired(options.author, "Author");
      validateRequired(options.content, "Content");

      const comment = await createComment({
        taskId,
        author: options.author,
        content: options.content,
      });

      outputResult(comment, formatComment, `Comment added: ${comment.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

commentCommand
  .command("list <task-id>")
  .description("List all comments on a task")
  .action(async (taskId) => {
    try {
      const comments = await listComments(taskId);

      if (isToonMode()) {
        output(comments);
      } else {
        if (comments.length === 0) {
          console.log(`No comments on ${taskId}`);
        } else {
          console.log(`Comments on ${taskId}:`);
          console.log(formatCommentList(comments));
        }
      }
    } catch (err) {
      handleCommandError(err);
    }
  });

commentCommand
  .command("update <comment-id>")
  .description("Update a comment")
  .requiredOption("-c, --content <content>", "New comment content")
  .action(async (commentId, options) => {
    try {
      validateRequired(options.content, "Content");

      const comment = await updateComment(commentId, {
        content: options.content,
      });

      outputResult(comment, formatComment, `Comment updated: ${comment.id}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

commentCommand
  .command("delete <comment-id>")
  .description("Delete a comment")
  .action(async (commentId) => {
    try {
      await deleteComment(commentId);
      success(`Comment deleted: ${commentId}`);
    } catch (err) {
      handleCommandError(err);
    }
  });

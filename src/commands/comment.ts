import { Command } from 'commander';
import { CommentService } from '@/src/services/comment';
import { Validator } from '@/src/utils/validator';
import { Output } from '@/src/utils/output';
import type {
  CommentAddOptions,
  CommentUpdateOptions,
  PaginationOptions,
} from '@/src/types/options';

export const commentCommand = new Command('comment').description('Manage comments');

commentCommand
  .command('add <task-id>')
  .description('Add a comment to a task')
  .requiredOption('-a, --author <author>', 'Comment author')
  .requiredOption('-c, --content <content>', 'Comment content')
  .action((taskId: string, options: CommentAddOptions) => {
    try {
      Validator.validateRequired(options.author, 'Author');
      Validator.validateRequired(options.content, 'Content');

      const comment = CommentService.createComment({
        taskId,
        author: options.author,
        content: options.content,
      });

      Output.outputResult(comment, Output.formatComment, `Comment added: ${comment.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

commentCommand
  .command('list <task-id>')
  .description('List all comments on a task')
  .option('--limit <n>', 'Results per page (default: 50)', '50')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action((taskId: string, options: PaginationOptions) => {
    try {
      const { limit, page } = Validator.parsePaginationOptions(options);

      const result = CommentService.listComments(taskId, { limit, page });

      Output.outputResult(result, Output.formatPaginatedCommentList);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

commentCommand
  .command('update <comment-id>')
  .description('Update a comment')
  .requiredOption('-c, --content <content>', 'New comment content')
  .action((commentId: string, options: CommentUpdateOptions) => {
    try {
      Validator.validateRequired(options.content, 'Content');

      const comment = CommentService.updateComment(commentId, {
        content: options.content,
      });

      Output.outputResult(comment, Output.formatComment, `Comment updated: ${comment.id}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

commentCommand
  .command('delete <comment-id>')
  .description('Delete a comment')
  .action((commentId: string) => {
    try {
      CommentService.deleteComment(commentId);
      Output.success(`Comment deleted: ${commentId}`);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });

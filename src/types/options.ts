export interface PaginationOptions {
  limit: string;
  page: string;
}

export interface TaskCreateOptions {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  tags?: string;
  epic?: string;
}

export interface TaskListOptions extends PaginationOptions {
  status?: string;
  epic?: string;
}

export interface TaskUpdateOptions {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  tags?: string;
  epic?: string | false;
}

export interface EpicCreateOptions {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
}

export interface EpicListOptions extends PaginationOptions {
  status?: string;
}

export interface EpicUpdateOptions {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
}

export interface SubtaskCreateOptions {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
}

export interface SubtaskUpdateOptions {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
}

export interface CommentAddOptions {
  author: string;
  content: string;
}

export interface CommentUpdateOptions {
  content: string;
}

export interface SearchCommandOptions extends PaginationOptions {
  type?: string;
  status?: string;
  rebuildIndex?: boolean;
}

export interface HistoryCommandOptions extends PaginationOptions {
  entity?: string;
  type?: string;
  action?: string;
  since?: string;
  until?: string;
}

export interface ListCommandOptions extends PaginationOptions {
  type?: string;
  status?: string;
  priority?: string;
  since?: string;
  until?: string;
  sort: string;
}

export type ReadyCommandOptions = PaginationOptions;

export interface SeedCommandOptions {
  force?: boolean;
}

export interface WipeCommandOptions {
  yes?: boolean;
}

export interface ProgramOptions {
  toon?: boolean;
}

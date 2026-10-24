import type { AsyncResource } from '@/ui/lib/async-resource.ts';
import type { CommentThreads } from '@/ui/lib/comment-threads.ts';
import type { EpicDetail, TaskDetail } from '@/ui/lib/detail-shapes.ts';
import type { HistoryFeed } from '@/ui/lib/history-feed.ts';
import { type HistoryEvent, HistoryShapes } from '@/ui/lib/history-shapes.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import type { ItemLists } from '@/ui/lib/item-lists.ts';
import type { PagedListRegistry } from '@/ui/lib/paged-list-registry.ts';
import type { ProjectInfo } from '@/ui/lib/project-shapes.ts';
import type { ResourceCache } from '@/ui/lib/resource-cache.ts';
import type { SearchQuery } from '@/ui/lib/search-queries.ts';
import type { EventStream, StreamSignal } from '@/ui/lib/server-events.ts';

export interface SyncTargets {
  lists: ItemLists;
  searches: PagedListRegistry<SearchQuery, SearchHit>;
  history: HistoryFeed;
  tasks: ResourceCache<TaskDetail>;
  epics: ResourceCache<EpicDetail>;
  comments: CommentThreads;
  project: AsyncResource<ProjectInfo>;
}

export class ServerEventSync {
  private static readonly flushDelayMs = 120;
  private static readonly fullRefreshThreshold = 1000;

  private readonly stream: EventStream;
  private readonly targets: SyncTargets;
  private batch: HistoryEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> = Promise.resolve();

  constructor(stream: EventStream, targets: SyncTargets) {
    this.stream = stream;
    this.targets = targets;
  }

  private static isItemEntity(event: HistoryEvent) {
    return (
      event.entityType === 'epic' || event.entityType === 'task' || event.entityType === 'subtask'
    );
  }

  private static readonly renamesShownElsewhere = (event: HistoryEvent) => {
    return event.entityType === 'epic' && event.changes?.title !== undefined;
  };

  start() {
    const unsubscribe = this.stream.subscribe((signal) => {
      this.receive(signal);
    });
    return () => {
      unsubscribe();
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
    };
  }

  private receive(signal: StreamSignal) {
    if (signal.kind === 'reset') {
      this.batch = [];
      this.refreshEverything();
      return;
    }
    this.batch.push(signal.event);
    this.flushTimer ??= setTimeout(() => {
      this.flushTimer = null;
      const events = this.batch;
      this.batch = [];
      this.flushing = this.flushing.then(() => {
        return this.flush(events);
      });
    }, ServerEventSync.flushDelayMs);
  }

  private async flush(events: HistoryEvent[]) {
    if (events.length === 0) {
      return;
    }
    if (events.length > ServerEventSync.fullRefreshThreshold) {
      this.refreshEverything();
      return;
    }
    const { lists, searches, history, tasks, epics, comments, project } = this.targets;
    history.receive(events);
    searches.invalidateAll();
    const deleted = new Set<string>();
    const touched = new Set<string>();
    for (const event of events) {
      for (const id of HistoryShapes.affectedIds(event)) {
        touched.add(id);
      }
      if (ServerEventSync.isItemEntity(event) && event.action === 'delete') {
        deleted.add(event.entityId);
      }
      if (event.entityType === 'comment' && event.taskId) {
        void comments.refresh(event.taskId);
      }
    }
    for (const id of touched) {
      tasks.invalidate(id);
      epics.invalidate(id);
    }
    project.invalidate();
    if (events.some(ServerEventSync.renamesShownElsewhere)) {
      lists.invalidateAll();
      return;
    }
    lists.apply([], deleted);
    const refreshable = [...touched].filter((id) => {
      return !deleted.has(id);
    });
    try {
      await lists.refreshIds(refreshable);
      await lists.refreshTotals();
    } catch {
      lists.invalidateAll();
    }
  }

  private refreshEverything() {
    const { lists, searches, history, tasks, epics, comments, project } = this.targets;
    lists.invalidateAll();
    searches.invalidateAll();
    history.invalidateAll();
    tasks.invalidateAll();
    epics.invalidateAll();
    comments.invalidateAll();
    project.invalidate();
  }
}

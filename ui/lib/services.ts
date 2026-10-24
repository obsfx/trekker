import { AsyncResource } from '@/ui/lib/async-resource.ts';
import { Board } from '@/ui/lib/board.ts';
import { Clock } from '@/ui/lib/clock.ts';
import { CommentThreads } from '@/ui/lib/comment-threads.ts';
import type { EpicDetail, TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { EpicActions } from '@/ui/lib/epic-actions.ts';
import type {
  EpicGateway,
  HistoryGateway,
  ItemGateway,
  ProjectGateway,
  SearchHit,
  TaskGateway,
} from '@/ui/lib/gateways.ts';
import { HistoryFeed } from '@/ui/lib/history-feed.ts';
import { ItemLists } from '@/ui/lib/item-lists.ts';
import { PagedListRegistry } from '@/ui/lib/paged-list-registry.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import type { ProjectInfo } from '@/ui/lib/project-shapes.ts';
import { ProjectSettings } from '@/ui/lib/project-settings.ts';
import { ResourceCache } from '@/ui/lib/resource-cache.ts';
import { type SearchQuery, SearchQueries } from '@/ui/lib/search-queries.ts';
import { ServerEventSync } from '@/ui/lib/server-event-sync.ts';
import type { EventStream } from '@/ui/lib/server-events.ts';
import { TaskActions } from '@/ui/lib/task-actions.ts';

export interface Gateways {
  items: ItemGateway;
  tasks: TaskGateway;
  epics: EpicGateway;
  history: HistoryGateway;
  project: ProjectGateway;
  events: EventStream;
}

export class Services {
  readonly gateways: Gateways;
  readonly project: AsyncResource<ProjectInfo>;
  readonly projectSettings: ProjectSettings;
  readonly lists: ItemLists;
  readonly board: Board;
  readonly clock: Clock;
  readonly searches: PagedListRegistry<SearchQuery, SearchHit>;
  readonly history: HistoryFeed;
  readonly taskDetails: ResourceCache<TaskDetail>;
  readonly epicDetails: ResourceCache<EpicDetail>;
  readonly comments: CommentThreads;
  readonly taskActions: TaskActions;
  readonly epicActions: EpicActions;
  readonly serverSync: ServerEventSync;
  readonly events: EventStream;

  constructor(gateways: Gateways, notices: NoticePort) {
    this.gateways = gateways;
    this.clock = new Clock(Clock.minuteMs);
    this.events = gateways.events;
    const gate = () => {
      return gateways.events.ready();
    };
    this.project = new AsyncResource(async () => {
      await gate();
      return gateways.project.load();
    });
    this.projectSettings = new ProjectSettings(gateways.project, this.project, notices);
    this.lists = new ItemLists(gateways.items, gate);
    this.board = new Board(this.lists, gateways.items, notices);
    this.searches = new PagedListRegistry<SearchQuery, SearchHit>(
      SearchQueries.key,
      async (query, cursor) => {
        if (query.text === '') {
          return SearchQueries.emptyPage();
        }
        await gate();
        return gateways.items.search(query, cursor);
      },
      (hit) => {
        return hit.id;
      }
    );
    this.history = new HistoryFeed(gateways.history, gate);
    this.taskDetails = new ResourceCache(async (id) => {
      await gate();
      return gateways.tasks.get(id);
    });
    this.epicDetails = new ResourceCache(async (id) => {
      await gate();
      return gateways.epics.get(id);
    });
    this.comments = new CommentThreads(gateways.tasks, gate);
    this.taskActions = new TaskActions(
      gateways.tasks,
      this.taskDetails,
      this.lists,
      this.comments,
      notices
    );
    this.epicActions = new EpicActions(gateways.epics, this.epicDetails, this.lists, notices);
    this.serverSync = new ServerEventSync(gateways.events, {
      lists: this.lists,
      searches: this.searches,
      history: this.history,
      tasks: this.taskDetails,
      epics: this.epicDetails,
      comments: this.comments,
      project: this.project,
    });
  }
}

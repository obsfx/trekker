import plur from 'plur';

import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import type { EventStream } from '@/ui/lib/server-events.ts';

type NoticeChange = 'created' | 'moved';

export interface DesktopNotice {
  title: string;
  body: string;
  path: string;
}

export interface DescribedChange extends DesktopNotice {
  change: NoticeChange;
}

export interface DesktopNotificationPorts {
  enabled: () => boolean;
  hidden: () => boolean;
  show: (notice: DesktopNotice) => void;
}

export class DesktopNotifications {
  private static readonly windowMs = 1000;
  private static readonly coalesceAbove = 3;

  private readonly stream: EventStream;
  private readonly ports: DesktopNotificationPorts;
  private pending: DescribedChange[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(stream: EventStream, ports: DesktopNotificationPorts) {
    this.stream = stream;
    this.ports = ports;
  }

  static describe(event: HistoryEvent): DescribedChange | null {
    if (
      event.entityType !== 'epic' &&
      event.entityType !== 'task' &&
      event.entityType !== 'subtask'
    ) {
      return null;
    }
    const path = AppRoutes.item({ kind: event.entityType, id: event.entityId });
    const body = event.title ?? '';
    if (event.action === 'create') {
      return { title: `${event.entityId} created`, body, path, change: 'created' };
    }
    const status = ItemStatuses.all.find((value) => {
      return value === event.changes?.status?.to;
    });
    if (event.action === 'update' && status) {
      return {
        title: `${event.entityId} moved to ${ItemStatuses.label(status)}`,
        body,
        path,
        change: 'moved',
      };
    }
    return null;
  }

  static summarize(notices: readonly DescribedChange[]): DesktopNotice[] {
    if (notices.length <= DesktopNotifications.coalesceAbove) {
      return [...notices];
    }
    const created = notices.filter((notice) => {
      return notice.change === 'created';
    }).length;
    const moved = notices.length - created;
    const parts: string[] = [];
    if (created > 0) {
      parts.push(`${String(created)} created`);
    }
    if (moved > 0) {
      parts.push(`${String(moved)} moved`);
    }
    return [
      {
        title: `${String(notices.length)} ${plur('change', notices.length)} in trekker`,
        body: parts.join(', '),
        path: '/history',
      },
    ];
  }

  start() {
    const unsubscribe = this.stream.subscribe((signal) => {
      if (signal.kind !== 'event' || !this.ports.enabled() || !this.ports.hidden()) {
        return;
      }
      const notice = DesktopNotifications.describe(signal.event);
      if (!notice) {
        return;
      }
      this.pending.push(notice);
      this.timer ??= setTimeout(() => {
        this.timer = null;
        const notices = DesktopNotifications.summarize(this.pending);
        this.pending = [];
        for (const summary of notices) {
          this.ports.show(summary);
        }
      }, DesktopNotifications.windowMs);
    });
    return () => {
      unsubscribe();
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.pending = [];
    };
  }
}

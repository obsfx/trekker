import type { ItemKind } from '@/ui/lib/item-kinds.ts';

interface RoutableItem {
  kind: ItemKind;
  id: string;
}

export abstract class AppRoutes {
  static readonly board = '/';
  static readonly list = '/list';
  static readonly history = '/history';
  static readonly task = '/tasks/:id';
  static readonly epic = '/epics/:id';
  static readonly settings = '/settings';

  static readonly patterns: readonly string[] = [
    AppRoutes.board,
    AppRoutes.list,
    AppRoutes.history,
    AppRoutes.task,
    AppRoutes.epic,
    AppRoutes.settings,
  ];

  static item(item: RoutableItem) {
    if (item.kind === 'epic') {
      return `/epics/${encodeURIComponent(item.id)}`;
    }
    return `/tasks/${encodeURIComponent(item.id)}`;
  }
}

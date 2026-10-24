import type { HistoryAction, HistoryEntity } from '@/ui/lib/history-shapes.ts';
import type { LabeledOption } from '@/ui/lib/labeled-option.ts';

export abstract class HistoryFilters {
  static readonly typeOptions: readonly LabeledOption<HistoryEntity>[] = [
    { value: 'epic', label: 'Epic' },
    { value: 'task', label: 'Task' },
    { value: 'subtask', label: 'Subtask' },
    { value: 'comment', label: 'Comment' },
    { value: 'dependency', label: 'Dependency' },
  ];

  static readonly actionOptions: readonly LabeledOption<HistoryAction>[] = [
    { value: 'create', label: 'Created' },
    { value: 'update', label: 'Updated' },
    { value: 'delete', label: 'Deleted' },
  ];
}

import type { EpicDraft, TaskDraft } from '@/ui/lib/gateways.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import type { LabeledOption } from '@/ui/lib/labeled-option.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import { TagLists } from '@/ui/lib/tag-lists.ts';
import { TextQueries } from '@/ui/lib/text-queries.ts';

export type CreateKind = 'task' | 'subtask' | 'epic';

export interface CreateDefaults {
  kind: CreateKind;
  status: ItemStatus;
  epicId: string | null;
  parentTaskId: string | null;
}

export interface ParentChoice {
  id: string;
  title: string;
}

export interface CreateFormState {
  kind: CreateKind;
  title: string;
  description: string;
  status: ItemStatus;
  priority: Priority;
  epicId: string | null;
  parent: ParentChoice | null;
  tags: string;
  createAnother: boolean;
  submitted: boolean;
}

export type CreateProblem = 'title' | 'parent';

export abstract class CreateForms {
  static readonly kinds: readonly LabeledOption<CreateKind>[] = [
    { value: 'task', label: 'Task' },
    { value: 'subtask', label: 'Subtask' },
    { value: 'epic', label: 'Epic' },
  ];

  static initial(defaults: CreateDefaults): CreateFormState {
    return {
      kind: defaults.kind,
      title: '',
      description: '',
      status: CreateForms.statusFor(defaults.kind, defaults.status),
      priority: 2,
      epicId: defaults.epicId,
      parent: defaults.parentTaskId ? { id: defaults.parentTaskId, title: '' } : null,
      tags: '',
      createAnother: false,
      submitted: false,
    };
  }

  static statusFor(kind: CreateKind, status: ItemStatus): ItemStatus {
    if (kind === 'epic' && !KindStatuses.of('epic').includes(status)) {
      return 'todo';
    }
    return status;
  }

  static problems(form: CreateFormState): CreateProblem[] {
    const problems: CreateProblem[] = [];
    if (TextQueries.isBlank(form.title)) {
      problems.push('title');
    }
    if (form.kind === 'subtask' && form.parent === null) {
      problems.push('parent');
    }
    return problems;
  }

  static taskDraft(form: CreateFormState): TaskDraft {
    const isSubtask = form.kind === 'subtask';
    return {
      title: form.title.trim(),
      description: CreateForms.description(form),
      priority: form.priority,
      status: form.status,
      epicId: isSubtask ? null : form.epicId,
      parentTaskId: isSubtask ? (form.parent?.id ?? null) : null,
      tags: TagLists.add([], form.tags),
    };
  }

  static epicDraft(form: CreateFormState): EpicDraft {
    return {
      title: form.title.trim(),
      description: CreateForms.description(form),
      priority: form.priority,
      status: CreateForms.statusFor('epic', form.status),
    };
  }

  static next(form: CreateFormState): CreateFormState {
    return { ...form, title: '', description: '', tags: '', submitted: false };
  }

  static kindLabel(kind: CreateKind) {
    const label = CreateForms.kinds.find((entry) => {
      return entry.value === kind;
    })?.label;
    return label ?? 'Task';
  }

  static submitLabel(kind: CreateKind) {
    return `Create ${CreateForms.kindLabel(kind).toLowerCase()}`;
  }

  private static description(form: CreateFormState) {
    const text = form.description.trim();
    if (text === '') {
      return null;
    }
    return text;
  }
}

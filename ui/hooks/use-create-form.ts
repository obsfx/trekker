import { type KeyboardEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useServices } from '@/ui/context/services/use-services.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { CreateForms, type CreateFormState, type ParentChoice } from '@/ui/lib/create-forms.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { KeyChords } from '@/ui/lib/key-chords.ts';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import type { CreateDefaults, CreateKind } from '@/ui/lib/create-forms.ts';

export const useCreateForm = (defaults: CreateDefaults, onDone: () => void) => {
  const { taskActions, epicActions } = useServices();
  const navigate = useNavigate();
  const titleRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreateFormState>(() => {
    return CreateForms.initial(defaults);
  });
  const [busy, setBusy] = useState(false);
  const problems = form.submitted ? CreateForms.problems(form) : [];

  const patch = (change: Partial<CreateFormState>) => {
    setForm((current) => {
      return { ...current, ...change };
    });
  };

  const create = async () => {
    if (form.kind === 'epic') {
      return epicActions.create(CreateForms.epicDraft(form));
    }
    return taskActions.create(CreateForms.taskDraft(form));
  };

  const submit = async () => {
    if (busy) {
      return;
    }
    if (CreateForms.problems(form).length > 0) {
      patch({ submitted: true });
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    const created = await create();
    setBusy(false);
    if (!created) {
      return;
    }
    if (form.createAnother) {
      setForm(CreateForms.next(form));
      titleRef.current?.focus();
      return;
    }
    onDone();
    void navigate(AppRoutes.item(created));
  };

  return {
    form,
    busy,
    titleRef,
    titleInvalid: problems.includes('title'),
    parentInvalid: problems.includes('parent'),
    statuses: KindStatuses.of(form.kind),
    submitLabel: CreateForms.submitLabel(form.kind),
    submitModifier: KeyChords.submitModifier(),
    setKind: (kind: CreateKind) => {
      patch({ kind, status: CreateForms.statusFor(kind, form.status) });
    },
    setTitle: (title: string) => {
      patch({ title });
    },
    setDescription: (description: string) => {
      patch({ description });
    },
    setStatus: (status: ItemStatus) => {
      patch({ status });
    },
    setPriority: (priority: Priority) => {
      patch({ priority });
    },
    setEpic: (epicId: string | null) => {
      patch({ epicId });
    },
    setParent: (hit: SearchHit) => {
      const parent: ParentChoice = { id: hit.id, title: hit.title };
      patch({ parent });
    },
    setTags: (tags: string) => {
      patch({ tags });
    },
    setCreateAnother: (createAnother: boolean) => {
      patch({ createAnother });
    },
    submit: () => {
      void submit();
    },
    onKeyDown: (event: KeyboardEvent<HTMLFormElement>) => {
      if (KeyChords.isSubmit(event)) {
        event.preventDefault();
        void submit();
      }
    },
  };
};

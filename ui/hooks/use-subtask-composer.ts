import { type KeyboardEvent, useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { KeyChords } from '@/ui/lib/key-chords.ts';

export const useSubtaskComposer = (task: TaskDetail) => {
  const { taskActions } = useServices();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = title.trim();
    if (trimmed === '' || busy) {
      return;
    }
    setBusy(true);
    const created = await taskActions.create({
      title: trimmed,
      description: null,
      priority: task.priority,
      status: 'todo',
      epicId: null,
      parentTaskId: task.id,
      tags: [],
    });
    setBusy(false);
    if (created) {
      setTitle('');
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (KeyChords.isPlainEnter(event)) {
      event.preventDefault();
      void submit();
      return;
    }
    if (KeyChords.isEscape(event)) {
      setTitle('');
    }
  };

  return { title, setTitle, busy, onKeyDown };
};

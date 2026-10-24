import { create } from 'zustand';

import type { CreateDefaults } from '@/ui/lib/create-forms.ts';

interface CreateDialogState {
  open: boolean;
  defaults: CreateDefaults;
  show: (defaults?: Partial<CreateDefaults>) => void;
  close: () => void;
}

const DEFAULTS: CreateDefaults = { kind: 'task', status: 'todo', epicId: null, parentTaskId: null };

export const useCreateDialogStore = create<CreateDialogState>()((set) => {
  return {
    open: false,
    defaults: DEFAULTS,
    show: (defaults) => {
      set({ open: true, defaults: { ...DEFAULTS, ...defaults } });
    },
    close: () => {
      set({ open: false });
    },
  };
});

import { create } from 'zustand';

import type { NoticePort } from '@/ui/lib/notices.ts';

interface Notice {
  id: number;
  tone: 'error' | 'info';
  message: string;
}

interface NoticeState {
  notices: Notice[];
  nextId: number;
  push: (tone: Notice['tone'], message: string) => void;
  dismiss: (id: number) => void;
}

const NOTICE_LIFETIME_MS = 6000;

export const useNoticeStore = create<NoticeState>()((set, get) => {
  return {
    notices: [],
    nextId: 1,
    push: (tone, message) => {
      const id = get().nextId;
      set({ notices: [...get().notices, { id, tone, message }], nextId: id + 1 });
      setTimeout(() => {
        get().dismiss(id);
      }, NOTICE_LIFETIME_MS);
    },
    dismiss: (id) => {
      set({
        notices: get().notices.filter((notice) => {
          return notice.id !== id;
        }),
      });
    },
  };
});

export const noticePort: NoticePort = {
  error: (message) => {
    useNoticeStore.getState().push('error', message);
  },
  info: (message) => {
    useNoticeStore.getState().push('info', message);
  },
};

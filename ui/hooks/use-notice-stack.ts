import { useNoticeStore } from '@/ui/store/notice-store.ts';

export const useNoticeStack = () => {
  const notices = useNoticeStore((state) => {
    return state.notices;
  });
  const dismiss = useNoticeStore((state) => {
    return state.dismiss;
  });
  return { notices, dismiss };
};

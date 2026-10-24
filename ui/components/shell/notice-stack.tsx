import { NoticeToast } from '@/ui/primitives/notice-toast.tsx';
import { useNoticeStack } from '@/ui/hooks/use-notice-stack.ts';

export function NoticeStack() {
  const { notices, dismiss } = useNoticeStack();
  return (
    <div className="fixed right-3 bottom-3 z-50 flex flex-col gap-1.5">
      {notices.map((notice) => {
        return (
          <NoticeToast
            key={notice.id}
            tone={notice.tone}
            onDismiss={() => {
              dismiss(notice.id);
            }}
          >
            {notice.message}
          </NoticeToast>
        );
      })}
    </div>
  );
}

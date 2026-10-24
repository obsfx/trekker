import { Outlet } from 'react-router';

import { CreateDialog } from '@/ui/components/create/create-dialog.tsx';
import { AppTopBar } from '@/ui/components/shell/app-top-bar.tsx';
import { NoticeStack } from '@/ui/components/shell/notice-stack.tsx';
import { useAppSync } from '@/ui/hooks/use-app-sync.ts';

export function AppLayout() {
  useAppSync();
  return (
    <div className="flex h-full flex-col">
      <AppTopBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <CreateDialog />
      <NoticeStack />
    </div>
  );
}

import { AuthorSetting } from '@/ui/components/settings/author-setting.tsx';
import { NotificationSetting } from '@/ui/components/settings/notification-setting.tsx';
import { PrefixSettings } from '@/ui/components/settings/prefix-settings.tsx';
import { ThemeSetting } from '@/ui/components/settings/theme-setting.tsx';

export function SettingsPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4">
        <h1 className="text-base font-semibold text-fg">Settings</h1>
        <PrefixSettings />
        <AuthorSetting />
        <ThemeSetting />
        <NotificationSetting />
      </div>
    </div>
  );
}

import { TbBell } from 'react-icons/tb';

import { useNotificationSetting } from '@/ui/hooks/use-notification-setting.ts';
import { SettingsSection } from '@/ui/primitives/settings-section.tsx';
import { SwitchToggle } from '@/ui/primitives/switch-toggle.tsx';

export function NotificationSetting() {
  const { enabled, blockedHint, available, toggle } = useNotificationSetting();
  return (
    <SettingsSection
      icon={<TbBell className="size-3.5" />}
      title="Desktop notifications"
      hint="Notify when tasks are created or change status while this tab is in the background."
    >
      <SwitchToggle
        checked={enabled}
        disabled={!available}
        aria-label="Desktop notifications"
        onChange={(next) => {
          void toggle(next);
        }}
      >
        {enabled ? 'On' : 'Off'}
      </SwitchToggle>
      {blockedHint ? <p className="text-mini text-warning-fg">{blockedHint}</p> : null}
    </SettingsSection>
  );
}

import { useState } from 'react';

import { BrowserNotifications, type NotificationAccess } from '@/ui/lib/browser-notifications.ts';
import { usePreferencesStore } from '@/ui/store/preferences-store.ts';

const ACCESS_HINTS: Record<NotificationAccess, string | null> = {
  granted: null,
  default: null,
  denied: 'The browser blocks notifications for this page. Allow them in the site settings.',
  unsupported: 'This browser does not support desktop notifications.',
};

export const useNotificationSetting = () => {
  const enabled = usePreferencesStore((state) => {
    return state.notifications;
  });
  const setNotifications = usePreferencesStore((state) => {
    return state.setNotifications;
  });
  const [access, setAccess] = useState<NotificationAccess>(() => {
    return BrowserNotifications.access();
  });

  return {
    enabled: enabled && access === 'granted',
    blockedHint: ACCESS_HINTS[access],
    available: access !== 'denied' && access !== 'unsupported',
    toggle: async (next: boolean) => {
      if (!next) {
        setNotifications(false);
        return;
      }
      const granted = await BrowserNotifications.request();
      setAccess(granted);
      setNotifications(granted === 'granted');
    },
  };
};

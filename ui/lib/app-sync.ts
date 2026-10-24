import { AppearanceSync, type ThemeSource } from '@/ui/lib/appearance-sync.ts';
import { BrowserNotifications } from '@/ui/lib/browser-notifications.ts';
import { DesktopNotifications } from '@/ui/lib/desktop-notifications.ts';
import type { Services } from '@/ui/lib/services.ts';

export interface PreferencesPort {
  theme: ThemeSource;
  notificationsEnabled: () => boolean;
}

export interface AppSyncPorts {
  preferences: PreferencesPort;
  navigate: (path: string) => void;
}

export class AppSync {
  private readonly services: Services;
  private readonly ports: AppSyncPorts;

  constructor(services: Services, ports: AppSyncPorts) {
    this.services = services;
    this.ports = ports;
  }

  start() {
    const { preferences, navigate } = this.ports;
    const appearance = new AppearanceSync(preferences.theme, document.documentElement);
    const notifications = new DesktopNotifications(this.services.events, {
      enabled: preferences.notificationsEnabled,
      hidden: () => {
        return document.visibilityState === 'hidden';
      },
      show: (notice) => {
        BrowserNotifications.show(notice.title, notice.body, notice.path, () => {
          navigate(notice.path);
        });
      },
    });
    const stops = [
      appearance.start(),
      notifications.start(),
      this.services.serverSync.start(),
      this.services.clock.start(),
    ];
    return () => {
      for (const stop of stops) {
        stop();
      }
    };
  }
}

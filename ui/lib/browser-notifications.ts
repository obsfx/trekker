export type NotificationAccess = 'granted' | 'denied' | 'default' | 'unsupported';

export abstract class BrowserNotifications {
  static access(): NotificationAccess {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  static async request(): Promise<NotificationAccess> {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  static show(title: string, body: string, tag: string, onClick: () => void) {
    if (BrowserNotifications.access() !== 'granted') {
      return;
    }
    const notification = new Notification(title, { body, tag });
    notification.addEventListener('click', () => {
      window.focus();
      onClick();
      notification.close();
    });
  }
}

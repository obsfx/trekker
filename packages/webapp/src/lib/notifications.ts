/**
 * Web Notifications API utility
 * https://developer.mozilla.org/en-US/docs/Web/API/Notification
 */

export type NotificationPermissionStatus = "granted" | "denied" | "default";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

interface SendNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function sendNotification(options: SendNotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon,
    tag: options.tag,
  });

  if (options.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

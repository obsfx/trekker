"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from "@/lib/notifications";

export function NotificationToggle() {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>("default");

  useEffect(() => {
    setMounted(true);
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  if (!isNotificationSupported()) {
    return null;
  }

  const handleClick = async () => {
    if (permission === "granted") {
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const getIcon = () => {
    switch (permission) {
      case "granted":
        return <BellRing className="h-4 w-4" />;
      case "denied":
        return <BellOff className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (permission) {
      case "granted":
        return "Notifications enabled";
      case "denied":
        return "Notifications blocked";
      default:
        return "Enable notifications";
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={permission === "denied"}
      title={getTitle()}
    >
      {getIcon()}
      <span className="sr-only">{getTitle()}</span>
    </Button>
  );
}

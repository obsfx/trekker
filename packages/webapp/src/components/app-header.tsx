"use client";

import { Plus, Package, GitBranchPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationToggle } from "@/components/notification-toggle";

interface AppHeaderProps {
  projectName?: string;
  onNewClick?: () => void;
}

export function AppHeader({ projectName, onNewClick }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-2 bg-accent/50">
      <div className="flex items-center gap-2">
        <GitBranchPlus />
        <h1 className="text-lg font-bold">trekker</h1>
      </div>

      <div className="flex gap-6">
        {projectName && (
          <div className="flex items-center gap-1">
            <Package className="text-muted-foreground" width={16} />
            <span className="text-sm text-muted-foreground">{projectName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {onNewClick && (
            <Button size="sm" onClick={onNewClick}>
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          )}
          <NotificationToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

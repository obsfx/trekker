"use client";

import { Layers, SquareCheck, GitBranch, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  id: string;
  title: string;
  type: "epic" | "task" | "subtask";
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const TYPE_ICONS = {
  epic: Layers,
  task: SquareCheck,
  subtask: GitBranch,
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !isLast && item.onClick;
        const Icon = TYPE_ICONS[item.type];

        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-1",
                isClickable && "cursor-pointer hover:text-foreground"
              )}
              onClick={isClickable ? item.onClick : undefined}
              title={item.title}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-sm text-muted-foreground">
                {item.id}
              </span>
            </div>
            {!isLast && <ChevronRight className="h-3 w-3 opacity-50" />}
          </div>
        );
      })}
    </nav>
  );
}

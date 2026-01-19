"use client";

import { formatRelative } from "@/lib/date";

interface MetadataProps {
  createdAt: string;
  updatedAt: string;
}

export function Metadata({ createdAt, updatedAt }: MetadataProps) {
  return (
    <div className="p-4 border-t flex gap-3 justify-end">
      <p className="text-xs text-muted-foreground">
        Created {formatRelative(createdAt)}
      </p>
      <p className="text-xs text-muted-foreground">
        Updated {formatRelative(updatedAt)}
      </p>
    </div>
  );
}

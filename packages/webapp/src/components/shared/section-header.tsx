"use client";

interface SectionHeaderProps {
  children: React.ReactNode;
  count?: { current: number; total: number };
}

export function SectionHeader({ children, count }: SectionHeaderProps) {
  return (
    <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-3">
      {children}
      {count && ` (${count.current}/${count.total})`}
    </h4>
  );
}

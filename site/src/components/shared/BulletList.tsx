import type { ReactNode } from "react";

interface BulletListProps {
  items: ReactNode[];
}

export function BulletList({ items }: BulletListProps) {
  return (
    <ul className="bullet-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

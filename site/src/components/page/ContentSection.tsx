import type { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  id?: string;
  children: ReactNode;
}

export function ContentSection({
  title,
  id,
  children,
}: ContentSectionProps) {
  return (
    <section id={id} className="page-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

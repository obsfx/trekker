import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={`mb-12 ${className || ""}`}>
      <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

interface SubSectionProps {
  title: string;
  children: ReactNode;
}

export function SubSection({ title, children }: SubSectionProps) {
  return (
    <div className="mt-6">
      <h3 className="text-base md:text-lg font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

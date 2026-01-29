import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ title, children, className, id }: SectionProps) {
  return (
    <section id={id} className={`py-8 md:py-10 ${className || ""}`}>
      <h2 className="font-sans text-fluid-2xl font-bold text-white mb-4">
        {title}
      </h2>
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
      <h3 className="font-sans text-fluid-lg font-semibold text-white mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

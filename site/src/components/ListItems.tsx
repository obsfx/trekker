import type { ReactNode } from "react";
import { Check } from "lucide-react";

const CHECK_ICON = <Check size={20} className="text-white flex-shrink-0 mt-0.5" />;

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-fluid-base text-white/70">
          {CHECK_ICON}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumberedList({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-fluid-base text-white/70">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-[#001BB7] text-sm font-semibold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

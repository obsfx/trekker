import { TbArrowRight } from 'react-icons/tb';

interface HistoryChangeProps {
  field: string;
  from: string | null;
  to: string | null;
}

export function HistoryChange({ field, from, to }: HistoryChangeProps) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-fg-3">
      <span>{field}</span>
      {from ? <span className="text-fg-4 line-through">{from}</span> : null}
      {from && to ? <TbArrowRight aria-label="to" className="size-3 text-fg-4" /> : null}
      {to ? <span className="text-fg-1">{to}</span> : null}
    </span>
  );
}

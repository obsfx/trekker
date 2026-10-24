import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';

interface DayRangeInputsProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DayRangeInputs({ from, to, onChange }: DayRangeInputsProps) {
  return (
    <span className="flex items-center gap-1 text-xs text-fg-3">
      <InputFrame className="w-32">
        <BareInput
          type="date"
          aria-label="From"
          value={from}
          max={to === '' ? undefined : to}
          onChange={(event) => {
            onChange(event.target.value, to);
          }}
        />
      </InputFrame>
      to
      <InputFrame className="w-32">
        <BareInput
          type="date"
          aria-label="To"
          value={to}
          min={from === '' ? undefined : from}
          onChange={(event) => {
            onChange(from, event.target.value);
          }}
        />
      </InputFrame>
    </span>
  );
}

import type { ComponentProps } from 'react';
import { TbSearch } from 'react-icons/tb';

import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';
import { Kbd } from '@/ui/primitives/kbd.tsx';

interface SearchFieldProps extends ComponentProps<'input'> {
  shortcut?: string;
  frameClassName?: string;
}

export function SearchField({ shortcut, frameClassName, ...props }: SearchFieldProps) {
  return (
    <InputFrame className={frameClassName}>
      <TbSearch className="size-3.5 shrink-0" />
      <BareInput type="search" {...props} />
      {shortcut ? <Kbd>{shortcut}</Kbd> : null}
    </InputFrame>
  );
}

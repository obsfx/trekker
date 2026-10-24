import { Popover } from '@base-ui/react/popover';
import type { ReactElement } from 'react';

import { Button, type ButtonVariant } from '@/ui/primitives/button.tsx';
import { PopoverPopupSurface } from '@/ui/primitives/popover-popup-surface.tsx';

type ConfirmTone = 'default' | 'danger';

const CONFIRM_VARIANTS: Record<ConfirmTone, ButtonVariant> = {
  default: 'solid',
  danger: 'destructive',
};

interface ConfirmPopoverProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  align?: 'start' | 'end';
  trigger?: ReactElement;
  anchor?: Element | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmPopover({
  open,
  title,
  description,
  confirmLabel,
  tone = 'default',
  align = 'end',
  trigger,
  anchor,
  onConfirm,
  onOpenChange,
}: ConfirmPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Popover.Trigger render={trigger} /> : null}
      <PopoverPopupSurface align={align} anchor={anchor} className="w-72">
        <div className="flex flex-col gap-2 p-1.5">
          <div className="flex flex-col gap-0.5">
            <Popover.Title className="text-xs font-semibold text-fg">{title}</Popover.Title>
            <Popover.Description className="text-mini text-fg-2">{description}</Popover.Description>
          </div>
          <div className="flex justify-end gap-1">
            <Popover.Close render={<Button variant="text" />}>Cancel</Popover.Close>
            <Button
              autoFocus
              variant={CONFIRM_VARIANTS[tone]}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </PopoverPopupSurface>
    </Popover.Root>
  );
}

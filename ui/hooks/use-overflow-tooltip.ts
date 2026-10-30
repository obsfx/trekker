import { useState } from 'react';

const hasOverflowingText = (container: HTMLElement | null) => {
  const labels = container?.querySelectorAll('[data-truncatable]') ?? [];
  return [...labels].some((label) => {
    return label.scrollWidth > label.clientWidth;
  });
};

export const useOverflowTooltip = (hasHiddenContent: boolean) => {
  const [trigger, attachTrigger] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  return {
    attachTrigger,
    open,
    onOpenChange: (next: boolean) => {
      setOpen(next && (hasHiddenContent || hasOverflowingText(trigger)));
    },
  };
};

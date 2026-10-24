import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useRef } from 'react';

const OVERSCAN = 12;

interface RowVirtualizerOptions {
  count: number;
  rowHeight: number;
}

export const useRowVirtualizer = ({ count, rowHeight }: RowVirtualizerOptions) => {
  'use no memo';
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => {
      return scrollElementRef.current;
    },
    estimateSize: () => {
      return rowHeight;
    },
    overscan: OVERSCAN,
  });

  const attachScrollElement = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer]
  );

  return { virtualizer, attachScrollElement };
};

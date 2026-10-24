import { useCopyToClipboard } from '@uidotdev/usehooks';

export const useCopyValue = (value: string) => {
  const [copied, copy] = useCopyToClipboard();
  return {
    copied: copied === value,
    copy: () => {
      void copy(value);
    },
  };
};

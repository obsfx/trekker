import { useCreateDialogStore } from '@/ui/store/create-dialog-store.ts';

export const useCreateDialog = () => {
  const open = useCreateDialogStore((state) => {
    return state.open;
  });
  const defaults = useCreateDialogStore((state) => {
    return state.defaults;
  });
  const close = useCreateDialogStore((state) => {
    return state.close;
  });
  return {
    open,
    defaults,
    close,
    onOpenChange: (next: boolean) => {
      if (!next) {
        close();
      }
    },
  };
};

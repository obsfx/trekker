import { Dialog } from '@base-ui/react/dialog';

import { CreateForm } from '@/ui/components/create/create-form.tsx';
import { useCreateDialog } from '@/ui/hooks/use-create-dialog.ts';
import { DialogBackdropSurface } from '@/ui/primitives/dialog-backdrop-surface.tsx';
import { DialogSurface } from '@/ui/primitives/dialog-surface.tsx';

export function CreateDialog() {
  const { open, defaults, close, onOpenChange } = useCreateDialog();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop render={<DialogBackdropSurface />} />
        <Dialog.Popup render={<DialogSurface />}>
          <CreateForm defaults={defaults} onDone={close} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

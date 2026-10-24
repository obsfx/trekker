import { Popover } from '@base-ui/react/popover';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/ui/primitives/button.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { PopoverPopupSurface } from '@/ui/primitives/popover-popup-surface.tsx';

function PopoverDemo() {
  return (
    <Popover.Root defaultOpen>
      <Popover.Trigger render={<Button variant="secondary" />}>Link a task</Popover.Trigger>
      <PopoverPopupSurface align="start" className="w-72">
        <MutedHint>Type a title or an ID</MutedHint>
      </PopoverPopupSurface>
    </Popover.Root>
  );
}

const meta = {
  title: 'Primitives/PopoverPopupSurface',
  component: PopoverDemo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PopoverDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

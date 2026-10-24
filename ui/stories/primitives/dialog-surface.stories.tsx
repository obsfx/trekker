import type { Meta, StoryObj } from '@storybook/react-vite';

import { DialogSurface } from '@/ui/primitives/dialog-surface.tsx';

const meta = {
  title: 'Primitives/DialogSurface',
  component: DialogSurface,
  args: {
    children: (
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-semibold">Dialog title</span>
        <span className="text-xs text-fg-2">Dialog content sits on the canvas surface.</span>
      </div>
    ),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DialogSurface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

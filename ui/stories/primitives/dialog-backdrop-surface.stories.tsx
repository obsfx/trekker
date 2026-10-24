import type { Meta, StoryObj } from '@storybook/react-vite';

import { DialogBackdropSurface } from '@/ui/primitives/dialog-backdrop-surface.tsx';

const meta = {
  title: 'Primitives/DialogBackdropSurface',
  component: DialogBackdropSurface,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DialogBackdropSurface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

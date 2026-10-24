import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditableHeading } from '@/ui/primitives/editable-heading.tsx';

const meta = {
  title: 'Primitives/EditableHeading',
  component: EditableHeading,
  args: { children: 'Event feed and SSE with replay after reconnect' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof EditableHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

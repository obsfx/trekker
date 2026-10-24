import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PriorityMenu } from '@/ui/components/editing/priority-menu.tsx';
import type { Priority } from '@/ui/lib/priorities.ts';

interface PriorityMenuDemoProps {
  initial: Priority;
}

function PriorityMenuDemo({ initial }: PriorityMenuDemoProps) {
  const [priority, setPriority] = useState(initial);
  return <PriorityMenu value={priority} onChange={setPriority} />;
}

const meta = {
  title: 'Components/Editing/PriorityMenu',
  component: PriorityMenuDemo,
  args: { initial: 1 },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PriorityMenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const High: Story = {};

export const Critical: Story = { args: { initial: 0 } };

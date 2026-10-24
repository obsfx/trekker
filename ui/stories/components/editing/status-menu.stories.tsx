import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { StatusMenu } from '@/ui/components/editing/status-menu.tsx';
import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';

interface StatusMenuDemoProps {
  kind: ItemKind;
}

function StatusMenuDemo({ kind }: StatusMenuDemoProps) {
  const [status, setStatus] = useState<ItemStatus>('in_progress');
  return <StatusMenu value={status} statuses={KindStatuses.of(kind)} onChange={setStatus} />;
}

const meta = {
  title: 'Components/Editing/StatusMenu',
  component: StatusMenuDemo,
  args: { kind: 'task' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusMenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Epic: Story = { args: { kind: 'epic' } };

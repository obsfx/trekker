import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { CheckMenu } from '@/ui/components/list/check-menu.tsx';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Selections } from '@/ui/lib/selections.ts';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

interface StatusCheckMenuProps {
  initial: ItemStatus[];
}

function StatusCheckMenu({ initial }: StatusCheckMenuProps) {
  const [selected, setSelected] = useState(initial);
  return (
    <CheckMenu
      label="Status"
      options={ItemStatuses.all.map((status) => {
        return {
          value: status,
          label: ItemStatuses.label(status),
          icon: <StatusIcon status={status} />,
        };
      })}
      selected={selected}
      onToggle={(status) => {
        setSelected(Selections.toggle(selected, status));
      }}
      onClear={() => {
        setSelected([]);
      }}
    />
  );
}

const meta = {
  title: 'Components/List/CheckMenu',
  component: StatusCheckMenu,
  args: { initial: [] },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusCheckMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NothingSelected: Story = {};

export const OneSelected: Story = { args: { initial: ['in_progress'] } };

export const SeveralSelected: Story = { args: { initial: ['todo', 'in_progress'] } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CreateKindMenu } from '@/ui/components/create/create-kind-menu.tsx';

const meta = {
  title: 'Components/Create/CreateKindMenu',
  component: CreateKindMenu,
  args: { value: 'task', onChange: fn() },
} satisfies Meta<typeof CreateKindMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Epic: Story = { args: { value: 'epic' } };

import type { Meta, StoryObj } from '@storybook/react-vite';

import { UnderlineTab } from '@/ui/primitives/underline-tab.tsx';

const meta = {
  title: 'Primitives/UnderlineTab',
  component: UnderlineTab,
  args: { active: true, children: 'Comments' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof UnderlineTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Inactive: Story = { args: { active: false } };

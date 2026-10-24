import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuthorAvatar } from '@/ui/primitives/author-avatar.tsx';

const meta = {
  title: 'Primitives/AuthorAvatar',
  component: AuthorAvatar,
  args: { name: 'omercan' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AuthorAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Person: Story = {};

export const Agent: Story = { args: { name: 'agent' } };

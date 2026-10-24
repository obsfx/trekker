import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchField } from '@/ui/primitives/search-field.tsx';

const meta = {
  title: 'Primitives/SearchField',
  component: SearchField,
  args: {
    placeholder: 'Search tasks, epics, comments',
    shortcut: '/',
    frameClassName: 'w-72',
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: 'event feed' } };

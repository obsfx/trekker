import type { Meta, StoryObj } from '@storybook/react-vite';

import { StoryApp } from '@/ui/stories/support/story-app.tsx';

const meta = {
  title: 'Layouts/AppLayout',
  component: StoryApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StoryApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {};

export const List: Story = { args: { path: '/list' } };

export const History: Story = { args: { path: '/history' } };

export const Task: Story = { args: { path: '/tasks/TREK-2' } };

export const Epic: Story = { args: { path: '/epics/EPIC-2' } };

export const Settings: Story = { args: { path: '/settings' } };

export const UnknownPath: Story = { args: { path: '/nowhere' } };

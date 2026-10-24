import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { NoticeToast } from '@/ui/primitives/notice-toast.tsx';

const meta = {
  title: 'Primitives/NoticeToast',
  component: NoticeToast,
  args: {
    tone: 'error',
    onDismiss: fn(),
    children: 'Moving TREK-131 failed: anchor is in another column',
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NoticeToast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ErrorNotice: Story = {};

export const InfoNotice: Story = {
  args: { tone: 'info', children: 'Archived 12 tasks and 1 epic' },
};

import type { Meta, StoryObj } from '@storybook/react-vite';

import { NoticeStack } from '@/ui/components/shell/notice-stack.tsx';
import { noticePort } from '@/ui/store/notice-store.ts';

const meta = {
  title: 'Components/Shell/NoticeStack',
  component: NoticeStack,
  beforeEach: () => {
    noticePort.error('Moving TREK-131 failed: anchor is in another column');
    noticePort.info('Archived 12 tasks and 1 epic');
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NoticeStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

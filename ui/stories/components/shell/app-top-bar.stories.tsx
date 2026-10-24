import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppTopBar } from '@/ui/components/shell/app-top-bar.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Shell/AppTopBar',
  component: AppTopBar,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppTopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Board: Story = {};

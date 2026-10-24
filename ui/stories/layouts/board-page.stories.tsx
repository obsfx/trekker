import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardPage } from '@/ui/layouts/board-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Layouts/BoardPage',
  component: BoardPage,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BoardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

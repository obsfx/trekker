import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardToolbar } from '@/ui/components/board/board-toolbar.tsx';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Board/BoardToolbar',
  component: BoardToolbar,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <PageToolbar>
            <Story />
          </PageToolbar>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BoardToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

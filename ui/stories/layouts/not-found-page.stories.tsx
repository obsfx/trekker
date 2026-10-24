import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotFoundPage } from '@/ui/layouts/not-found-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Layouts/NotFoundPage',
  component: NotFoundPage,
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/nowhere">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotFoundPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ListPage } from '@/ui/layouts/list-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Layouts/ListPage',
  component: ListPage,
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/list">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

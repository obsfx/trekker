import type { Meta, StoryObj } from '@storybook/react-vite';

import { ListToolbar } from '@/ui/components/list/list-toolbar.tsx';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/List/ListToolbar',
  component: ListToolbar,
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
} satisfies Meta<typeof ListToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

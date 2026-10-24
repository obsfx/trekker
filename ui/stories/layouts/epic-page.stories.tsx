import type { Meta, StoryObj } from '@storybook/react-vite';

import { EpicPage } from '@/ui/layouts/epic-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

function EpicRoute() {
  return (
    <div className="flex h-screen flex-col">
      <EpicPage />
    </div>
  );
}

const meta = {
  title: 'Layouts/EpicPage',
  component: EpicRoute,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EpicRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/epics/EPIC-2">
          <Story />
        </StoryServices>
      );
    },
  ],
};

export const Missing: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/epics/EPIC-999">
          <Story />
        </StoryServices>
      );
    },
  ],
};

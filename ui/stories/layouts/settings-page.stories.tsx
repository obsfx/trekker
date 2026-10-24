import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsPage } from '@/ui/layouts/settings-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Layouts/SettingsPage',
  component: SettingsPage,
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/settings">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

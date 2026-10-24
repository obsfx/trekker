import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotificationSetting } from '@/ui/components/settings/notification-setting.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Settings/NotificationSetting',
  component: NotificationSetting,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="w-[32rem]">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NotificationSetting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

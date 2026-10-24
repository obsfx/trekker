import type { Meta, StoryObj } from '@storybook/react-vite';

import { PrefixSettings } from '@/ui/components/settings/prefix-settings.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Settings/PrefixSettings',
  component: PrefixSettings,
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
} satisfies Meta<typeof PrefixSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

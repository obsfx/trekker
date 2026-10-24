import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeSetting } from '@/ui/components/settings/theme-setting.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Settings/ThemeSetting',
  component: ThemeSetting,
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
} satisfies Meta<typeof ThemeSetting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuthorSetting } from '@/ui/components/settings/author-setting.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Settings/AuthorSetting',
  component: AuthorSetting,
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
} satisfies Meta<typeof AuthorSetting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

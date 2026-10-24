import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbSettings } from 'react-icons/tb';

import { IconLink } from '@/ui/primitives/icon-link.tsx';
import { StoryRouter } from '@/ui/stories/support/story-router.tsx';

const meta = {
  title: 'Primitives/IconLink',
  component: IconLink,
  args: {
    to: '/settings',
    'aria-label': 'Settings',
    title: 'Settings',
    children: <TbSettings className="size-3.5" />,
  },
  decorators: [
    (Story) => {
      return (
        <StoryRouter>
          <Story />
        </StoryRouter>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof IconLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

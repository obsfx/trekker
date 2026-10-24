import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { GlobalSearch } from '@/ui/components/shell/global-search.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Shell/GlobalSearch',
  component: GlobalSearch,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="flex h-80 w-[32rem] items-start p-3">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof GlobalSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Search'), 'pagination');
    const results = await canvas.findAllByText(/pagination/i);
    await expect(results.length).toBeGreaterThan(0);
  },
};

export const ChoosesWithKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Search');
    await userEvent.type(input, 'TREK');
    await canvas.findByRole('group', { name: 'Search results' });
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(input).toHaveValue('');
  },
};

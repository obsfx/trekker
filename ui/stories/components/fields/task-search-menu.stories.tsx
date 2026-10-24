import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbPlus } from 'react-icons/tb';
import { expect, fn, userEvent } from 'storybook/test';

import { TaskSearchMenu } from '@/ui/components/fields/task-search-menu.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';
import { StoryScreens } from '@/ui/stories/support/story-screens.ts';

const meta = {
  title: 'Components/Fields/TaskSearchMenu',
  component: TaskSearchMenu,
  args: {
    placeholder: 'Find a task this depends on',
    excludeIds: ['TREK-2'],
    onPick: fn(),
    trigger: (
      <Button variant="text">
        <TbPlus className="size-3.5" />
        Link
      </Button>
    ),
  },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskSearchMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PicksAndHidesExcluded: Story = {
  play: async ({ canvasElement, args }) => {
    const { body } = await StoryScreens.openFromButton(canvasElement, 'Link');
    const field = await body.findByLabelText(args.placeholder);
    await userEvent.type(field, 'TREK-');
    await body.findByRole('group', { name: 'Search results' });
    await expect(body.queryByText('TREK-2', { exact: true })).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPick).toHaveBeenCalled();
  },
};

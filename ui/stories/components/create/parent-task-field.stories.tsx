import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ParentTaskField } from '@/ui/components/create/parent-task-field.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Create/ParentTaskField',
  component: ParentTaskField,
  args: { parent: null, invalid: false, onPick: fn() },
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
} satisfies Meta<typeof ParentTaskField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Chosen: Story = {
  args: { parent: { id: 'TREK-2', title: 'trekker serve command and REST API' } },
};

export const Missing: Story = { args: { invalid: true } };

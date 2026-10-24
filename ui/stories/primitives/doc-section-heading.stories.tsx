import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbPlus, TbSubtask } from 'react-icons/tb';

import { Button } from '@/ui/primitives/button.tsx';
import { DocSectionHeading } from '@/ui/primitives/doc-section-heading.tsx';

const meta = {
  title: 'Primitives/DocSectionHeading',
  component: DocSectionHeading,
  args: {
    icon: <TbSubtask className="size-3.5" />,
    label: 'Subtasks',
    count: '1/4',
    action: (
      <Button variant="text">
        <TbPlus className="size-3.5" />
        Add
      </Button>
    ),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DocSectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutAction: Story = { args: { action: undefined, count: undefined } };

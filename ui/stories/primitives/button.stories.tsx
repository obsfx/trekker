import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbFilter, TbPlus, TbTrash } from 'react-icons/tb';

import { Button } from '@/ui/primitives/button.tsx';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Save', variant: 'secondary' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'secondary', 'subtle', 'outline', 'text', 'danger'],
    },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="solid">
          <TbPlus className="size-3.5" />
          New
        </Button>
        <Button variant="secondary">
          <TbFilter className="size-3.5" />
          Filter
        </Button>
        <Button variant="subtle">Subtle</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
        <Button variant="danger">
          <TbTrash className="size-3.5" />
          Delete
        </Button>
        <Button variant="destructive">
          <TbTrash className="size-3.5" />
          Delete task
        </Button>
        <Button variant="solid" disabled>
          Disabled
        </Button>
      </div>
    );
  },
};

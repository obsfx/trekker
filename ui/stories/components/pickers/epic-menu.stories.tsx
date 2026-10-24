import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TbBolt, TbChevronDown } from 'react-icons/tb';

import { EpicMenu } from '@/ui/components/pickers/epic-menu.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

function EpicMenuDemo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <EpicMenu
      value={value}
      noneLabel="No epic"
      onChange={setValue}
      trigger={
        <Button variant="secondary">
          <TbBolt className="size-3.5" />
          {value ?? 'Epic'}
          <TbChevronDown className="size-3" />
        </Button>
      }
    />
  );
}

const meta = {
  title: 'Components/Pickers/EpicMenu',
  component: EpicMenuDemo,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="h-96">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof EpicMenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

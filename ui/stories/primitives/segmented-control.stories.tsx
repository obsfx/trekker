import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SegmentedControl } from '@/ui/primitives/segmented-control.tsx';
import { SegmentedOption } from '@/ui/primitives/segmented-option.tsx';

const OPTIONS = ['All', 'Epics', 'Tasks'];

function SegmentedDemo() {
  const [active, setActive] = useState('All');
  return (
    <SegmentedControl label="Show">
      {OPTIONS.map((option) => {
        return (
          <SegmentedOption
            key={option}
            active={active === option}
            onClick={() => {
              setActive(option);
            }}
          >
            {option}
          </SegmentedOption>
        );
      })}
    </SegmentedControl>
  );
}

const meta = {
  title: 'Primitives/SegmentedControl',
  component: SegmentedDemo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SegmentedDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CrumbBar } from '@/ui/primitives/crumb-bar.tsx';
import { CrumbSeparator } from '@/ui/primitives/crumb-separator.tsx';

const meta = {
  title: 'Primitives/CrumbBar',
  component: CrumbBar,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <span>Board</span>
        <CrumbSeparator />
        <span>EPIC-20 Dashboard rewrite</span>
        <CrumbSeparator />
        <span className="font-mono text-fg-1">TREK-132</span>
      </>
    ),
  },
} satisfies Meta<typeof CrumbBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

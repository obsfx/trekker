import type { Meta, StoryObj } from '@storybook/react-vite';

import { UnderlineTab } from '@/ui/primitives/underline-tab.tsx';
import { UnderlineTabs } from '@/ui/primitives/underline-tabs.tsx';

const meta = {
  title: 'Primitives/UnderlineTabs',
  component: UnderlineTabs,
  args: {
    label: 'Task status',
    children: (
      <>
        <UnderlineTab active={true}>
          All <span className="font-normal text-fg-4">18</span>
        </UnderlineTab>
        <UnderlineTab active={false}>
          Todo <span className="font-normal text-fg-4">8</span>
        </UnderlineTab>
        <UnderlineTab active={false}>
          In progress <span className="font-normal text-fg-4">3</span>
        </UnderlineTab>
      </>
    ),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof UnderlineTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

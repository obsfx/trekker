import type { Meta, StoryObj } from '@storybook/react-vite';

import { MenuFilterInput } from '@/ui/primitives/menu-filter-input.tsx';
import { MenuSurface } from '@/ui/primitives/menu-surface.tsx';

const meta = {
  title: 'Primitives/MenuFilterInput',
  component: MenuFilterInput,
  args: { placeholder: 'Filter epics' },
  decorators: [
    (Story) => {
      return (
        <MenuSurface className="w-64">
          <Story />
        </MenuSurface>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MenuFilterInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

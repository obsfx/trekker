import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbHash } from 'react-icons/tb';

import { SettingsSection } from '@/ui/primitives/settings-section.tsx';

const meta = {
  title: 'Primitives/SettingsSection',
  component: SettingsSection,
  args: {
    icon: <TbHash className="size-3.5" />,
    title: 'ID prefixes',
    hint: 'Used for new items in this project. Existing IDs keep their prefix.',
    children: <span className="text-xs text-fg-2">Section content</span>,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SettingsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

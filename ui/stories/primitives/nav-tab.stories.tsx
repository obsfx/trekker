import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbLayoutKanban, TbList } from 'react-icons/tb';

import { NavTab } from '@/ui/primitives/nav-tab.tsx';
import { StoryRouter } from '@/ui/stories/support/story-router.tsx';

interface NavTabsDemoProps {
  path: string;
}

function NavTabsDemo({ path }: NavTabsDemoProps) {
  return (
    <StoryRouter path={path}>
      <div className="flex h-10 items-stretch border-b border-line">
        <NavTab to="/" end icon={<TbLayoutKanban className="size-3.5" />} label="Board" />
        <NavTab to="/list" icon={<TbList className="size-3.5" />} label="List" />
      </div>
    </StoryRouter>
  );
}

const meta = {
  title: 'Primitives/NavTab',
  component: NavTabsDemo,
  args: { path: '/' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NavTabsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BoardActive: Story = {};

export const ListActive: Story = { args: { path: '/list' } };

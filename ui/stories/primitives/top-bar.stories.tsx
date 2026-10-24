import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbHistory, TbLayoutKanban, TbList, TbMoon, TbPlus, TbSettings } from 'react-icons/tb';

import { BrandMark } from '@/ui/primitives/brand-mark.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { LiveIndicator } from '@/ui/primitives/live-indicator.tsx';
import { NavTab } from '@/ui/primitives/nav-tab.tsx';
import { NavTabs } from '@/ui/primitives/nav-tabs.tsx';
import { SearchField } from '@/ui/primitives/search-field.tsx';
import { TopBar } from '@/ui/primitives/top-bar.tsx';
import { StoryRouter } from '@/ui/stories/support/story-router.tsx';

const meta = {
  title: 'Primitives/TopBar',
  component: TopBar,
  decorators: [
    (Story) => {
      return (
        <StoryRouter>
          <Story />
        </StoryRouter>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <BrandMark projectName="trekker" projectPath="~/workspace/trekker" />
        <NavTabs>
          <NavTab to="/" end icon={<TbLayoutKanban className="size-3.5" />} label="Board" />
          <NavTab to="/list" icon={<TbList className="size-3.5" />} label="List" />
          <NavTab to="/history" icon={<TbHistory className="size-3.5" />} label="History" />
        </NavTabs>
        <SearchField
          frameClassName="ml-auto w-72"
          placeholder="Search tasks and epics"
          shortcut="/"
        />
        <Button variant="solid">
          <TbPlus className="size-3.5" />
          New
        </Button>
        <LiveIndicator state="live" />
        <IconButton aria-label="Theme">
          <TbMoon className="size-3.5" />
        </IconButton>
        <IconButton aria-label="Settings">
          <TbSettings className="size-3.5" />
        </IconButton>
      </>
    ),
  },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

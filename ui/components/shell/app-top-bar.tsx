import { TbHistory, TbLayoutKanban, TbList, TbPlus, TbSettings } from 'react-icons/tb';
import { Link } from 'react-router';

import { GlobalSearch } from '@/ui/components/shell/global-search.tsx';
import { ThemeToggle } from '@/ui/components/shell/theme-toggle.tsx';
import { useAppTopBar } from '@/ui/hooks/use-app-top-bar.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { BrandMark } from '@/ui/primitives/brand-mark.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { IconLink } from '@/ui/primitives/icon-link.tsx';
import { LiveIndicator } from '@/ui/primitives/live-indicator.tsx';
import { NavTab } from '@/ui/primitives/nav-tab.tsx';
import { NavTabs } from '@/ui/primitives/nav-tabs.tsx';
import { TopBar } from '@/ui/primitives/top-bar.tsx';

export function AppTopBar() {
  const bar = useAppTopBar();
  return (
    <TopBar>
      <Link to={AppRoutes.board} className="flex max-w-48 min-w-0 shrink-0 no-underline">
        <BrandMark projectName={bar.projectName} projectPath={bar.projectRoot} />
      </Link>
      <NavTabs>
        <NavTab
          to={AppRoutes.board}
          end
          icon={<TbLayoutKanban className="size-3.5" />}
          label="Board"
        />
        <NavTab to={AppRoutes.list} icon={<TbList className="size-3.5" />} label="List" />
        <NavTab to={AppRoutes.history} icon={<TbHistory className="size-3.5" />} label="History" />
      </NavTabs>
      <GlobalSearch />
      <Button variant="solid" onClick={bar.create}>
        <TbPlus className="size-3.5" />
        <span className="max-sm:sr-only">New</span>
      </Button>
      <LiveIndicator state={bar.live} />
      <ThemeToggle />
      <IconLink to={AppRoutes.settings} aria-label="Settings" title="Settings">
        <TbSettings className="size-3.5" />
      </IconLink>
    </TopBar>
  );
}

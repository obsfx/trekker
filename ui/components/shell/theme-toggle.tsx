import { TbDeviceDesktop, TbMoon, TbSun } from 'react-icons/tb';

import { useThemeToggle } from '@/ui/hooks/use-theme-toggle.ts';
import { IconButton } from '@/ui/primitives/icon-button.tsx';

export function ThemeToggle() {
  const { theme, label, cycle } = useThemeToggle();
  return (
    <IconButton aria-label={label} title={label} onClick={cycle}>
      {theme === 'system' ? <TbDeviceDesktop className="size-3.5" /> : null}
      {theme === 'light' ? <TbSun className="size-3.5" /> : null}
      {theme === 'dark' ? <TbMoon className="size-3.5" /> : null}
    </IconButton>
  );
}

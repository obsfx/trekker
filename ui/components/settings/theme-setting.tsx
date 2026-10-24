import { TbDeviceDesktop, TbMoon, TbSun } from 'react-icons/tb';

import { useThemeSetting } from '@/ui/hooks/use-theme-setting.ts';
import { SegmentedControl } from '@/ui/primitives/segmented-control.tsx';
import { SegmentedOption } from '@/ui/primitives/segmented-option.tsx';
import { SettingsSection } from '@/ui/primitives/settings-section.tsx';

export function ThemeSetting() {
  const { theme, options, setTheme } = useThemeSetting();
  return (
    <SettingsSection
      icon={<TbMoon className="size-3.5" />}
      title="Theme"
      hint="Saved in this browser."
    >
      <SegmentedControl label="Theme">
        {options.map((option) => {
          return (
            <SegmentedOption
              key={option.value}
              active={theme === option.value}
              onClick={() => {
                setTheme(option.value);
              }}
            >
              {option.value === 'system' ? <TbDeviceDesktop className="size-3.5" /> : null}
              {option.value === 'light' ? <TbSun className="size-3.5" /> : null}
              {option.value === 'dark' ? <TbMoon className="size-3.5" /> : null}
              {option.label}
            </SegmentedOption>
          );
        })}
      </SegmentedControl>
    </SettingsSection>
  );
}

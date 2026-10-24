import { TbUser } from 'react-icons/tb';

import { useAuthorSetting } from '@/ui/hooks/use-author-setting.ts';
import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';
import { SettingsSection } from '@/ui/primitives/settings-section.tsx';

export function AuthorSetting() {
  const { author, change } = useAuthorSetting();
  return (
    <SettingsSection
      icon={<TbUser className="size-3.5" />}
      title="Comment author"
      hint="Shown on comments you write here. Agents set their own name from the CLI."
    >
      <InputFrame className="w-60">
        <BareInput
          aria-label="Comment author"
          defaultValue={author}
          onBlur={(event) => {
            change(event.target.value);
          }}
        />
      </InputFrame>
    </SettingsSection>
  );
}

import { TbHash } from 'react-icons/tb';

import { usePrefixSettings } from '@/ui/hooks/use-prefix-settings.ts';
import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';
import { LabeledField } from '@/ui/primitives/labeled-field.tsx';
import { SettingsSection } from '@/ui/primitives/settings-section.tsx';

export function PrefixSettings() {
  const { loaded, fields, values, problems, dirty, saving, canSave, change, reset, save } =
    usePrefixSettings();
  return (
    <SettingsSection
      icon={<TbHash className="size-3.5" />}
      title="ID prefixes"
      hint="Used for new items in this project. Existing IDs keep their prefix."
    >
      {fields.map((field) => {
        return (
          <LabeledField key={field.key} label={field.label} error={problems[field.key]}>
            <InputFrame className="w-32" invalid={Boolean(problems[field.key])}>
              <BareInput
                aria-label={field.label}
                disabled={!loaded}
                value={values[field.key] ?? ''}
                className="font-mono"
                onChange={(event) => {
                  change(field.key, event.target.value);
                }}
              />
            </InputFrame>
          </LabeledField>
        );
      })}
      <div className="flex gap-1">
        <Button
          variant="solid"
          disabled={!canSave}
          onClick={() => {
            void save();
          }}
        >
          {saving ? 'Saving' : 'Save prefixes'}
        </Button>
        {dirty && (
          <Button variant="text" onClick={reset}>
            Reset
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}

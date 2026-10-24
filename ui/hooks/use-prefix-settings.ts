import { useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useResource } from '@/ui/hooks/use-resource.ts';
import { ResourceStates } from '@/ui/lib/async-resource.ts';
import { PrefixRules } from '@/ui/lib/project-settings.ts';

export const usePrefixSettings = () => {
  const { project, projectSettings } = useServices();
  const info = ResourceStates.dataOr(useResource(project), null);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const values = draft ?? info?.config ?? {};
  const problems = Object.fromEntries(
    PrefixRules.fields.map((field) => {
      return [field.key, draft ? PrefixRules.problem(values, field.key) : null];
    })
  );
  const valid = Object.values(problems).every((problem) => {
    return problem === null;
  });

  return {
    loaded: info !== null,
    fields: PrefixRules.fields,
    values,
    problems,
    dirty: draft !== null,
    saving,
    canSave: draft !== null && valid && !saving,
    change: (key: string, value: string) => {
      setDraft({ ...values, [key]: PrefixRules.normalize(value) });
    },
    reset: () => {
      setDraft(null);
    },
    save: async () => {
      if (!draft) {
        return;
      }
      setSaving(true);
      const saved = await projectSettings.savePrefixes(draft);
      setSaving(false);
      if (saved) {
        setDraft(null);
      }
    },
  };
};

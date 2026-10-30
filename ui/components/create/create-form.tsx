import { Dialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';
import { TbBolt, TbChevronDown, TbTag, TbX } from 'react-icons/tb';

import { CreateKindMenu } from '@/ui/components/create/create-kind-menu.tsx';
import { ParentTaskField } from '@/ui/components/create/parent-task-field.tsx';
import { PriorityMenu } from '@/ui/components/editing/priority-menu.tsx';
import { StatusMenu } from '@/ui/components/editing/status-menu.tsx';
import { EpicMenu } from '@/ui/components/pickers/epic-menu.tsx';
import { useCreateForm } from '@/ui/hooks/use-create-form.ts';
import type { CreateDefaults } from '@/ui/lib/create-forms.ts';
import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { CheckField } from '@/ui/primitives/check-field.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { InlineError } from '@/ui/primitives/inline-error.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';
import { SubmitHint } from '@/ui/primitives/submit-hint.tsx';
import { TextAreaField } from '@/ui/primitives/text-area-field.tsx';

interface CreateFormProps {
  defaults: CreateDefaults;
  onDone: () => void;
}

export function CreateForm({ defaults, onDone }: CreateFormProps) {
  const {
    form,
    busy,
    titleRef,
    titleInvalid,
    parentInvalid,
    statuses,
    submitLabel,
    submitModifier,
    setKind,
    setTitle,
    setDescription,
    setStatus,
    setPriority,
    setEpic,
    setParent,
    setTags,
    setCreateAnother,
    submit,
    onKeyDown,
  } = useCreateForm(defaults, onDone);
  return (
    <form
      className="flex min-h-0 flex-col"
      onKeyDown={onKeyDown}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-line-muted px-3">
        <Dialog.Title className="sr-only">Create</Dialog.Title>
        <CreateKindMenu value={form.kind} onChange={setKind} />
        <Dialog.Close render={<IconButton aria-label="Close" className="ml-auto" />}>
          <TbX className="size-3.5" />
        </Dialog.Close>
      </header>
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-3">
        <InputFrame invalid={titleInvalid} className="h-8">
          <BareInput
            ref={titleRef}
            autoFocus
            aria-label="Title"
            aria-invalid={titleInvalid}
            placeholder="Title"
            className="text-sm font-medium"
            value={form.title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </InputFrame>
        {titleInvalid ? <InlineError>A title is required.</InlineError> : null}
        <TextAreaField
          rows={5}
          aria-label="Description"
          placeholder="Description, markdown supported"
          value={form.description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
        <div className="flex flex-wrap items-center gap-1">
          <StatusMenu value={form.status} statuses={statuses} onChange={setStatus} />
          <PriorityMenu value={form.priority} onChange={setPriority} />
          {form.kind === 'task' && (
            <EpicMenu
              value={form.epicId}
              noneLabel="No epic"
              onChange={setEpic}
              trigger={
                <Button variant="text" className="font-normal text-fg-1" aria-label="Epic">
                  <TbBolt className="size-3.5 text-accent-fg" />
                  {form.epicId ?? 'No epic'}
                  <TbChevronDown className="size-3 text-fg-4" />
                </Button>
              }
            />
          )}
          {form.kind === 'subtask' && (
            <ParentTaskField parent={form.parent} invalid={parentInvalid} onPick={setParent} />
          )}
        </div>
        <InputFrame className={clsx('w-full', { invisible: form.kind === 'epic' })}>
          <TbTag className="size-3.5 shrink-0" />
          <BareInput
            aria-label="Tags"
            placeholder="tags, comma separated"
            value={form.tags}
            onChange={(event) => {
              setTags(event.target.value);
            }}
          />
        </InputFrame>
        {parentInvalid ? <InlineError>Choose the parent task for this subtask.</InlineError> : null}
      </div>
      <footer className="flex shrink-0 items-center gap-2 border-t border-line-muted px-3 py-2">
        <CheckField
          checked={form.createAnother}
          onChange={(event) => {
            setCreateAnother(event.target.checked);
          }}
        >
          Create another
        </CheckField>
        <SubmitHint modifier={submitModifier} className="ml-auto" />
        <Dialog.Close render={<Button variant="text" />}>Cancel</Dialog.Close>
        <Button type="submit" variant="solid" disabled={busy}>
          {submitLabel}
        </Button>
      </footer>
    </form>
  );
}

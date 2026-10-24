import type { Meta, StoryObj } from '@storybook/react-vite';

import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';
import { LabeledField } from '@/ui/primitives/labeled-field.tsx';

const meta = {
  title: 'Primitives/LabeledField',
  component: LabeledField,
  args: {
    label: 'Epics',
    children: (
      <InputFrame className="w-32">
        <BareInput defaultValue="EPIC" className="font-mono" />
      </InputFrame>
    ),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LabeledField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = { args: { error: 'Each prefix must be unique' } };

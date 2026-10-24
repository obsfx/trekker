import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SwitchToggle } from '@/ui/primitives/switch-toggle.tsx';

interface SwitchDemoProps {
  initial: boolean;
  disabled: boolean;
}

function SwitchDemo({ initial, disabled }: SwitchDemoProps) {
  const [checked, setChecked] = useState(initial);
  return (
    <SwitchToggle checked={checked} disabled={disabled} onChange={setChecked}>
      {checked ? 'On' : 'Off'}
    </SwitchToggle>
  );
}

const meta = {
  title: 'Primitives/SwitchToggle',
  component: SwitchDemo,
  args: { initial: false, disabled: false },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SwitchDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = { args: { initial: true } };

export const Disabled: Story = { args: { disabled: true } };

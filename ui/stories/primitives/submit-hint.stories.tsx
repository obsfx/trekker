import type { Meta, StoryObj } from '@storybook/react-vite';

import { SubmitHint } from '@/ui/primitives/submit-hint.tsx';

const meta = {
  title: 'Primitives/SubmitHint',
  component: SubmitHint,
  args: { modifier: 'Cmd', action: 'to send' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SubmitHint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mac: Story = {};

export const OtherPlatforms: Story = { args: { modifier: 'Ctrl', action: 'to save' } };

export const KeysOnly: Story = { args: { action: undefined } };

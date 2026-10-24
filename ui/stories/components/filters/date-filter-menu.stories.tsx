import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';

import { DateFilterMenu } from '@/ui/components/filters/date-filter-menu.tsx';
import type { DateFilter } from '@/ui/lib/date-ranges.ts';
import type { DateField } from '@/ui/lib/item-queries.ts';
import { StoryScreens } from '@/ui/stories/support/story-screens.ts';

interface DateFilterDemoProps {
  initial: DateFilter | null;
  fields: readonly DateField[];
  label?: string;
}

function DateFilterDemo({ initial, fields, label }: DateFilterDemoProps) {
  const [filter, setFilter] = useState(initial);
  return (
    <div className="h-96">
      <DateFilterMenu filter={filter} fields={fields} label={label} onChange={setFilter} />
    </div>
  );
}

const meta = {
  title: 'Components/Filters/DateFilterMenu',
  component: DateFilterDemo,
  args: { initial: null, fields: ['updated', 'created'] },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DateFilterDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const LastWeek: Story = {
  args: { initial: { field: 'updated', preset: 'week', from: null, to: null } },
};

export const CustomCreatedRange: Story = {
  args: {
    initial: {
      field: 'created',
      preset: 'custom',
      from: dayjs('2026-10-01T00:00:00Z').valueOf(),
      to: dayjs('2026-10-15T00:00:00Z').valueOf(),
    },
  },
};

export const HistoryDate: Story = { args: { fields: ['updated'], label: 'Date' } };

export const PicksPreset: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, body } = await StoryScreens.openFromButton(canvasElement, 'Date');
    const option = await body.findByRole('menuitemradio', { name: 'Last 7 days' });
    await userEvent.click(option);
    const message = await canvas.findByText('Last 7 days');
    await expect(message).toBeInTheDocument();
  },
};

export const SwitchesField: Story = {
  args: { initial: { field: 'updated', preset: 'week', from: null, to: null } },
  play: async ({ canvasElement }) => {
    const { canvas, body } = await StoryScreens.openFromButton(canvasElement, 'Date');
    const button = await body.findByRole('button', { name: 'Created' });
    await userEvent.click(button);
    const message = await canvas.findByText('Created');
    await expect(message).toBeInTheDocument();
  },
};

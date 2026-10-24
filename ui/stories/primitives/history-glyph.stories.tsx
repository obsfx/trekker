import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryGlyph } from '@/ui/primitives/history-glyph.tsx';

const GLYPHS = ['create', 'update', 'delete', 'comment', 'dependency'] as const;

const meta = {
  title: 'Primitives/HistoryGlyph',
  component: HistoryGlyph,
  args: { glyph: 'update' },
  argTypes: { glyph: { control: 'select', options: GLYPHS } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof HistoryGlyph>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllGlyphs: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-1.5">
        {GLYPHS.map((glyph) => {
          return (
            <span key={glyph} className="flex items-center gap-1.5 text-xs text-fg-2">
              <HistoryGlyph glyph={glyph} />
              {glyph}
            </span>
          );
        })}
      </div>
    );
  },
};

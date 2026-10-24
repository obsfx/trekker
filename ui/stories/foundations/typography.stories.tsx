import type { Meta, StoryObj } from '@storybook/react-vite';

const SIZES = ['text-micro', 'text-mini', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
const WEIGHTS = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'];

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const GoogleSansFlex: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-2 font-sans">
        {SIZES.map((size) => {
          return (
            <div key={size} className="flex items-baseline gap-4">
              <span className="w-20 font-mono text-micro text-fg-3">{size}</span>
              <span className={size}>Ship the board at 10k tickets for every agent</span>
            </div>
          );
        })}
        <div className="mt-2 flex gap-4 text-sm">
          {WEIGHTS.map((weight) => {
            return (
              <span key={weight} className={weight}>
                {weight}
              </span>
            );
          })}
        </div>
      </div>
    );
  },
};

export const GoogleSansCode: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-2 font-mono">
        <span className="text-xs">TREK-131 EPIC-20 P0 P1 P2 0123456789</span>
        <span className="text-sm">trekker serve --port 3000 --open</span>
        <span className="text-sm font-semibold">const page = await items.next(cursor)</span>
      </div>
    );
  },
};

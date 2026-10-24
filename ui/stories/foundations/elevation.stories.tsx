import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';

const RADIUS_CLASSES = [
  'rounded-1',
  'rounded-2',
  'rounded-3',
  'rounded-4',
  'rounded-5',
  'rounded-6',
  'rounded-7',
  'rounded-8',
  'rounded-9',
  'rounded-pill',
];
const SHADOW_CLASSES = ['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'];

const meta = {
  title: 'Foundations/Radii and shadows',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Radii: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap gap-3">
        {RADIUS_CLASSES.map((radius) => {
          return (
            <div
              key={radius}
              className={clsx(
                'flex size-20 items-end border border-line-body bg-canvas-2 p-1',
                radius
              )}
            >
              <span className="font-mono text-micro text-fg-3">{radius}</span>
            </div>
          );
        })}
      </div>
    );
  },
};

export const Shadows: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap gap-6 bg-canvas-1 p-6">
        {SHADOW_CLASSES.map((shadow) => {
          return (
            <div
              key={shadow}
              className={clsx('flex size-24 items-end rounded-5 bg-canvas p-1.5', shadow)}
            >
              <span className="font-mono text-micro text-fg-3">{shadow}</span>
            </div>
          );
        })}
      </div>
    );
  },
};

export const FocusRing: Story = {
  render: () => {
    return (
      <button
        type="button"
        className="h-7 rounded-4 border border-line-body px-3 text-xs focus-ring"
      >
        Focused control
      </button>
    );
  },
};

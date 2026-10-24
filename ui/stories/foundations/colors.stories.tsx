import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';

const SURFACE_CLASSES = ['bg-canvas', 'bg-canvas-1', 'bg-canvas-2', 'bg-canvas-3', 'bg-canvas-4'];
const TEXTS = ['text-fg', 'text-fg-1', 'text-fg-2', 'text-fg-3', 'text-fg-4'];
const BORDER_CLASSES = [
  'border-line-subtle',
  'border-line-muted',
  'border-line',
  'border-line-body',
  'border-line-emphasized',
];
const THEME_NAMES = ['primary', 'accent', 'success', 'danger', 'warning', 'info', 'secondary'];
const THEME_SLOTS = ['', '-fg', '-emphasis', '-subtle', '-muted', '-border'];

interface SwatchProps {
  className: string;
  label: string;
}

function Swatch({ className, label }: SwatchProps) {
  return (
    <div className="flex w-36 flex-col gap-1">
      <div className={clsx('h-10 rounded-4 border border-line-muted', className)} />
      <span className="font-mono text-micro text-fg-3">{label}</span>
    </div>
  );
}

const meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Surfaces: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap gap-3">
        {SURFACE_CLASSES.map((name) => {
          return <Swatch key={name} className={name} label={name} />;
        })}
      </div>
    );
  },
};

export const Text: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-1">
        {TEXTS.map((name) => {
          return (
            <span key={name} className={clsx('text-sm', name)}>
              {name}: Event feed and SSE with replay after reconnect
            </span>
          );
        })}
      </div>
    );
  },
};

export const Borders: Story = {
  render: () => {
    return (
      <div className="flex flex-wrap gap-3">
        {BORDER_CLASSES.map((name) => {
          return (
            <div
              key={name}
              className={clsx('flex h-12 w-36 items-end rounded-4 border-2 p-1', name)}
            >
              <span className="font-mono text-micro text-fg-3">{name}</span>
            </div>
          );
        })}
      </div>
    );
  },
};

export const Themes: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-3">
        {THEME_NAMES.map((theme) => {
          return (
            <div key={theme} className="flex flex-wrap gap-2">
              {THEME_SLOTS.map((slot) => {
                const name = `${theme}${slot}`;
                return <Swatch key={name} className={`bg-${name}`} label={name} />;
              })}
            </div>
          );
        })}
      </div>
    );
  },
};

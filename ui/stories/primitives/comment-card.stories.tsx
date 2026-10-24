import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbPencil } from 'react-icons/tb';

import { CommentCard } from '@/ui/primitives/comment-card.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { MarkdownView } from '@/ui/primitives/markdown-view.tsx';

const meta = {
  title: 'Primitives/CommentCard',
  component: CommentCard,
  args: {
    author: 'agent',
    time: '12m',
    timeTitle: 'Oct 24, 2026 14:20',
    edited: false,
    actions: (
      <IconButton aria-label="Edit comment" className="size-5">
        <TbPencil className="size-3" />
      </IconButton>
    ),
    children: <MarkdownView source="Added `?after=<id>` replay capped at **2000** rows." />,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CommentCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Edited: Story = { args: { author: 'omercan', edited: true } };

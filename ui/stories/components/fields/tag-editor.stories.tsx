import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TagEditor } from '@/ui/components/fields/tag-editor.tsx';

interface TagEditorDemoProps {
  initial: string[];
}

function TagEditorDemo({ initial }: TagEditorDemoProps) {
  const [tags, setTags] = useState(initial);
  return <TagEditor tags={tags} onChange={setTags} />;
}

const meta = {
  title: 'Components/Fields/TagEditor',
  component: TagEditorDemo,
  args: { initial: ['backend', 'sse'] },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TagEditorDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithTags: Story = {};

export const Empty: Story = { args: { initial: [] } };

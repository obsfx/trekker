import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SearchResultList } from '@/ui/components/search/search-result-list.tsx';
import { useSearchResults } from '@/ui/hooks/use-search-results.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

interface SearchResultListPreviewProps {
  text: string;
  emptyLabel: string;
  onChoose: (hit: SearchHit) => void;
}

const NO_EXCLUSIONS: readonly string[] = [];

function SearchResultListPreview({ text, emptyLabel, onChoose }: SearchResultListPreviewProps) {
  const results = useSearchResults({ text, types: [] }, NO_EXCLUSIONS, onChoose);
  return (
    <div className="w-96 rounded-4 border border-line bg-canvas p-1">
      <SearchResultList {...results} emptyLabel={emptyLabel} />
    </div>
  );
}

const meta = {
  title: 'Components/Search/SearchResultList',
  component: SearchResultListPreview,
  args: { text: 'search', emptyLabel: 'No matches', onChoose: fn() },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SearchResultListPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoMatches: Story = {
  args: { text: 'zzzz-no-such-item' },
};

export const LoadsMorePages: Story = {
  args: { text: 'TREK' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByRole('group', { name: 'Search results' });
    list.scrollTop = list.scrollHeight;
    const loadMore = await canvas.findByRole('button', { name: /Load 50 more/ });
    await expect(loadMore).toHaveTextContent('50 of');
    await userEvent.click(loadMore);
    list.scrollTop = list.scrollHeight;
    const shown = await canvas.findByText('100 of', { exact: false });
    await expect(shown).toBeInTheDocument();
  },
};

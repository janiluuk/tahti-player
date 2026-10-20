import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewsFeedSuggestions } from '@tahti-web/components/NewsFeedSuggestions';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof NewsFeedSuggestions> = {
  title: 'Tahti/Widgets/NewsFeedSuggestions',
  component: NewsFeedSuggestions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DJ and music-production RSS feeds offered in the News add-on (Settings → Add-ons → News). One click adds a feed to Listen and Discover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive() {
  const [added, setAdded] = useState<Set<string>>(new Set());
  return (
    <NewsFeedSuggestions
      addedUrls={added}
      onAdd={(feed) => setAdded((prev) => new Set(prev).add(feed.url))}
    />
  );
}

export const Default: Story = {
  render: () => <Interactive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add Mixmag' }));
    await expect(
      canvas.getByRole('button', { name: 'Mixmag added' }),
    ).toBeDisabled();
  },
};

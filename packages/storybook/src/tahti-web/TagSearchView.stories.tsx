import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagSearchView } from '@tahti-web/views/TagSearchView';
import { expect, within } from 'storybook/test';

import { TAG, tagTracksData } from './_fixtures/discover';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TagSearchView> = {
  title: 'Tahti/Discover/TagSearchView',
  component: TagSearchView,
  parameters: {
    layout: 'padded',
    mockData: tagTracksData,
    docs: {
      description: {
        component:
          '`/search?tag=` - public tracks carrying one tag, reached from the tag chips on a track page. Each row links to the track page.',
      },
    },
  },
  args: { tag: TAG },
  decorators: [withTahtiRouter(`/search?tag=${TAG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: `#${TAG}` }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('link', { name: /Aurora Drift/ }),
    ).toHaveAttribute('href', '/t/northern-lights-archive-1');
    await expect(canvas.getAllByRole('link')).toHaveLength(3);
  },
};

export const NoResults: Story = {
  parameters: { mockData: { tagTracks: [] } },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        'No public tracks have this tag yet',
      ),
    ).toBeVisible();
  },
};

export const NoTag: Story = {
  args: { tag: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('No tag chosen'),
    ).toBeVisible();
  },
};

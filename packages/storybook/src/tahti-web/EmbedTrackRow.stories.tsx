import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmbedTrackRow } from '@tahti-web/components/EmbedTrackRow';
import { clearEmbedThumbnailCache } from '@tahti-web/lib/embedThumbnail';
import { expect, waitFor, within } from 'storybook/test';

const meta: Meta<typeof EmbedTrackRow> = {
  title: 'Tahti/Media/EmbedTrackRow',
  component: EmbedTrackRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ul className="flex max-w-md flex-col gap-2">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Hearthis: Story = {
  args: {
    title: 'Late Night Session',
    provider: 'HEARTHIS',
    embedUri: 'late-night-session',
  },
};

export const Mixcloud: Story = {
  args: {
    title: 'Deep House Mix',
    provider: 'MIXCLOUD',
    embedUri: 'northern-lights/deep-house-mix',
  },
};

export const Spotify: Story = {
  args: {
    title: 'Aurora',
    provider: 'SPOTIFY',
    embedUri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
  },
};

export const Bandcamp: Story = {
  args: {
    title: 'Downtempo EP',
    provider: 'BANDCAMP',
    embedUri: 'album=1234567890',
  },
};

/** No stored cover: the row asks the thumbnail proxy (a bundled cover in
 * mock mode) and never stays on an empty thumbnail. */
export const NoStoredCover: Story = {
  args: {
    title: 'Coverless mix',
    provider: 'MIXCLOUD',
    embedUri: 'https://www.mixcloud.com/northern-lights/coverless-mix/',
    artworkUrl: null,
  },
  beforeEach: () => {
    clearEmbedThumbnailCache();
    return () => {
      clearEmbedThumbnailCache();
    };
  },
  play: async ({ canvasElement }) => {
    const play = await within(canvasElement).findByRole('button', {
      name: 'Play Coverless mix on Mixcloud',
    });
    await waitFor(() => {
      expect(play.querySelector('img')).toHaveAttribute(
        'src',
        '/mock/dj-moonlight/cover-moonlight-drive.svg',
      );
    });
  },
};

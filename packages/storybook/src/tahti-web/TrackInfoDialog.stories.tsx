import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import {
  TrackInfoDialog,
  type TrackInfo,
} from '@tahti-web/components/TrackInfoDialog';
import { expect, fn, userEvent } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof TrackInfoDialog> = {
  title: 'Tahti/Track/TrackInfoDialog',
  component: TrackInfoDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/u/northern-lights')],
  args: {
    isOpen: true,
    onClose: fn(),
  },
};

const selectFrostLine = fn();

export default meta;
type Story = StoryObj<typeof meta>;

const playable: TahtiPlayable = {
  id: 'sound:archive-item-1',
  kind: 'sound',
  title: 'Aurora',
  artist: 'Northern Lights',
  coverUrl: 'https://picsum.photos/seed/aurora/200/200',
  streamUrl: 'https://cdn.tahti.live/archive/aurora.mp3',
  protocol: 'https',
  channelSlug: 'northern-lights',
};

// Signed in as the track's own artist — shows love / add-to-playlist and
// (because the signed-in user has a channel) the Mixcloud export section.
export const WithArtistTools: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  args: {
    track: {
      title: 'Aurora',
      artistName: 'Northern Lights',
      artistUsername: 'northern-lights',
      artworkUrl: 'https://picsum.photos/seed/aurora/200/200',
      meta: '3m ago',
      playable,
      tracklist: [
        { id: 'archive-item-1', title: 'Aurora', active: true },
        {
          id: 'archive-item-2',
          title: 'Frost Line',
          onSelect: selectFrostLine,
        },
        {
          id: 'archive-item-3',
          title: 'Aurora (Reprise)',
          onSelect: () => {},
        },
      ],
    } satisfies TrackInfo,
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Track info');
    await expect(
      dialog.getByRole('link', { name: 'Artist page' }),
    ).toHaveAttribute('href', '/u/northern-lights');
    // The playing entry can't be re-selected; another one can.
    await expect(
      dialog.getByRole('button', { name: /Aurora$/ }),
    ).toBeDisabled();
    await userEvent.click(dialog.getByRole('button', { name: /Frost Line/ }));
    await expect(selectFrostLine).toHaveBeenCalled();
    const love = dialog.getByRole('button', { name: 'Love' });
    await userEvent.click(love);
    await expect(
      await dialog.findByRole('button', { name: 'Loved' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(dialog.getByRole('button', { name: 'Loved' }));
  },
};

// A live/ephemeral signal with no catalog entry — no love/playlist icons,
// no tracklist, and shown to a signed-out listener.
export const LiveSignalNoCatalogEntry: Story = {
  decorators: [withMockAuth(null)],
  args: {
    track: {
      title: 'Tahti Radio — live now',
      artistName: 'DJ Frost',
      artistUsername: null,
      artworkUrl: null,
      meta: 'Live now',
      playable: null,
    } satisfies TrackInfo,
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Track info');
    await expect(dialog.queryByRole('button', { name: 'Love' })).toBeNull();
    await expect(dialog.queryByText('Tracklist')).toBeNull();
    await expect(
      dialog.queryByRole('link', { name: 'Artist page' }),
    ).toBeNull();
  },
};

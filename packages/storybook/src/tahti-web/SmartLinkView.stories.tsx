import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { SmartLinkView } from '@tahti-web/views/SmartLinkView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ALL_DSP_TARGETS,
  DISCOGS_URL,
  LOCKED_TRACK_TITLE,
  MUSICBRAINZ_URL,
  RELEASE_TITLE,
  SMART_LINK_SLUG,
  smartLinkNoFooterData,
  smartLinkNoTargetsData,
  smartLinkRichData,
} from './_fixtures/release';
import { clickRowPlay } from './_fixtures/track-table';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const DSP_LABELS = [
  'Spotify',
  'Apple Music',
  'Tidal',
  'Bandcamp',
  'SoundCloud',
  'YouTube Music',
  'Deezer',
  'Amazon Music',
  'Mixcloud',
];

const meta: Meta<typeof SmartLinkView> = {
  title: 'Tahti/Release/SmartLinkView',
  component: SmartLinkView,
  parameters: {
    layout: 'padded',
    mockData: smartLinkRichData,
    docs: {
      description: {
        component:
          'The public release / smart-link page at `/r/$slug`: release header (genre line, play all, embed, report), playable tracks, locked tracks behind the access gate, downloads, "Listen on" DSP links, per-track credits with ℗/© lines and MusicBrainz/Discogs links, more from the artist, and the optional Powered-by footer. Fixtures live in `_fixtures/release.ts`.',
      },
    },
  },
  args: { slug: SMART_LINK_SLUG },
  decorators: [withTahtiRouter(`/r/${SMART_LINK_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function findRelease(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { level: 1, name: RELEASE_TITLE });
  return canvas;
}

export const Visitor: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement, step }) => {
    const canvas = await findRelease(canvasElement);

    await step('header shows the year · genre · type line', async () => {
      await expect(canvas.getByText('2026 · ambient · EP')).toBeVisible();
    });

    await step('playing a track loads it into the player', async () => {
      await clickRowPlay(canvasElement, 'Midnight Broadcast');
      await waitFor(() =>
        expect(usePlayerStore.getState().currentId).toBe(
          'sound:northern-lights-archive-2',
        ),
      );
    });

    await step('locked track sits behind the subscriber gate', async () => {
      const locked = within(canvas.getByTestId('smart-link-locked-tracks'));
      await expect(locked.getByText(LOCKED_TRACK_TITLE)).toBeVisible();
      await expect(
        locked.getByRole('link', { name: /Subscribe to listen/ }),
      ).toBeVisible();
    });

    await step(
      'every DSP is listed, Deezer/Amazon/Mixcloud included',
      async () => {
        const listenOn = within(
          canvas.getByRole('region', { name: 'Listen on' }),
        );
        for (const label of DSP_LABELS) {
          await expect(
            listenOn.getByRole('link', { name: new RegExp(`^${label}`) }),
          ).toBeVisible();
        }
        await expect(
          listenOn.getByRole('link', { name: /^Deezer/ }),
        ).toHaveAttribute('href', ALL_DSP_TARGETS.deezer);
      },
    );

    await step('credits, rights lines and catalog links', async () => {
      const credits = within(canvas.getByRole('region', { name: 'Credits' }));
      await expect(
        credits.getByRole('link', { name: 'DJ Moonlight' }),
      ).toHaveAttribute('href', '/u/dj-moonlight');
      await expect(credits.queryByText(/@example\.com/)).toBeNull();
      await expect(credits.getByText('℗ 2026 Northern Lights')).toBeVisible();
      await expect(credits.getByText('© 2026 Tahti Records')).toBeVisible();
      await expect(
        credits.getByRole('link', { name: /MusicBrainz/ }),
      ).toHaveAttribute('href', MUSICBRAINZ_URL);
      await expect(
        credits.getByRole('link', { name: /Discogs/ }),
      ).toHaveAttribute('href', DISCOGS_URL);
    });

    await step('Powered by Tahti footer is on', async () => {
      await expect(
        canvas.getByRole('link', { name: 'Powered by Tahti' }),
      ).toBeVisible();
    });

    await step('report dialog opens and cancels', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: `Report ${RELEASE_TITLE}` }),
      );
      const dialog = await findDialog(canvasElement, `Report ${RELEASE_TITLE}`);
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      await expectNoDialog(canvasElement);
    });
  },
};

export const PlayAll: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = await findRelease(canvasElement);
    const header = within(canvas.getByTestId('release-social-header'));
    await userEvent.click(header.getByRole('button', { name: 'Play all' }));
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).toBe(
        'sound:northern-lights-archive-1',
      ),
    );
  },
};

// The artist viewing their own release gets no report button.
export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = await findRelease(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: `Report ${RELEASE_TITLE}` }),
    ).toBeNull();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};

export const NoPoweredByFooter: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: smartLinkNoFooterData },
  play: async ({ canvasElement }) => {
    const canvas = await findRelease(canvasElement);
    await expect(
      canvas.queryByRole('link', { name: 'Powered by Tahti' }),
    ).toBeNull();
  },
};

export const NoStreamingTargets: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: smartLinkNoTargetsData },
  play: async ({ canvasElement }) => {
    const canvas = await findRelease(canvasElement);
    const listenOn = within(canvas.getByRole('region', { name: 'Listen on' }));
    await expect(listenOn.getAllByRole('link')).toHaveLength(1);
    await expect(listenOn.getByRole('link', { name: 'Tahti' })).toBeVisible();
  },
};

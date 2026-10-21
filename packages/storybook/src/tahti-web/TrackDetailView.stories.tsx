import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAuthModalStore } from '@tahti-web/stores/authModalStore';
import { TrackDetailView } from '@tahti-web/views/TrackDetailView';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import {
  FULL_TRACK_DETAIL,
  PURCHASE_GATED_DETAIL,
  SUBSCRIBERS_ONLY_DETAIL,
  TRACK_ID,
  withLocationProbe,
  withToaster,
} from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { findDialog, findToast } from './_lib/play';

const meta: Meta<typeof TrackDetailView> = {
  title: 'Tahti/Track/TrackDetailView',
  component: TrackDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The listener-facing full-screen page for a single sound: waveform, artwork, and an ambient backdrop built from the cover art's dominant color — no edit UI for anyone who isn't the owner or a board member. Reached via `/t/$id`, and now the default destination for clicking a track anywhere in the app (`PlayableTrackTable`'s title/\"Open track\" action). The pencil button only renders for the sound's owner or a BOARD admin and opens the same `TrackEditDialog` used in Studio.",
      },
    },
  },
  args: { id: TRACK_ID },
  decorators: [withToaster(), withTahtiRouter(`/t/${TRACK_ID}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default view for everyone who isn't the owner or a board admin — no edit
// affordance at all, matching "no edit forms or anything" for listeners.
export const Listener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Download' });
    await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull();
  },
};

// Signed in as the sound's own artist — the pencil button opens
// TrackEditDialog (the same editor Studio's Sounds list uses).
export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Edit' }));
    await findDialog(canvasElement, 'Edit track');
    // Owners can't report their own track.
    await expect(canvas.queryByRole('button', { name: /^Report / })).toBeNull();
  },
};

// A board member viewing someone else's sound also gets the edit button,
// even though they don't own the channel.
export const Admin: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
};

// Signed out — same read-only view as Listener, just without the
// sign-in-gated comment composer.
export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};

// Every row of the Details block: genre + sub-genres, tag chips, BPM/key,
// CC licence, credits (one linked to a member), the recorded-at venue and
// the artist commentary — plus the mix version and the AI-generated badge
// in the hero. Clicking a tag chip searches that tag.
export const FullDetails: Story = {
  decorators: [withLocationProbe(), withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ trackDetail: FULL_TRACK_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByRole('heading', {
      name: /Kaamos Bloom/,
    });
    await expect(heading).toHaveTextContent('Kaamos Bloom (Extended Mix)');
    await expect(canvas.getByText('AI-generated')).toBeVisible();

    const details = within(canvas.getByTestId('track-details'));
    await expect(
      details.getByText('Ambient · Dub techno · Drone'),
    ).toBeVisible();
    await expect(details.getByText('118')).toBeVisible();
    await expect(details.getByText('Am')).toBeVisible();
    await expect(details.getByText('CC BY-NC')).toBeVisible();
    await expect(details.getByRole('link', { name: 'Liina' })).toHaveAttribute(
      'href',
      '/u/listener-liina',
    );
    await expect(details.getByText('Kaamos Audio')).toBeVisible();
    await expect(
      details.getByRole('link', { name: 'Kuudes Linja' }),
    ).toHaveAttribute('href', '/v/kuudes-linja');
    await expect(
      details.getByText(/first night of polar winter/),
    ).toBeVisible();

    const tags = within(details.getByRole('list', { name: 'Tags' }));
    await expect(tags.getAllByRole('link')).toHaveLength(3);
    const helsinki = tags.getByRole('link', { name: '#Helsinki' });
    await expect(helsinki).toHaveAttribute('href', '/search?tag=Helsinki');
    await userEvent.click(helsinki);
    await waitFor(() =>
      expect(canvas.getByTestId('story-location')).toHaveTextContent(
        '/search?tag=Helsinki',
      ),
    );
  },
};

// Report opens the moderation dialog and sends the report.
export const ReportTrack: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ trackDetail: FULL_TRACK_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Report Kaamos Bloom' }),
    );
    const dialog = await findDialog(canvasElement, 'Report Kaamos Bloom');
    await expect(
      dialog.getByRole('button', { name: 'Reason' }),
    ).toHaveTextContent('Copyright infringement');
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Details' }),
      'This is my own unreleased track.',
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Send report' }));
    await findToast(canvasElement, /Report sent/);
  },
};

// Download fetches the file and hands it to the browser through a
// temporary link; the spy keeps the test page from following it.
export const DownloadTrack: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ trackDetail: FULL_TRACK_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const downloads: string[] = [];
    const click = spyOn(
      HTMLAnchorElement.prototype,
      'click',
    ).mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    try {
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Download' }),
      );
      await waitFor(() => expect(downloads).toEqual(['tahti-sound.mp3']));
    } finally {
      click.mockRestore();
    }
  },
};

// The artist turned downloads off: the track still plays, but there's no
// Download button.
export const DownloadsOff: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      trackDetail: { ...FULL_TRACK_DETAIL, downloadsEnabled: false },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Play' });
    await expect(canvas.queryByRole('button', { name: 'Download' })).toBeNull();
  },
};

// Fan-subscribers-only track, signed in without a subscription: the
// player is replaced by the gate, which points at the artist's tiers.
export const SubscribersOnlySignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ trackDetail: SUBSCRIBERS_ONLY_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gate = within(
      await canvas.findByRole('region', { name: 'Fan subscribers only' }),
    );
    await expect(
      gate.getByRole('link', { name: 'Subscribe to listen' }),
    ).toHaveAttribute('href', '/subscribe/northern-lights');
    await expect(
      gate.queryByRole('button', { name: 'Sign in to listen' }),
    ).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Play' })).toBeNull();
  },
};

// Same gate signed out: "Sign in to listen" opens the login modal.
export const SubscribersOnlySignedOut: Story = {
  decorators: [withMockAuth(null)],
  parameters: { mockData: mockData({ trackDetail: SUBSCRIBERS_ONLY_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    useAuthModalStore.getState().close();
    const gate = within(
      await canvas.findByRole('region', { name: 'Fan subscribers only' }),
    );
    await userEvent.click(
      gate.getByRole('button', { name: 'Sign in to listen' }),
    );
    await expect(useAuthModalStore.getState()).toMatchObject({
      isOpen: true,
      mode: 'login',
    });
    useAuthModalStore.getState().close();
  },
};

// Purchase-gated, pay-what-you-want track: "Buy this track" opens the
// name-your-price dialog, which rejects a negative amount.
export const PurchaseGated: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ trackDetail: PURCHASE_GATED_DETAIL }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gate = within(
      await canvas.findByRole('region', { name: 'Buy to listen' }),
    );
    await expect(gate.getByText(/name your price/)).toBeVisible();
    await expect(
      gate.getByRole('link', { name: 'Subscribe instead' }),
    ).toBeVisible();
    await userEvent.click(gate.getByRole('button', { name: 'Buy this track' }));

    const dialog = await findDialog(canvasElement, 'Name your price');
    await expect(dialog.getByText(/€3\.00 as a suggestion/)).toBeVisible();
    const amount = dialog.getByRole('textbox', { name: 'Amount (€)' });
    await expect(amount).toHaveValue('3.00');
    await userEvent.clear(amount);
    await userEvent.type(amount, '-1');
    await userEvent.click(
      dialog.getByRole('button', { name: 'Buy this track' }),
    );
    await findToast(canvasElement, 'Enter an amount of €0 or more.');
  },
};

// Signed out on a purchase-gated track: sign in first, or subscribe.
export const PurchaseGatedSignedOut: Story = {
  decorators: [withMockAuth(null)],
  parameters: { mockData: mockData({ trackDetail: PURCHASE_GATED_DETAIL }) },
  play: async ({ canvasElement }) => {
    const gate = within(
      await within(canvasElement).findByRole('region', {
        name: 'Buy to listen',
      }),
    );
    await expect(
      gate.getByRole('button', { name: 'Sign in to listen' }),
    ).toBeVisible();
    await expect(
      gate.queryByRole('button', { name: 'Buy this track' }),
    ).toBeNull();
  },
};

// Per-story fixture override (see _lib/README.md): the same view with a
// track whose title differs from the shared mock.
export const OverriddenTrack: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({ trackDetail: { title: 'Midsummer Overdrive' } }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Midsummer Overdrive' }),
    ).toBeVisible();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistView } from '@tahti-web/views/ArtistView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ARTIST_NAME,
  ARTIST_USERNAME,
  artistHeroHiddenData,
  artistRichData,
  artistThemeFallbackData,
  AVATAR_GIF,
  AVATAR_POSTER,
  PINNED_RELEASE_TITLE,
  stubMediaPlayback,
  TIP_JAR_URL,
} from './_fixtures/artist';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog, selectTab } from './_lib/play';

const meta: Meta<typeof ArtistView> = {
  title: 'Tahti/Artist/ArtistView',
  component: ArtistView,
  parameters: {
    layout: 'fullscreen',
    mockData: artistRichData,
    docs: {
      description: {
        component:
          'The public artist page at `/u/$username`: hero (avatar or avatar theme, nameplate, Tahti ry member badge, stats, header actions incl. background music and report), popular tracks, releases (pinned first), playlists, bio, support (fan tiers + tip jar), store, news, and the Stage / Gallery / Design tabs. Fixtures live in `_fixtures/artist.ts`.',
      },
    },
  },
  args: { username: ARTIST_USERNAME },
  decorators: [withTahtiRouter(`/u/${ARTIST_USERNAME}`)],
  beforeEach: stubMediaPlayback,
};

export default meta;
type Story = StoryObj<typeof meta>;

async function findHero(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { level: 1, name: ARTIST_NAME });
  return canvas;
}

export const Visitor: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement, step }) => {
    const canvas = await findHero(canvasElement);

    await step(
      'hero shows nameplate, member badge and GIF poster',
      async () => {
        await expect(canvas.getByText('Resident')).toBeVisible();
        await expect(canvas.getByTestId('tahti-member-badge')).toBeVisible();
        const avatar = canvas.getByRole('button', {
          name: `Change ${ARTIST_NAME} artwork`,
        });
        const img = avatar.querySelector('img');
        await expect(img).toHaveAttribute('src', AVATAR_POSTER);
        avatar.focus();
        await waitFor(() => expect(img).toHaveAttribute('src', AVATAR_GIF));
        avatar.blur();
      },
    );

    await step('pinned release is listed first', async () => {
      const releases = within(canvas.getByTestId('artist-releases'));
      const [first] = releases.getAllByTestId('card-title');
      await expect(first).toHaveTextContent(PINNED_RELEASE_TITLE);
    });

    await step('fan tiers list perks; tip jar opens in a new tab', async () => {
      const tiers = within(canvas.getByRole('region', { name: 'Fan tiers' }));
      await expect(tiers.getByText('Patron')).toBeVisible();
      await expect(
        tiers.getByRole('list', { name: 'Patron perks' }),
      ).toHaveTextContent('Monthly thank-you mix');
      const tipJar = canvas.getByRole('link', { name: 'Tip jar' });
      await expect(tipJar).toHaveAttribute('href', TIP_JAR_URL);
      await expect(tipJar).toHaveAttribute('target', '_blank');
      await expect(tipJar).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step('background music toggles on and off', async () => {
      const playLabel = `Play ${ARTIST_NAME}'s background music`;
      const muteLabel = `Mute ${ARTIST_NAME}'s background music`;
      await userEvent.click(canvas.getByRole('button', { name: playLabel }));
      await expect(
        await canvas.findByRole('button', { name: muteLabel }),
      ).toBeVisible();
      await userEvent.click(canvas.getByRole('button', { name: muteLabel }));
      await expect(
        await canvas.findByRole('button', { name: playLabel }),
      ).toBeVisible();
    });

    await step('report dialog opens and cancels', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: `Report ${ARTIST_NAME}` }),
      );
      const dialog = await findDialog(canvasElement, `Report ${ARTIST_NAME}`);
      await expect(
        dialog.getByRole('button', { name: 'Send report' }),
      ).toBeVisible();
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      await expectNoDialog(canvasElement);
    });

    await step('stage shows likes and upcoming events', async () => {
      await expect(
        await canvas.findByRole('region', { name: 'Liked tracks' }),
      ).toBeVisible();
      await expect(
        await canvas.findByText('Polar Static live at Kuudes Linja'),
      ).toBeVisible();
    });

    await step('visitor gets Stage and Gallery, no Design', async () => {
      await selectTab(canvas, /Gallery/);
      await selectTab(canvas, /Stage/);
      await expect(canvas.queryByRole('tab', { name: /Design/ })).toBeNull();
    });
  },
};

export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = await findHero(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: `Report ${ARTIST_NAME}` }),
    ).toBeNull();
    await selectTab(canvas, /Design/);
    await expect(
      await canvas.findByRole('link', { name: 'channel page' }),
    ).toBeVisible();
    await selectTab(canvas, /Stage/);
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = await findHero(canvasElement);
    await expect(
      canvas.getByRole('button', { name: `Log in to follow ${ARTIST_NAME}` }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: `Report ${ARTIST_NAME}` }),
    ).toBeVisible();
  },
};

export const AvatarThemeFallback: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: artistThemeFallbackData },
  play: async ({ canvasElement }) => {
    const canvas = await findHero(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: `Change ${ARTIST_NAME} artwork` }),
    ).toBeNull();
  },
};

export const HeroHidden: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: artistHeroHiddenData },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const actions = await canvas.findByTestId('artist-header-actions');
    await expect(canvas.queryByTestId('artist-social-header')).toBeNull();
    await expect(
      within(actions).getByRole('heading', { level: 1, name: ARTIST_NAME }),
    ).toHaveClass('sr-only');
    await expect(
      within(actions).getByRole('button', { name: `Report ${ARTIST_NAME}` }),
    ).toBeVisible();
  },
};

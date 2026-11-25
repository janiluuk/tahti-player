import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistView } from '@tahti-web/views/ArtistView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMotionAllowed } from '../_lib/motion';
import {
  ARTIST_NAME,
  ARTIST_USERNAME,
  artistHeroHiddenData,
  artistRichData,
  artistServerHiddenBlocksData,
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

/** Any CSS colour (rgb, oklch, …) as sRGB 0-255 plus alpha, via a 1×1 canvas. */
function toRgba(color: string): [number, number, number, number] {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!, a! / 255];
}

function luminance(color: string): number {
  const [r, g, b] = toRgba(color)
    .slice(0, 3)
    .map((part) => {
      const channel = part / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** The first opaque background behind `element`. The page paints its scheme
 * colour on an aria-hidden layer under the content, not on the page root,
 * so reaching the root means that layer's colour. */
function surfaceOf(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute('data-channel-scheme')) {
      const layer = node.querySelector(':scope > [aria-hidden]') ?? node;
      return getComputedStyle(layer).backgroundColor;
    }
    const background = getComputedStyle(node).backgroundColor;
    if (toRgba(background)[3] > 0.99) {
      return background;
    }
  }
  return getComputedStyle(document.body).backgroundColor;
}

async function expectReadable(element: Element) {
  const [high, low] = [
    luminance(getComputedStyle(element).color),
    luminance(surfaceOf(element)),
  ].sort((x, y) => y - x);
  await expect((high! + 0.05) / (low! + 0.05)).toBeGreaterThanOrEqual(4.5);
}

export const Visitor: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withMotionAllowed],
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
      for (const price of tiers.getAllByText(/^€\d+\/mo$/)) {
        await expectReadable(price);
      }
      const tipJar = canvas.getByRole('link', {
        name: 'Tip jar (opens in a new tab)',
      });
      await expect(tipJar).toHaveAttribute('href', TIP_JAR_URL);
      await expect(tipJar).toHaveAttribute('target', '_blank');
      await expect(tipJar).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step(
      'the dark scheme keeps the On SoundCloud heading readable',
      async () => {
        await expectReadable(
          await canvas.findByRole(
            'heading',
            { name: 'On SoundCloud' },
            { timeout: 5000 },
          ),
        );
      },
    );

    await step('background music toggles on and off', async () => {
      const playLabel = `Play ${ARTIST_NAME}'s background music`;
      const muteLabel = `Mute ${ARTIST_NAME}'s background music`;
      await userEvent.click(canvas.getByRole('button', { name: playLabel }));
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: muteLabel })).toBeVisible(),
      );
      await userEvent.click(canvas.getByRole('button', { name: muteLabel }));
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: playLabel })).toBeVisible(),
      );
    });

    await step('report dialog opens and cancels', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: `More actions for ${ARTIST_NAME}` }),
      );
      await userEvent.click(
        await within(document.body).findByRole('button', { name: 'Report' }),
      );
      const dialog = await findDialog(canvasElement, `Report ${ARTIST_NAME}`);
      await expect(
        dialog.getByRole('button', { name: 'Send report' }),
      ).toBeVisible();
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      await expectNoDialog(canvasElement);
    });

    await step('stage shows likes and upcoming events', async () => {
      await waitFor(() =>
        expect(
          canvas.getByRole('region', { name: 'Liked tracks' }),
        ).toBeVisible(),
      );
      await waitFor(() =>
        expect(
          canvas.getByText('Polar Static live at Kuudes Linja'),
        ).toBeVisible(),
      );
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
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: 'channel page' })).toBeVisible(),
    );
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
      canvas.getByRole('button', { name: `More actions for ${ARTIST_NAME}` }),
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
      within(actions).getByRole('button', {
        name: `More actions for ${ARTIST_NAME}`,
      }),
    ).toBeVisible();
  },
};

export const ServerHiddenBlocks: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: artistServerHiddenBlocksData },
  beforeEach: () => {
    const restoreMedia = stubMediaPlayback();
    localStorage.removeItem(`tahti.artistLookBlocks.${ARTIST_USERNAME}`);
    return restoreMedia;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = await findHero(canvasElement);

    await step("the visitor gets the artist's hidden blocks", async () => {
      await waitFor(() =>
        expect(canvas.queryByRole('tab', { name: /Gallery/ })).toBeNull(),
      );
      await expect(
        canvas.queryByText(/Started as a pirate shortwave project/),
      ).toBeNull();
    });

    await step('other blocks still show', async () => {
      await expect(canvas.getByTestId('artist-releases')).toBeVisible();
      await expect(canvas.getByRole('tab', { name: /Stage/ })).toBeVisible();
    });
  },
};

/** A phone: the short header (name, then the actions, then one row of
 * counts) leaves the first section, the tracks, starting above the fold,
 * and those tracks sit on the page without a card around them. The story
 * has no AppShell padding for the page's full-bleed margins to cancel, so
 * the width check is on the blocks, not the document. */
export const PhoneHierarchy: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { viewport: { defaultViewport: 'mobile2' } },
  play: async ({ canvasElement }) => {
    const canvas = await findHero(canvasElement);
    if (window.innerWidth >= 640) {
      return;
    }
    const header = canvas.getByTestId('artist-social-header');
    const title = within(header).getByRole('heading', {
      level: 1,
      name: ARTIST_NAME,
    });
    const actions = within(header).getByTestId('entity-social-header-actions');
    const popular = await canvas.findByTestId('artist-popular');

    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      title.getBoundingClientRect().bottom,
    );
    await expect(popular.getBoundingClientRect().top).toBeGreaterThan(
      header.getBoundingClientRect().bottom,
    );
    await expect(popular.getBoundingClientRect().top).toBeLessThan(
      window.innerHeight,
    );
    await expect(
      within(popular).getByTestId('ambient-track-list'),
    ).toHaveAttribute('data-flush');
    for (const block of [header, popular]) {
      await expect(block.getBoundingClientRect().right).toBeLessThanOrEqual(
        window.innerWidth,
      );
    }
  },
};

/** Related artists sit on an opaque theme surface, so their names switch
 * back to the theme's text colour under any channel scheme. Light theme
 * over the fixture's dark scheme is the case that used to wash out. */
async function expectReadableRelatedArtists(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const related = await canvas.findByTestId(
    'artist-related',
    {},
    { timeout: 5000 },
  );
  const list = within(related).getByRole('list');
  await expect(
    toRgba(getComputedStyle(list).backgroundColor)[3],
  ).toBeGreaterThan(0.99);
  const links = within(related).getAllByRole('link');
  await expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    await expectReadable(link.querySelector('span') ?? link);
  }
}

export const RelatedArtistsLightTheme: Story = {
  globals: { themeId: 'nuclear:aurora', themeMode: 'light' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    await findHero(canvasElement);
    await expectReadableRelatedArtists(canvasElement);
  },
};

export const RelatedArtistsDarkTheme: Story = {
  globals: { themeId: 'nuclear:default', themeMode: 'dark' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    await findHero(canvasElement);
    await expectReadableRelatedArtists(canvasElement);
  },
};

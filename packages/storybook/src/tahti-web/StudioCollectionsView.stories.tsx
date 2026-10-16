import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StudioCollection } from '@tahti-web/api/studio-types';
import { StudioCollectionsView } from '@tahti-web/views/studio/StudioCollectionsView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { findDialog } from './_lib/play';

function withRichCollections(base: StudioCollection[]): StudioCollection[] {
  const template = base.find((row) => row.style === 'ALBUM') ?? base[0]!;
  return [
    ...base,
    {
      ...template,
      id: 'mock-collection-aurora-sessions',
      slug: 'aurora-sessions',
      name: 'Aurora Sessions',
      description: 'Unlisted album for member listening parties.',
      style: 'ALBUM',
      isPublic: false,
      visibility: 'UNLISTED',
      coverUrl: '/mock/northern-lights/cover-first-light.svg',
      itemCount: 6,
      releaseDate: '2026-03-15',
      genres: ['Ambient', 'Live'],
    },
    {
      ...template,
      id: 'mock-collection-signal-fragments',
      slug: 'signal-fragments',
      name: 'Signal Fragments',
      description: 'Short clips pulled from broadcast intros.',
      style: 'EP',
      isPublic: true,
      visibility: 'PUBLIC',
      coverUrl: '/mock/northern-lights/cover-polar-static.svg',
      itemCount: 4,
      releaseDate: '2026-01-08',
      genres: ['Electronic'],
    },
    {
      ...template,
      id: 'mock-collection-private-drafts',
      slug: 'private-drafts',
      name: 'Private drafts',
      description: 'Works in progress — not on the public profile.',
      style: 'PLAYLIST',
      isPublic: false,
      visibility: 'PRIVATE',
      itemCount: 3,
    },
  ];
}

const meta: Meta<typeof StudioCollectionsView> = {
  title: 'Tahti/Studio/StudioCollectionsView',
  component: StudioCollectionsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Collections: library section tabs, search, type filters, and the quick-create dialog for albums, EPs, playlists, DJ sets, podcasts, and series.',
      },
    },
    mockData: mockData({ studioCollections: withRichCollections }),
  },
  decorators: [
    withTahtiRouter('/studio/collections'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PopulatedGrid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: 'Midnight Archive' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Aurora Sessions' }),
    ).toBeVisible();
    await expect(canvas.getByText(/, unlisted/)).toBeVisible();
    await expect(canvas.getByText(/, private/)).toBeVisible();
    await expect(
      canvas.getAllByRole('link', { name: 'Design' }).length,
    ).toBeGreaterThan(0);
  },
};

export const FilteredEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Midnight Archive' });
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search collections' }),
      'zzzz-no-match',
    );
    await expect(
      canvas.getByText('No collections match these filters.'),
    ).toBeVisible();
  },
};

export const QuickCreateMobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Midnight Archive' });
    await userEvent.click(
      canvas.getByRole('button', { name: 'New collection' }),
    );
    const dialog = await findDialog(canvasElement, 'New collection');
    await expect(dialog.getByRole('textbox', { name: 'Title' })).toBeVisible();
    await expect(dialog.getByLabelText('Collection style')).toBeVisible();
  },
};

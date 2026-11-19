import type { Meta, StoryObj } from '@storybook/react-vite';
import { LibraryView } from '@tahti-web/views/LibraryView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta = {
  title: 'Tahti/Library/LibraryFollowingFiles',
  component: LibraryView,
  parameters: {
    docs: {
      description: {
        component:
          'Library is Favorites · Playlists · History · Following · Files for every account. Following lists who you follow (it used to sit in Settings → Artist). Files puts Media, Stash and, on desktop, Local files behind chips; `/library/media`, `/library/stash` and `/library/local` redirect to `/library/files`.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth(MOCK_USERS.listener)],
} satisfies Meta<typeof LibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectLibraryTabs = async (canvas: ReturnType<typeof within>) => {
  const tabs = await canvas.findAllByRole('tab');
  await expect(tabs.map((tab) => tab.textContent)).toEqual([
    'Favorites',
    'Playlists',
    'History',
    'Following',
    'Files',
  ]);
};

export const Following: Story = {
  args: { tab: 'following' },
  decorators: [withTahtiRouter('/library/following')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectLibraryTabs(canvas);
    await expect(
      canvas.getByRole('tab', { name: 'Following' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(await canvas.findByTestId('library-following')).toBeVisible();
  },
};

export const FilesMedia: Story = {
  args: { tab: 'files', kind: 'media' },
  decorators: [withTahtiRouter('/library/files')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectLibraryTabs(canvas);
    await expect(canvas.getByRole('tab', { name: 'Files' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const kinds = canvas.getByRole('radiogroup', { name: 'File types' });
    await expect(
      within(kinds).getByRole('radio', { name: 'Media' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      within(kinds).queryByRole('radio', { name: 'Local files' }),
    ).toBeNull();
  },
};

export const FilesStash: Story = {
  args: { tab: 'files', kind: 'stash' },
  decorators: [withTahtiRouter('/library/files?kind=stash')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const kinds = canvas.getByRole('radiogroup', { name: 'File types' });
    await expect(
      within(kinds).getByRole('radio', { name: 'Stash' }),
    ).toHaveAttribute('aria-checked', 'true');
  },
};

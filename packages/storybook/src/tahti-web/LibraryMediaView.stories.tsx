import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  deleteUserMedia,
  uploadUserMediaFile,
} from '@tahti-web/api/user-media';
import { LibraryMediaView } from '@tahti-web/views/LibraryMediaView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const PNG_1PX = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  ),
  (char) => char.charCodeAt(0),
);

/** The offline media library starts empty and only grows through
 * `uploadUserMediaFile`, so seed it that way and delete the seeds after. */
async function seedMedia() {
  const ids: string[] = [];
  for (const name of ['studio-backdrop.png', 'gig-poster.png']) {
    const result = await uploadUserMediaFile(
      new File([PNG_1PX], name, { type: 'image/png' }),
    );
    if (result.ok) {
      ids.push(result.data.id);
    }
  }
  return async () => {
    await Promise.all(ids.map((id) => deleteUserMedia(id)));
  };
}

const meta: Meta<typeof LibraryMediaView> = {
  title: 'Tahti/Library/LibraryMediaView',
  component: LibraryMediaView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Library → Files → Media (`/library/files`): background images and video loops in your Tahti media library, with search, type chips, sort, a preview link and Remove per file, and Purge unused for uploads nothing you own still points at.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/library/files'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFiles: Story = {
  beforeEach: seedMedia,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('gig-poster.png', {}, { timeout: 3000 }),
    ).toBeVisible();
    await expect(canvas.getByText('Media files')).toBeVisible();
    await expect(canvas.getByText('studio-backdrop.png')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Purge unused' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('searchbox', { name: 'Search media files' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open gig-poster.png' }),
    ).toBeVisible();

    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search media files' }),
      'poster',
    );
    await waitFor(() =>
      expect(canvas.queryByText('studio-backdrop.png')).toBeNull(),
    );
    await expect(canvas.getByText('gig-poster.png')).toBeVisible();
  },
};

export const RemoveFile: Story = {
  beforeEach: seedMedia,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole(
        'button',
        { name: 'Remove gig-poster.png' },
        { timeout: 3000 },
      ),
    );
    const dialog = await findDialog(
      canvasElement,
      'Remove gig-poster.png from your media files?',
    );
    await expect(
      dialog.getByText('The file is deleted from your media library.'),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Remove' }));
    await expectNoDialog(canvasElement);
    await waitFor(() =>
      expect(canvas.queryByText('gig-poster.png')).toBeNull(),
    );
    await expect(canvas.getByText('studio-backdrop.png')).toBeVisible();
  },
};

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No media files yet', {}, { timeout: 3000 }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        'Add background images or a video loop backdrop from Studio → Branding.',
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open Branding' }),
    ).toHaveAttribute('href', '/studio/profile/branding');
    await expect(
      canvas.queryByRole('button', { name: 'Purge unused' }),
    ).toBeNull();
  },
};

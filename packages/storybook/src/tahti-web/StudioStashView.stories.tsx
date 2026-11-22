import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioStashView } from '@tahti-web/views/studio/StudioStashView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioStashView> = {
  title: 'Tahti/Library/StudioStashView',
  component: StudioStashView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Library → Files → Stash (`/library/files?kind=stash`; the old `/studio/stash` redirects there). Studio accounts get their private, unlisted and stashed tracks with an edit action each, plus a Move to stash tab for uploading files; listeners get their private files only. Signed out it shows a sign-in gate.',
      },
    },
  },
  args: { embedded: true },
  decorators: [withTahtiRouter('/library/files'), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ArtistStash: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sections = await canvas.findByRole('tablist', {
      name: 'Stash sections',
    });
    await expect(
      within(sections).getByRole('tab', { name: 'All stash' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      within(sections).getByRole('tab', { name: 'Move to stash' }),
    ).toBeVisible();
    await expect(canvas.getByText('Stash tracks')).toBeVisible();
    await expectVisible(await canvas.findByText('Studio sketch A'));
    await expect(canvas.getByText('Bandcamp reference mix')).toBeVisible();
    await expect(canvas.getByText('Unlisted preview cut')).toBeVisible();
    await expect(canvas.queryByText('Coverless night drive')).toBeNull();
    await expect(
      canvas.getByRole('button', { name: 'Edit Studio sketch A' }),
    ).toBeVisible();
  },
};

export const ListenerFiles: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Your files'));
    await expect(
      canvas.getByText(
        'Private uploads you can share by link. Publishing tracks needs an artist channel.',
      ),
    ).toBeVisible();
    await expect(canvas.queryByText('Stash tracks')).toBeNull();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByText(
        'Sign in to upload private files and share them by link.',
      ),
    );
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible();
  },
};

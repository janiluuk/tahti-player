import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlatformNewsDialog } from '@tahti-web/components/PlatformNewsDialog';
import { expect, userEvent } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof PlatformNewsDialog> = {
  title: 'Tahti/News/PlatformNewsDialog',
  component: PlatformNewsDialog,
  decorators: [withTahtiRouter('/news'), withMockAuth()],
  args: {
    post: {
      id: 'news-1',
      headline: 'Tahti is open. Come find your next favourite.',
      summary:
        'The doors are open! Discover independent music and tune into community radio.\n\nNo ads. No tracking. Just music and the people who make it.',
      authorName: 'Tahti team',
      publishedAt: '2026-10-30T08:00:00.000Z',
      imageUrl: '/artwork-presets/artwork-01.webp',
    },
    onClose: () => {},
    onUpdated: () => {},
    onRemoved: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Opening: Story = {};
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** A board member reads an article: Edit opens the shared edit modal,
 * Remove asks in a red confirmation first; Cancel returns to the article. */
export const BoardActions: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expect(
      dialog.getByRole('button', { name: 'Edit article' }),
    ).toBeVisible();
    await userEvent.click(
      dialog.getByRole('button', {
        name: 'Remove “Tahti is open. Come find your next favourite.”',
      }),
    );
    const confirm = await findDialog(
      canvasElement,
      'Remove “Tahti is open. Come find your next favourite.”?',
    );
    await userEvent.click(confirm.getByRole('button', { name: 'Cancel' }));
    await expect(
      (await findDialog(canvasElement)).getByRole('button', {
        name: 'Edit article',
      }),
    ).toBeVisible();
  },
};

export const ReaderWithoutActions: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expect(
      dialog.queryByRole('button', { name: 'Edit article' }),
    ).toBeNull();
    await expect(dialog.queryByRole('button', { name: /^Remove/ })).toBeNull();
  },
};

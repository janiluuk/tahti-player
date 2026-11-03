import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioCollectionEditView } from '@tahti-web/views/studio/StudioCollectionEditView';
import { expect, userEvent, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const SLUG = 'midnight-archive';

const meta: Meta<typeof StudioCollectionEditView> = {
  title: 'Tahti/Studio/StudioCollectionEditView',
  component: StudioCollectionEditView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Library → Collections → one album, EP or series. Opens read-only: the header with cover, Play and queue, and the tracklist. The pencil icon button (Edit details) shows the details form, text layer, imports, Save and track reordering; `?edit=true` opens it straight in edit mode.',
      },
    },
  },
  args: { slug: SLUG, nav: 'library' },
  decorators: [withToaster(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
  decorators: [withTahtiRouter(`/library/collections/${SLUG}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Tracklist' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Edit details' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull();
    await expect(
      canvas.queryByRole('heading', { name: 'Text layer' }),
    ).toBeNull();
  },
};

export const Editing: Story = {
  decorators: [withTahtiRouter(`/library/collections/${SLUG}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Edit details' }),
    );
    await expect(
      await canvas.findByRole('button', { name: 'Done editing' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Text layer' }),
    ).toBeVisible();
  },
};

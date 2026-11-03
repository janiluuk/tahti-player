import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioPlaylistEditorView } from '@tahti-web/views/studio/playlists/StudioPlaylistEditorView';
import { expect, userEvent, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const SLUG = 'late-night-picks';

const meta: Meta<typeof StudioPlaylistEditorView> = {
  title: 'Tahti/Studio/StudioPlaylistEditorView',
  component: StudioPlaylistEditorView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Playlists → one playlist or DJ set. Opens read-only with the header and tracks; the pencil icon button (Edit details) shows the details form, Save, reordering, removal and the add-tracks controls.',
      },
    },
  },
  args: { slug: SLUG },
  decorators: [
    withToaster(),
    withTahtiRouter(`/studio/playlists/${SLUG}`),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Tracks' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('textbox', { name: 'Name' })).toBeNull();
    await expect(canvas.queryByText('Add from Library')).toBeNull();
  },
};

export const Editing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Edit details' }),
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible();
  },
};

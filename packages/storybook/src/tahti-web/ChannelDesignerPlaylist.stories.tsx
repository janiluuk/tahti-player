import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelPlaylistBlock } from '@tahti-web/components/ChannelPlaylistBlock';
import { ChannelPlaylistPicker } from '@tahti-web/components/ChannelPlaylistPicker';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Channel/Designer/Playlist',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/channel/northern-lights'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj;

/**
 * Channel page playlist widget. The tracklist display is the ambient track list (size / grid / list switcher and a remembered sort), same as Collection and SmartLink pages. Empty playlist covered by Block — Empty. Still missing: private / 404 load failure (use a bad slug), long titles wrapping under Cards.
 */
export const BlockTracklist: Story = {
  name: 'Block — Tracklist',
  render: () => (
    <div className="max-w-3xl">
      <ChannelPlaylistBlock
        playlistSlug="favorites-vault"
        display="tracklist"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId('ambient-track-list')).toBeVisible(),
    );
    await expect(
      canvas.getByRole('radiogroup', { name: 'Track size' }),
    ).toBeVisible();
  },
};

export const BlockEmpty: Story = {
  name: 'Block — Empty',
  render: () => (
    <div className="max-w-3xl">
      <ChannelPlaylistBlock playlistSlug="empty-vault" display="tracklist" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('No playable tracks yet')).toBeVisible(),
    );
    await expect(
      canvas.getByText('This playlist has no playable tracks yet.'),
    ).toBeVisible();
  },
};

export const BlockEmptyCards: Story = {
  name: 'Block — Empty (cards)',
  render: () => (
    <div className="max-w-3xl">
      <ChannelPlaylistBlock playlistSlug="empty-vault" display="cards" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('No playable tracks yet')).toBeVisible(),
    );
  },
};

export const BlockCards: Story = {
  name: 'Block — Cards',
  render: () => (
    <div className="max-w-3xl">
      <ChannelPlaylistBlock playlistSlug="favorites-vault" display="cards" />
    </div>
  ),
};

export const BlockEditing: Story = {
  name: 'Block — editing (compact title)',
  render: () => (
    <div className="max-w-3xl">
      <ChannelPlaylistBlock
        playlistSlug="favorites-vault"
        display="tracklist"
        editing
      />
    </div>
  ),
};

export const PickerAdd: Story = {
  name: 'Picker — Add playlist',
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <ChannelPlaylistPicker
          usedSlugs={['favorites-vault']}
          confirmLabel="Add playlist"
          onPick={(slug) => setPicked(slug)}
        />
        {picked ? (
          <p className="text-foreground-secondary text-xs">Picked: {picked}</p>
        ) : null}
      </div>
    );
  },
};

export const PickerCustomConfirm: Story = {
  name: 'Picker — custom confirm label',
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <ChannelPlaylistPicker
          confirmLabel="Show on channel"
          onPick={(slug) => setPicked(slug)}
        />
        {picked ? (
          <p className="text-foreground-secondary text-xs">Picked: {picked}</p>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Show on channel' }),
    );
    await waitFor(() => expect(canvas.getByText(/^Picked: /)).toBeVisible());
  },
};

export const PickerSettings: Story = {
  name: 'Picker — settings (apply on change)',
  render: () => {
    const [slug, setSlug] = useState('favorites-vault');
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <ChannelPlaylistPicker
          initialSlug={slug}
          usedSlugs={[slug]}
          applyOnChange
          onPick={setSlug}
        />
        <p className="text-foreground-secondary text-xs">Current: {slug}</p>
      </div>
    );
  },
};

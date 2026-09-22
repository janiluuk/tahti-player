import type { Meta, StoryObj } from '@storybook/react-vite';
import { EpisodeEditorRow } from '@tahti-web/views/studio/show-detail/EpisodeEditorRow';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof EpisodeEditorRow> = {
  title: 'Tahti/Studio/ShowDetail/EpisodeEditorRow',
  component: EpisodeEditorRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/shows'), withMockAuth()],
  args: { onSaved: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  id: 'ep-1',
  showId: 'show-1',
  episodeNumber: 4,
  title: 'Episode four',
  description: 'Guest mix and a chat about modular synths.',
  coverUrl: null,
  source: 'upload' as const,
  soundId: null,
  slotStartAt: null,
  slotEndAt: null,
  bookingId: null,
  createdAt: '2026-09-01T10:00:00Z',
};

export const Draft: Story = { args: { episode: { ...base, status: 'DRAFT' } } };

export const Scheduled: Story = {
  args: {
    episode: {
      ...base,
      status: 'SCHEDULED',
      source: 'broadcast',
      slotStartAt: '2026-09-28T19:00:00Z',
      slotEndAt: '2026-09-28T20:00:00Z',
    },
  },
};

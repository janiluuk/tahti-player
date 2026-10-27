import type { Meta, StoryObj } from '@storybook/react-vite';
import { AmbientTrackRow } from '@tahti-web/components/AmbientTrackRow';
import { useState } from 'react';
import { expect, within } from 'storybook/test';

import { Button } from '@tahti-player/ui';

import { mockAmbientPeaks } from './mockAmbientPeaks';

const COVER_A = '/mock/northern-lights/cover-first-light.svg';
const COVER_B = '/mock/dj-moonlight/cover-after-hours.svg';

const meta = {
  title: 'Tahti/Media/AmbientTrackRow',
  component: AmbientTrackRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Listener/library track row with cover-ambient wash and a scrubbable waveform. Two densities: comfortable (screenshot-like) and compact. Wire into PlayableTrackTable / SoundRow after review.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-background mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AmbientTrackRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const likeAdd = (
  <>
    <Button size="sm" variant="text">
      Like
    </Button>
    <Button size="sm" variant="text">
      Add
    </Button>
  </>
);

export const Comfortable: Story = {
  args: {
    trackId: 'story-comfortable',
    title: 'Moody Electronica vol. 40',
    artist: 'Yaniho',
    coverUrl: COVER_A,
    genreLabel: 'Progressive House',
    durationLabel: '46:03',
    peaks: mockAmbientPeaks(1),
    progress: 0.28,
    density: 'comfortable',
    ambientRgb: [72, 48, 140],
    actions: likeAdd,
    stats: {
      releaseDate: '2026-10-17T12:00:00.000Z',
      likes: 3,
      plays: 31,
      downloads: 15,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Progressive House')).toBeVisible();
    await expect(canvas.getByLabelText('31 plays')).toBeVisible();
    await expect(canvas.getByLabelText('15 downloads')).toBeVisible();
  },
};

export const Compact: Story = {
  args: {
    trackId: 'story-compact',
    title: 'Diamond Dust',
    artist: 'Yaniho',
    coverUrl: COVER_B,
    genreLabel: 'Deep House',
    durationLabel: '6:11',
    peaks: mockAmbientPeaks(2),
    progress: 0.55,
    density: 'compact',
    ambientRgb: [160, 40, 90],
    actions: likeAdd,
  },
};

export const Playing: Story = {
  render: function PlayingStory() {
    const [progress, setProgress] = useState(0.42);
    const [playing, setPlaying] = useState(true);
    return (
      <AmbientTrackRow
        trackId="story-playing"
        title="Moody Electronica vol. 40"
        artist="Yaniho"
        coverUrl={COVER_A}
        genreLabel="Progressive House"
        durationLabel="46:03"
        peaks={mockAmbientPeaks(1)}
        progress={progress}
        density="comfortable"
        isPlaying={playing}
        ambientRgb={[72, 48, 140]}
        onPlay={() => setPlaying((v) => !v)}
        onSeek={setProgress}
        actions={likeAdd}
      />
    );
  },
};

export const NoPeaks: Story = {
  args: {
    trackId: 'story-empty',
    title: 'Still processing',
    artist: 'Northern Lights',
    coverUrl: COVER_A,
    durationLabel: '3:20',
    peaks: null,
    progress: 0.1,
    density: 'comfortable',
    ambientRgb: [36, 78, 128],
  },
};

export const Stack: Story = {
  render: () => (
    <>
      <AmbientTrackRow
        trackId="stack-1"
        title="Moody Electronica vol. 40"
        artist="Yaniho"
        coverUrl={COVER_A}
        genreLabel="Progressive House, Progressive Trance"
        durationLabel="46:03"
        peaks={mockAmbientPeaks(1)}
        progress={0.22}
        density="comfortable"
        ambientRgb={[72, 48, 140]}
        actions={likeAdd}
      />
      <AmbientTrackRow
        trackId="stack-2"
        title="Diamond Dust"
        artist="Yaniho"
        coverUrl={COVER_B}
        genreLabel="Deep House"
        durationLabel="6:11"
        peaks={mockAmbientPeaks(3)}
        progress={0.08}
        density="comfortable"
        ambientRgb={[160, 40, 90]}
        actions={likeAdd}
      />
      <AmbientTrackRow
        trackId="stack-3"
        title="Compact twin"
        artist="Yaniho"
        coverUrl={COVER_B}
        genreLabel="Deep House"
        durationLabel="6:11"
        peaks={mockAmbientPeaks(3)}
        progress={0.08}
        density="compact"
        ambientRgb={[160, 40, 90]}
        actions={likeAdd}
      />
    </>
  ),
};

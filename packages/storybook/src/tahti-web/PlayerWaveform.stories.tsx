import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerWaveform } from '@tahti-web/components/PlayerWaveform';
import { useState } from 'react';

import { mockAmbientPeaks } from './mockAmbientPeaks';

const meta: Meta<typeof PlayerWaveform> = {
  title: 'Tahti/Player/PlayerWaveform',
  component: PlayerWaveform,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Large track waveform (track page, Studio sound header, edit dialog) bound to the global player. Timed comments show as markers: hover for the comment, click to jump there.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCommentMarkers: Story = {
  render: () => {
    const [jumped, setJumped] = useState<number | null>(null);
    return (
      <div className="flex w-full max-w-2xl flex-col gap-3 pt-6">
        <PlayerWaveform
          trackId="story-track"
          label="First Light"
          peaks={mockAmbientPeaks(3, 200)}
          durationSec={200}
          height={112}
          onSeek={setJumped}
          markers={[
            { fraction: 0.2, label: '0:40 · 3 comments', count: 3 },
            { fraction: 0.55, label: '1:50 · Aino: this drop is unreal' },
            { fraction: 0.85, label: '2:50 · Ben: perfect outro' },
          ]}
        />
        <p className="text-foreground-secondary text-xs">
          {jumped == null
            ? 'Click a comment marker to jump to it.'
            : `Jumped to ${Math.round(jumped * 200)} s.`}
        </p>
      </div>
    );
  },
};

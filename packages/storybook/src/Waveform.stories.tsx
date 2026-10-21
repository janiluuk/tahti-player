import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Waveform } from '@tahti-player/ui';

const SAMPLE_PEAKS = Array.from({ length: 180 }, (_, i) => {
  const t = i / 180;
  return Math.round((0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 6))) * 255);
});

const meta = {
  title: 'Components/Waveform',
  component: Waveform,
  tags: ['autodocs'],
} satisfies Meta<typeof Waveform>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Peaks: Story = {
  args: {
    peaks: SAMPLE_PEAKS,
    durationSec: 180,
    progress: 0.35,
    height: 96,
  },
};

export const Empty: Story = {
  args: {
    peaks: [],
    durationSec: 60,
    height: 72,
  },
};

export const Seeking: Story = {
  render: () => {
    const [progress, setProgress] = useState(0.2);
    return (
      <div className="flex flex-col gap-3 p-4">
        <Waveform
          peaks={SAMPLE_PEAKS}
          durationSec={120}
          progress={progress}
          onSeek={setProgress}
          height={112}
        />
        <p className="text-foreground-secondary text-xs">
          Progress {(progress * 100).toFixed(0)}% — click the waveform to seek.
        </p>
      </div>
    );
  },
};

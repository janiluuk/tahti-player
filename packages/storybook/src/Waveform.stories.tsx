import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Waveform } from '@tahti-player/ui';

const SAMPLE_PEAKS = Array.from({ length: 180 }, (_, i) => {
  const t = i / 180;
  return Math.round((0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 6))) * 255);
});

const DYNAMICS_PEAKS = Array.from({ length: 200 }, (_, i) => {
  if (i < 40) {
    return Math.round(20 + 30 * Math.abs(Math.sin(i / 3)));
  }
  if (i < 50) {
    return 0;
  }
  if (i < 150) {
    return Math.round(180 + 75 * Math.abs(Math.sin(i / 2)));
  }
  return Math.round(Math.max(0, 200 - (i - 150) * 4));
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

/** Quiet intro, a silent gap, a loud section and a fade out: silence must
 * draw as nothing, not as full bars. */
export const Dynamics: Story = {
  args: {
    peaks: DYNAMICS_PEAKS,
    durationSec: 200,
    progress: 0.1,
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
          aria-label="Waveform: Demo track"
          aria-valuetext={`${Math.round(progress * 120)}s of 120s`}
        />
        <p className="text-foreground-secondary text-xs">
          Progress {(progress * 100).toFixed(0)}% - hover for the time, click to
          seek, or focus it and use the arrow keys, Page Up / Down, Home and
          End.
        </p>
      </div>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { WaveformSeekbar } from '@tahti-web/components/tahti/WaveformSeekbar';
import { useState } from 'react';

const meta: Meta<typeof WaveformSeekbar> = {
  title: 'Tahti/Player/WaveformSeekbar',
  component: WaveformSeekbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Scrubbable waveform progress for the compact player bar (planned swap from PlayerBar.SeekBar). Production: Discover inline player today; ConnectedPlayerBar after the queue→right-rail work. Missing states: live/no-duration (use Live badge instead).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  name: 'EmptyPlaceholder',
  render: () => {
    const [progress, setProgress] = useState(0.35);
    return (
      <div className="w-full max-w-xl">
        <WaveformSeekbar
          trackId="story-compact"
          progress={progress}
          onSeek={setProgress}
          className="h-8"
        />
      </div>
    );
  },
};

export const Expanded: Story = {
  name: 'EmptyPlaceholderTall',
  render: () => {
    const [progress, setProgress] = useState(0.55);
    return (
      <div className="w-full max-w-xl">
        <WaveformSeekbar
          trackId="story-expanded"
          progress={progress}
          onSeek={setProgress}
          className="h-16"
        />
      </div>
    );
  },
};

export const WithPeaks: Story = {
  render: () => {
    const [progress, setProgress] = useState(0.2);
    const peaks = Array.from({ length: 64 }, (_, index) =>
      Math.abs(Math.sin(index * 0.4) * 180 + 40),
    );
    return (
      <div className="w-full max-w-xl">
        <WaveformSeekbar
          trackId="story-peaks"
          progress={progress}
          peaks={peaks}
          onSeek={setProgress}
          className="h-12"
        />
      </div>
    );
  },
};

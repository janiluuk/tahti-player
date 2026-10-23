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
          'Scrubbable waveform progress used by the player bar, ambient track rows, the channel stage player, Discover and Studio upload. Drag to scrub (touch too); focus it and use the arrow keys, Page Up / Down, Home and End.',
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

/** Keyboard + accessible name: "Seek First Light", value "1:05 of 3:20". */
export const KeyboardWithDuration: Story = {
  render: () => {
    const [progress, setProgress] = useState(0.33);
    const peaks = Array.from({ length: 64 }, (_, index) =>
      index > 20 && index < 26 ? 0 : Math.abs(Math.sin(index * 0.3) * 200 + 30),
    );
    return (
      <div className="flex w-full max-w-xl flex-col gap-2">
        <WaveformSeekbar
          trackId="story-keyboard"
          progress={progress}
          peaks={peaks}
          label="First Light"
          durationSec={200}
          onSeek={setProgress}
          className="h-12"
        />
        <p className="text-foreground-secondary text-xs">
          Tab to the waveform, then use the arrow keys (5 s), Page Up / Down
          (10%), Home and End.
        </p>
      </div>
    );
  },
};

export const LiveNoDuration: Story = {
  name: 'LiveWithoutDuration',
  render: () => (
    <div className="w-full max-w-xl">
      <WaveformSeekbar trackId="story-live" progress={0} live className="h-8" />
    </div>
  ),
};

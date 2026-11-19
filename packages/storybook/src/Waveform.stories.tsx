import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Waveform } from '@tahti-player/ui';

import {
  WAVEFORM_DEMO_DURATION,
  WAVEFORM_DEMO_PEAKS,
} from './tahti-web/_fixtures/waveformAudio';

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
  parameters: {
    docs: {
      description: {
        component:
          'WaveSurfer waveform drawn from the stored server peaks, with high-DPI rendering and keyboard seeking. It never fetches or decodes audio: a track without peaks draws calm flat bars.',
      },
    },
  },
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

/** A READY track whose peaks are missing: flat bars at once, never a
 * loading pulse and never an audio download. */
export const NoServerPeaks: Story = {
  args: {
    peaks: null,
    durationSec: 240,
    height: 72,
  },
  play: async ({ canvasElement }) => {
    const wave = within(canvasElement).getByRole('img', { name: 'Waveform' });
    await expect(wave).toHaveAttribute('data-state', 'ready');
    await expect(wave).toHaveAttribute('data-waveform', 'empty');
  },
};

export const Seeking: StoryObj<typeof Waveform> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Waveform: Demo track' });
    await waitFor(() => expect(slider).toHaveAttribute('data-state', 'ready'));
    slider.focus();
    await userEvent.keyboard('{End}');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    await userEvent.keyboard('{Home}');
    await expect(slider).toHaveAttribute('aria-valuenow', '0');
  },
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

export const HighResolution: Story = {
  args: {
    peaks: WAVEFORM_DEMO_PEAKS,
    durationSec: WAVEFORM_DEMO_DURATION,
    height: 144,
    progress: 0.35,
  },
  play: async ({ canvasElement }) => {
    const wave = within(canvasElement).getByRole('img', { name: 'Waveform' });
    await waitFor(() => expect(wave).toHaveAttribute('data-state', 'ready'));
    await expect(wave).toHaveAttribute('data-waveform', 'peaks');
    await expect(wave).toBeVisible();
  },
};

export const PhoneWidth: Story = {
  ...HighResolution,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[358px]">
        <Story />
      </div>
    ),
  ],
};

/** Desktop player preview surface: stored peaks only, no decode (same contract
 * as tahti-web large previews). */
export const DesktopPreview: Story = {
  args: {
    peaks: WAVEFORM_DEMO_PEAKS,
    durationSec: WAVEFORM_DEMO_DURATION,
    progress: 0.42,
    height: 128,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Peaks-only preview for the future desktop embed of @tahti-player/ui Waveform — no audioUrl and no browser decode.',
      },
    },
  },
};

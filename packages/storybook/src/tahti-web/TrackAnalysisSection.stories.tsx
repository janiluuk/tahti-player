import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackAnalysisSection } from '@tahti-web/components/TrackAnalysisSection';
import { useDjPrefsStore } from '@tahti-web/stores/djPrefsStore';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import { DJ_TRACKS, djLibrary } from './_fixtures/dj-library';

const meta: Meta<typeof TrackAnalysisSection> = {
  title: 'Tahti/Desktop/TrackAnalysisSection',
  component: TrackAnalysisSection,
  args: {
    library: djLibrary(),
    track: DJ_TRACKS.find((item) => item.id === 'halftime')!,
  },
  decorators: [
    (Story) => {
      useDjPrefsStore.setState({ keyNotation: 'camelot' });
      return (
        <div className="max-w-xl p-4">
          <Story />
        </div>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BpmTools: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('waveform');
    await expect(canvas.getByText(/8A · Am/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Double tempo, 128 BPM' }),
    );
    await expect(canvas.getByLabelText('Your BPM')).toHaveValue(128);
  },
};

export const Tapped: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('waveform');
    const tap = canvas.getByRole('button', { name: 'Tap tempo' });
    for (let index = 0; index < 4; index += 1) {
      await userEvent.click(tap);
    }
    await expect(canvas.getByText(/BPM from|Keep tapping/)).toBeVisible();
  },
};

export const UnreadableKey: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('waveform');
    fireEvent.change(canvas.getByLabelText('Your key'), {
      target: { value: 'banana' },
    });
    await expect(canvas.getByText(/Use a key like/)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /Save correction/ }),
    ).toBeDisabled();
  },
};

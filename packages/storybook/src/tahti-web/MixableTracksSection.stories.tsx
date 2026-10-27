import type { Meta, StoryObj } from '@storybook/react-vite';
import { MixableTracksSection } from '@tahti-web/components/MixableTracksSection';
import { useDjPrefsStore } from '@tahti-web/stores/djPrefsStore';
import { expect, fn, within } from 'storybook/test';

import { DJ_TRACKS, djLibrary, SOURCE_TRACK } from './_fixtures/dj-library';

const meta: Meta<typeof MixableTracksSection> = {
  title: 'Tahti/Desktop/MixableTracksSection',
  component: MixableTracksSection,
  args: {
    library: djLibrary(),
    track: SOURCE_TRACK,
    onPlay: fn(),
    onQueue: fn(),
  },
  decorators: [
    (Story) => {
      useDjPrefsStore.setState({
        keyNotation: 'camelot',
        bpmTolerance: 6,
        halfDouble: true,
      });
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

export const Matches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Harbour Lights')).toBeVisible();
    await expect(canvas.getByText('Halftime Fog')).toBeVisible();
  },
};

export const NeedsAnalysis: Story = {
  args: { track: DJ_TRACKS.find((item) => item.id === 'unknown')! },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(/Analyze this track/),
    ).toBeVisible();
  },
};

export const NoMatches: Story = {
  args: { library: djLibrary({ tracks: [SOURCE_TRACK] }) },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        /Nothing in your library matches yet/,
      ),
    ).toBeVisible();
  },
};

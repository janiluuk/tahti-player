import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEMO_MP3 } from '@tahti-web/api/mock';
import { ReleaseTrackStemsList } from '@tahti-web/components/ReleaseTrackStemsList';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof ReleaseTrackStemsList> = {
  title: 'Tahti/Release/ReleaseTrackStemsList',
  component: ReleaseTrackStemsList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    trackTitle: 'Moonlight Drive',
    artist: 'Demo Artist',
    coverUrl: '/mock/dj-moonlight/cover-after-hours.svg',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stems: [
      {
        id: 'stem-vocals',
        role: 'vocals',
        audioUrl: DEMO_MP3,
        playUrl: DEMO_MP3,
      },
      {
        id: 'stem-drums',
        role: 'drums',
        audioUrl: DEMO_MP3,
        playUrl: DEMO_MP3,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('list', { name: /Stems for Moonlight Drive/i }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Play Vocals stem for Moonlight Drive',
      }),
    );
  },
};

export const Empty: Story = {
  args: {
    stems: [],
  },
};

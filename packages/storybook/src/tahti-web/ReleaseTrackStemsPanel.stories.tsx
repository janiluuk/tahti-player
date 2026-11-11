import type { Meta, StoryObj } from '@storybook/react-vite';
import { resetMockReleaseTrackStems } from '@tahti-web/api/release-track-stems';
import { ReleaseTrackStemsPanel } from '@tahti-web/views/studio/release-detail/ReleaseTrackStemsPanel';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof ReleaseTrackStemsPanel> = {
  title: 'Tahti/Studio/ReleaseTrackStemsPanel',
  component: ReleaseTrackStemsPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  beforeEach: () => {
    resetMockReleaseTrackStems();
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const tracks = [
  {
    id: 't1',
    position: 1,
    title: 'Moonlight Drive',
    status: 'READY',
    stems: [],
  },
  {
    id: 't2',
    position: 2,
    title: 'Blue Hour',
    status: 'READY',
    stems: [
      {
        id: 'stem-drums',
        role: 'drums',
        status: 'READY',
        durationSec: 180,
        audioUrl: 'https://example.com/drums.mp3',
      },
    ],
  },
];

export const EmptyAndPopulated: Story = {
  args: {
    releaseId: 'rel-mock-1',
    tracks,
    onTrackStemsSaved: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Stems' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText('No stems on this track yet.'),
    ).toBeInTheDocument();
    await expect(canvas.getByText('Drums')).toBeInTheDocument();
    await userEvent.click(
      canvas.getAllByRole('button', { name: /Add stem/i })[0]!,
    );
    await expect(canvas.getByLabelText('Stem role')).toBeInTheDocument();
  },
};

export const NoTracks: Story = {
  args: {
    releaseId: 'rel-mock-1',
    tracks: [],
    onTrackStemsSaved: () => {},
  },
};

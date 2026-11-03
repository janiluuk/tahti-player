import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEpisodeReviewView } from '@tahti-web/views/studio/show-detail/StudioEpisodeReviewView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const EPISODE_ID = 'ep-demo-3';

const meta: Meta<typeof StudioEpisodeReviewView> = {
  title: 'Tahti/Studio/StudioEpisodeReviewView',
  component: StudioEpisodeReviewView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Shows → one episode: review the recording or upload, its status, and open it in the Library or the full editor.',
      },
    },
  },
  args: { episodeId: EPISODE_ID },
  decorators: [
    withTahtiRouter(`/studio/shows/episodes/${EPISODE_ID}`),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/Episode 3/),
    ).toBeInTheDocument();
  },
};

// Read-only first: the public details form appears behind Edit details.
export const EditPublicDetails: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Episode 3/);
    await expect(
      canvas.queryByRole('textbox', { name: 'Episode title' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Edit details' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Episode title' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Done editing' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

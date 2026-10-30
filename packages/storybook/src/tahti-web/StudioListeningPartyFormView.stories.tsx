import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOCK_LISTENING_PARTY_IDS } from '@tahti-web/api/listening-parties-mock';
import { StudioListeningPartyFormView } from '@tahti-web/views/studio/StudioListeningPartyFormView';
import { expect, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioListeningPartyFormView> = {
  title: 'Tahti/Studio/StudioListeningPartyFormView',
  component: StudioListeningPartyFormView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Schedule a listening party for a release (`/studio/listening-parties/new?releaseId=`, reached from a release's header) or reschedule one (`/studio/listening-parties/$partyId/edit`): release, start time (at least 5 minutes ahead) and an optional note to listeners.",
      },
    },
  },
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Schedule: Story = {
  args: { releaseId: 'rel-mock-1' },
  decorators: [
    withTahtiRouter('/studio/listening-parties/new?releaseId=rel-mock-1'),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', {
          level: 1,
          name: 'Schedule listening party',
        }),
      ).toBeVisible(),
    );
    await waitFor(() => expect(canvas.getByLabelText('Starts')).toBeVisible());
    await expect(
      canvas.getByRole('button', { name: 'Schedule party' }),
    ).toBeDisabled();
  },
};

export const Reschedule: Story = {
  args: { partyId: MOCK_LISTENING_PARTY_IDS.scheduled },
  decorators: [
    withTahtiRouter(
      `/studio/listening-parties/${MOCK_LISTENING_PARTY_IDS.scheduled}/edit`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Polar Static')).toBeVisible());
    const note = canvas.getByLabelText(
      'Note to listeners (optional)',
    ) as HTMLTextAreaElement;
    await expect(note.value).toMatch(/Grab headphones/);
    await expect(
      canvas.getByRole('button', { name: 'Save changes' }),
    ).toBeEnabled();
  },
};

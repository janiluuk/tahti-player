import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioSoundView } from '@tahti-web/views/studio/StudioSoundView';
import { expect, userEvent, within } from 'storybook/test';

import {
  EDIT_SOUND,
  FAILED_LEGACY_SOUND,
  FAILED_SOUND,
  PROCESSING_SOUND,
  seedStudioSounds,
  withToaster,
} from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findToast } from './_lib/play';

const meta: Meta<typeof StudioSoundView> = {
  title: 'Tahti/Studio/StudioSoundView',
  component: StudioSoundView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Music → one sound: header with quick edits, a processing notice while the file transcodes, the failure alert (with Retry processing when the API supports it), then Details, Playlists and Insights tabs.',
      },
    },
  },
  beforeEach: seedStudioSounds([
    EDIT_SOUND,
    FAILED_SOUND,
    FAILED_LEGACY_SOUND,
    PROCESSING_SOUND,
  ]),
  decorators: [withToaster(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: { id: EDIT_SOUND.id },
  decorators: [withTahtiRouter(`/studio/sounds/${EDIT_SOUND.id}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('tab', { name: 'Details' });
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.queryByText(/Processing failed/)).toBeNull();
  },
};

export const StillProcessing: Story = {
  args: { id: PROCESSING_SOUND.id },
  decorators: [withTahtiRouter(`/studio/sounds/${PROCESSING_SOUND.id}`)],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/Still processing/),
    ).toBeVisible();
  },
};

// The failure alert shows the reason; Retry processing re-queues the file
// and the page switches to the "still processing" notice.
export const ProcessingFailed: Story = {
  args: { id: FAILED_SOUND.id },
  decorators: [withTahtiRouter(`/studio/sounds/${FAILED_SOUND.id}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        `Processing failed: ${FAILED_SOUND.processingError}`,
      ),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Retry processing' }),
    );
    await findToast(canvasElement, `Processing "${FAILED_SOUND.title}" again`);
    await expect(await canvas.findByText(/Still processing/)).toBeVisible();
    await expect(canvas.queryByText(/^Processing failed/)).toBeNull();
  },
};

// An API without `processingError` has no retry route either.
export const ProcessingFailedNoRetry: Story = {
  args: { id: FAILED_LEGACY_SOUND.id },
  decorators: [withTahtiRouter(`/studio/sounds/${FAILED_LEGACY_SOUND.id}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Processing failed for this file.'),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Retry processing' }),
    ).toBeNull();
  },
};

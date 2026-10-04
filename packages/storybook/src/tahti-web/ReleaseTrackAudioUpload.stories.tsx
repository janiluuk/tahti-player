import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReleaseTrackAudioUpload } from '@tahti-web/views/studio/release-detail/ReleaseTrackAudioUpload';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  audioFile,
  RELEASE_ID,
  UPLOAD_STATE_TRACKS,
  withToaster,
} from './_fixtures/track-release';
import { findToast } from './_lib/play';

const [NO_AUDIO, FAILED, SCANNING] = UPLOAD_STATE_TRACKS as [
  (typeof UPLOAD_STATE_TRACKS)[number],
  (typeof UPLOAD_STATE_TRACKS)[number],
  (typeof UPLOAD_STATE_TRACKS)[number],
];

const meta: Meta<typeof ReleaseTrackAudioUpload> = {
  title: 'Tahti/Studio/ReleaseTrackAudioUpload',
  component: ReleaseTrackAudioUpload,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Per-track audio upload in a release's smart-link playlist (Studio → Releases → Smart links), for tracks that aren't linked to a library sound. Shows upload progress with Cancel, then the processing state.",
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withToaster()],
  args: { releaseId: RELEASE_ID, track: NO_AUDIO, onUploaded: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoAudio: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Upload audio' }));
    await userEvent.upload(
      canvas.getByLabelText(`Audio for ${NO_AUDIO.title}`),
      audioFile(),
    );
    const meter = await canvas.findByRole('meter', {
      name: /Uploading Polar Night/,
    });
    await expect(meter).toBeVisible();
    await findToast(
      canvasElement,
      'Audio uploaded. It is being processed now.',
    );
    await waitFor(() =>
      expect(args.onUploaded).toHaveBeenCalledWith(NO_AUDIO.id, {
        sourceKey: `mock/${NO_AUDIO.id}`,
        status: 'SCANNING',
      }),
    );
  },
};

// Cancelling mid-upload keeps the track without audio.
export const CancelUpload: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Upload audio' }));
    await userEvent.upload(
      canvas.getByLabelText(`Audio for ${NO_AUDIO.title}`),
      audioFile(),
    );
    await canvas.findByRole('meter', { name: /Uploading Polar Night/ });
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await findToast(canvasElement, 'Upload cancelled.');
    await expect(
      await canvas.findByRole('button', { name: 'Upload audio' }),
    ).toBeVisible();
    await expect(args.onUploaded).not.toHaveBeenCalled();
  },
};

export const ProcessingFailed: Story = {
  args: { track: FAILED },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Processing failed')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Upload again' }),
    ).toBeVisible();
  },
};

export const Processing: Story = {
  args: { track: SCANNING },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Processing')).toBeVisible();
  },
};

// Tracks linked to a library sound already have audio: nothing to show.
export const LibraryTrack: Story = {
  args: {
    track: {
      id: 't1',
      position: 1,
      title: 'Moonlight Drive',
      soundId: 'arch-mock-1',
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

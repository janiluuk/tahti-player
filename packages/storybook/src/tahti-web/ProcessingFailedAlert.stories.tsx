import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProcessingFailedAlert } from '@tahti-web/views/studio/sound/ProcessingFailedAlert';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  FAILED_LEGACY_SOUND,
  FAILED_SOUND,
  seedStudioSounds,
} from './_fixtures/track-release';

const meta: Meta<typeof ProcessingFailedAlert> = {
  title: 'Tahti/Studio/ProcessingFailedAlert',
  component: ProcessingFailedAlert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Shown on Studio's sound page when the uploaded file failed to process. Gives the reason when the API reports one, and offers Retry processing only when the API supports it (`processingError` present) and the sound isn't an embed.",
      },
    },
  },
  tags: ['autodocs'],
  // Retry goes through the mock API, which only re-queues a failed sound
  // that exists in the Studio mock store.
  beforeEach: seedStudioSounds([FAILED_SOUND]),
  args: { item: FAILED_SOUND, onRetried: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReason: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(`Processing failed: ${FAILED_SOUND.processingError}`),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Retry processing' }),
    );
    await waitFor(() => expect(args.onRetried).toHaveBeenCalled());
  },
};

export const WithoutReason: Story = {
  args: { item: { ...FAILED_SOUND, processingError: null } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Processing failed for this file.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Retry processing' }),
    ).toBeVisible();
  },
};

export const NoRetrySupport: Story = {
  args: { item: FAILED_LEGACY_SOUND },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('button', {
        name: 'Retry processing',
      }),
    ).toBeNull();
  },
};

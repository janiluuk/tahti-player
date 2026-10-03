import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioSoundsView } from '@tahti-web/views/studio/StudioSoundsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  FAILED_LEGACY_SOUND,
  FAILED_SOUND,
  PROCESSING_SOUND,
  seedStudioSounds,
  withToaster,
} from './_fixtures/track-release';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findToast } from './_lib/play';

const meta: Meta<typeof StudioSoundsView> = {
  title: 'Tahti/Studio/StudioSoundsView',
  component: StudioSoundsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Artist sound-library surface for tracks, clips, and stash files. Lives on Studio → Music → Tracks, Clips, and Files.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/studio/sounds'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tracks: Story = {};

export const Clips: Story = {
  parameters: { query: { folder: 'clips' } },
};

/** The `<li>` row for the sound titled `title`. */
function row(canvasElement: HTMLElement, title: string) {
  const link = within(canvasElement).getByRole('link', { name: title });
  return within(link.closest('li')!);
}

// Rows for an upload that failed processing (with the reason and a Retry
// button), one that failed on an API without retry, and one still
// processing. Retry re-queues the file and the row goes back to PENDING.
export const ProcessingFailed: Story = {
  beforeEach: seedStudioSounds([
    FAILED_SOUND,
    FAILED_LEGACY_SOUND,
    PROCESSING_SOUND,
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: FAILED_SOUND.title });

    const failed = row(canvasElement, FAILED_SOUND.title);
    await expect(failed.getByText(/^Processing failed/)).toBeVisible();
    await expect(failed.getByText(FAILED_SOUND.processingError!)).toBeVisible();

    const legacy = row(canvasElement, FAILED_LEGACY_SOUND.title);
    await expect(legacy.getByText(/^Processing failed/)).toBeVisible();
    await expect(legacy.queryByRole('button', { name: /^Retry/ })).toBeNull();

    await expect(
      row(canvasElement, PROCESSING_SOUND.title).getByText(/^PROCESSING/),
    ).toBeVisible();

    await userEvent.click(
      failed.getByRole('button', {
        name: `Retry processing ${FAILED_SOUND.title}`,
      }),
    );
    await findToast(canvasElement, `Processing "${FAILED_SOUND.title}" again`);
    await waitFor(() =>
      expect(
        row(canvasElement, FAILED_SOUND.title).getByText(/^PENDING/),
      ).toBeVisible(),
    );
    await expect(
      canvas.queryByRole('button', {
        name: `Retry processing ${FAILED_SOUND.title}`,
      }),
    ).toBeNull();
  },
};

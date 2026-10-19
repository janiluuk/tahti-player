import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
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
          'Artist sound-library surface at Library → Sounds. One list with a Type filter (Track, Clip, DJ Set, …); Stash lives under Library → Stash.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/library/sounds'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Sounds: Story = {};

/** Rows with cover art get a dominant-color ambient wash (library Sounds polish). */
export const AmbientCovers: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', {
      name: 'Northern Lights — Live Set',
    });
    const li = link.closest('li');
    await expect(li).toBeTruthy();
    await waitFor(() => {
      const bg = li!.getAttribute('style') ?? '';
      expect(bg).toMatch(/linear-gradient|radial-gradient|background/i);
    });
  },
};

/** Hearthis embed hosts in the row action box (compact), not a full-width PlayerBar strip. */
export const HearthisRowEmbed: Story = {
  beforeEach: () => {
    usePlayerStore.setState({ currentId: null, status: 'idle', queue: [] });
    return () => {
      usePlayerStore.setState({ currentId: null, status: 'idle', queue: [] });
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = await canvas.findByRole('link', {
      name: 'Imported from hearthis.at',
    });
    const li = link.closest('li');
    await expect(li).toBeTruthy();
    const actions = within(li!).getByTestId('sound-row-actions');
    await userEvent.click(
      within(actions).getByRole('button', {
        name: 'Play Imported from hearthis.at on hearthis.at',
      }),
    );
    const embed = await within(actions).findByTestId('hearthis-row-embed');
    await expect(embed).toBeVisible();
    await expect(embed.className).toMatch(/max-h-28/);
    await expect(actions.contains(embed)).toBe(true);
    await expect(
      canvasElement.querySelector(
        '[data-testid="connected-player-bar"] [data-testid="hearthis-row-embed"]',
      ),
    ).toBeNull();
  },
};

/** Type filter set to Clip (URL `?contentType=CLIP` in the live app). */
export const ClipFilter: Story = {};

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
      row(canvasElement, PROCESSING_SOUND.title).getByRole('status'),
    ).toHaveTextContent('Processing');

    await userEvent.click(
      failed.getByRole('button', {
        name: `Retry processing ${FAILED_SOUND.title}`,
      }),
    );
    await findToast(canvasElement, `Processing "${FAILED_SOUND.title}" again`);
    await waitFor(() =>
      expect(
        row(canvasElement, FAILED_SOUND.title).getByRole('status'),
      ).toHaveTextContent('Processing'),
    );
    await expect(
      canvas.queryByRole('button', {
        name: `Retry processing ${FAILED_SOUND.title}`,
      }),
    ).toBeNull();
  },
};

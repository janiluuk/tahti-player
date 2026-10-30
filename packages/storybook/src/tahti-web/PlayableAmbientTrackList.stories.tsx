import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import { PlayableAmbientTrackList } from '@tahti-web/components/PlayableAmbientTrackList';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { pickTrackView, withinBody } from './_lib/play';

const track = (
  id: string,
  title: string,
  artist: string,
  durationSec: number,
  releaseDate: string,
  coverUrl: string,
): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title,
  artist,
  coverUrl,
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
  durationSec,
  releaseDate,
});

const ITEMS: TahtiPlayable[] = [
  track(
    's1',
    'Polar Static',
    'Northern Lights',
    312,
    '2026-03-01',
    '/mock/northern-lights/cover-polar-static.svg',
  ),
  track(
    's2',
    'After Hours',
    'DJ Moonlight',
    245,
    '2026-09-12',
    '/mock/dj-moonlight/cover-after-hours.svg',
  ),
  track(
    's3',
    'First Light',
    'Northern Lights',
    198,
    '2025-11-20',
    '/mock/northern-lights/cover-first-light.svg',
  ),
];

const resetSort = () => {
  try {
    localStorage.removeItem('tahti.ambientTrackList.sort');
    localStorage.setItem('tahti.ambientTrackList.density', 'compact');
  } catch {
    /* ignore */
  }
};

const meta: Meta<typeof PlayableAmbientTrackList> = {
  title: 'Tahti/Library/PlayableAmbientTrackList',
  component: PlayableAmbientTrackList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ambient track rows (or the List table) with a size switcher and a Sort menu. The sort applies to rows, the table and play order, and is remembered in this browser.',
      },
    },
  },
  decorators: [withTahtiRouter('/')],
  beforeEach: resetSort,
  args: { items: ITEMS },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const rowTitles = (canvasElement: HTMLElement) =>
  Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      '[data-testid="ambient-track-list"] li a',
    ),
  ).map((node) => node.textContent?.trim());

export const SortByTitle: Story = {
  name: 'Sort by title',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(rowTitles(canvasElement)[0]).toBe('Polar Static'),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Sort tracks' }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Title A–Z',
      }),
    );
    await waitFor(() =>
      expect(rowTitles(canvasElement)).toEqual([
        'After Hours',
        'First Light',
        'Polar Static',
      ]),
    );
  },
};

export const Removable: Story = {
  name: 'Removable (local files)',
  parameters: {
    docs: {
      description: {
        story:
          'With `onRemove` each row gets a Remove action; with `selectable` and `onBulkRemove` the List view keeps multi-select and bulk remove. Used by the browser local files panel.',
      },
    },
  },
  args: { onRemove: fn(), selectable: true, onBulkRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Remove After Hours' }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'After Hours' }),
    );
    await pickTrackView(canvasElement, 'List');
    await expect(
      (await canvas.findAllByRole('checkbox')).length,
    ).toBeGreaterThan(1);
  },
};

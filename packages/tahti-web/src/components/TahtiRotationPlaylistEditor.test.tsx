// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdminSelectsItem } from '../api/admin';
import { TahtiRotationPlaylistEditor } from './TahtiRotationPlaylistEditor';

const item = (id: string, title: string): AdminSelectsItem => ({
  id,
  soundId: `sound-${id}`,
  title,
  durationSec: 200,
  license: 'CC_BY',
  artistName: 'Aino',
  channelSlug: 'aino',
  addedBy: 'board',
});

const ITEMS = [
  item('r1', 'Night Transit'),
  item('r2', 'Aurora Drift'),
  item('r3', 'Signal Bloom'),
];

const renderEditor = (
  props: Partial<Parameters<typeof TahtiRotationPlaylistEditor>[0]> = {},
) => {
  const onReorder = vi.fn();
  render(
    <TahtiRotationPlaylistEditor
      items={ITEMS}
      onReorder={onReorder}
      onRemove={vi.fn()}
      onPreview={vi.fn()}
      {...props}
    />,
  );
  return { onReorder };
};

const rowFor = (title: string) =>
  screen
    .getAllByTestId('track-row')
    .find((row) => within(row).queryByText(title))!;

describe('TahtiRotationPlaylistEditor', () => {
  afterEach(cleanup);

  it('numbers the rows in play order', () => {
    renderEditor();
    const rows = screen.getAllByTestId('track-row');
    expect(rows.map((row) => row.querySelector('td')?.textContent)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('marks the on-air row and the one after it', () => {
    renderEditor({ nowPlayingItemId: 'r3' });
    expect(rowFor('Signal Bloom').getAttribute('aria-current')).toBe('true');
    expect(within(rowFor('Signal Bloom')).getByText('On air')).toBeTruthy();
    expect(within(rowFor('Night Transit')).getByText('Up next')).toBeTruthy();
    expect(within(rowFor('Aurora Drift')).queryByText(/On air|Up next/)).toBe(
      null,
    );
  });

  it('moves a row down from its menu', async () => {
    const { onReorder } = renderEditor();
    await userEvent.click(
      within(rowFor('Night Transit')).getByTestId('track-context-menu-button'),
    );
    expect(
      (await screen.findByTestId('rotation-move-up')).getAttribute(
        'data-disabled',
      ),
    ).not.toBeNull();
    await userEvent.click(screen.getByTestId('rotation-move-down'));
    expect(onReorder).toHaveBeenCalledWith([ITEMS[1], ITEMS[0], ITEMS[2]]);
  });

  it('moves a row to the top from its menu', async () => {
    const { onReorder } = renderEditor();
    await userEvent.click(
      within(rowFor('Signal Bloom')).getByTestId('track-context-menu-button'),
    );
    await userEvent.click(await screen.findByTestId('rotation-move-top'));
    expect(onReorder).toHaveBeenCalledWith([ITEMS[2], ITEMS[0], ITEMS[1]]);
  });

  it('has no row menu while read-only', () => {
    renderEditor({ readOnly: true });
    expect(screen.queryByTestId('track-context-menu-button')).toBeNull();
  });
});

// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import type { AdminRadioBrowseItem } from '../../api/admin';
import * as client from '../../api/client';
import { renderWithRouter } from '../../test/renderWithRouter';
import { TahtiRadioPlaylistPanel } from './TahtiRadioPlaylistPanel';

vi.mock('../../components/TahtiRotationPlaylistEditor', () => ({
  TahtiRotationPlaylistEditor: () => null,
}));

const browseItem = (id: string, title: string): AdminRadioBrowseItem => ({
  id,
  title,
  durationSec: 180,
  license: 'CC-BY',
  artistName: 'Aino',
  channelSlug: 'aino',
});

const NIGHT = browseItem('s-night', 'Night Drive');
const HARBOUR = browseItem('s-harbour', 'Harbour Lights');
const POLAR = browseItem('s-polar', 'Polar Night');

const mockBrowse = () =>
  vi
    .spyOn(admin, 'searchAdminRadioBrowse')
    .mockImplementation(async (query: string) => ({
      data: [NIGHT, HARBOUR, POLAR].filter((item) =>
        item.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
      meta: { source: 'mock' as const },
    }));

const renderPanel = async () => {
  await renderWithRouter(<TahtiRadioPlaylistPanel />);
  await act(async () => {
    const [open] = await screen.findAllByRole('button', {
      name: 'Add tracks',
    });
    fireEvent.click(open!);
  });
};

const optionFor = (title: string) =>
  screen.findByRole('checkbox', { name: new RegExp(`^Select ${title}`) });

describe('TahtiRadioPlaylistPanel picker', () => {
  beforeEach(() => {
    vi.spyOn(admin, 'fetchAdminRadioRotation').mockResolvedValue({
      data: [],
      meta: { source: 'mock' },
    });
    vi.spyOn(client, 'fetchRadioStation').mockResolvedValue({
      data: { hlsUrl: null, nowPlaying: null },
      playable: null,
      meta: { source: 'mock' },
    } as never);
    mockBrowse();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps tracks picked under an earlier search when the search changes', async () => {
    const add = vi
      .spyOn(admin, 'addToRadioRotation')
      .mockResolvedValue({ ok: true } as never);
    await renderPanel();
    fireEvent.click(await optionFor('Night Drive'));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'harbour' },
    });
    fireEvent.click(await optionFor('Harbour Lights'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 to rotation' }));
    await waitFor(() => expect(add).toHaveBeenCalledTimes(2));
    expect(add.mock.calls.map(([item]) => item.id).sort()).toEqual([
      's-harbour',
      's-night',
    ]);
  });

  it('selects every shown track at once', async () => {
    await renderPanel();
    await optionFor('Night Drive');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all shown' }));
    expect(screen.getByText('3 selected')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Add 3 to rotation' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all shown' }));
    expect(screen.getByText('0 selected')).toBeTruthy();
  });

  it('forgets the selection when the picker is cancelled', async () => {
    await renderPanel();
    fireEvent.click(await optionFor('Night Drive'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('checkbox', { name: /Night Drive/ }),
      ).toBeNull(),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Add tracks' })[0]!);
    await optionFor('Night Drive');
    expect(screen.getByText('0 selected')).toBeTruthy();
  });

  it('keeps only the failed tracks selected and says how many were added', async () => {
    vi.spyOn(admin, 'addToRadioRotation').mockImplementation(async (item) =>
      item.id === 's-polar'
        ? { ok: false, error: 'Track not ready' }
        : ({ ok: true } as never),
    );
    await renderPanel();
    fireEvent.click(await optionFor('Night Drive'));
    fireEvent.click(await optionFor('Polar Night'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 to rotation' }));
    expect(
      await screen.findByText('Added 1 of 2 tracks. Track not ready'),
    ).toBeTruthy();
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('1 selected')).toBeTruthy();
    expect(
      dialog
        .getByRole('checkbox', { name: /Polar Night/ })
        .hasAttribute('checked') ||
        (
          dialog.getByRole('checkbox', {
            name: /Polar Night/,
          }) as HTMLInputElement
        ).checked,
    ).toBe(true);
  });

  it('confirms what was added and closes the picker', async () => {
    vi.spyOn(admin, 'addToRadioRotation').mockResolvedValue({
      ok: true,
    } as never);
    await renderPanel();
    fireEvent.click(await optionFor('Night Drive'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 1 to rotation' }));
    expect(
      await screen.findByText('Added 1 track to the rotation.'),
    ).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

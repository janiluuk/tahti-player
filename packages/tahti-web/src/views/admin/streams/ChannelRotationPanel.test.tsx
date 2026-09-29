// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import type { ProgrammeItem } from '../../../api/studio-extras/schedule';
import { ChannelRotationPanel, moveRotationItem } from './ChannelRotationPanel';

const ITEMS: ProgrammeItem[] = [
  {
    id: 's2',
    title: 'Ilta',
    status: 'READY',
    durationSec: 300,
    isFallback: true,
    fallbackOrder: 1,
  },
  {
    id: 's3',
    title: 'Yö',
    status: 'READY',
    durationSec: 360,
    isFallback: false,
    fallbackOrder: null,
  },
  {
    id: 's1',
    title: 'Aamu',
    status: 'READY',
    durationSec: 240,
    isFallback: true,
    fallbackOrder: 0,
  },
];

describe('rotation helpers', () => {
  it('numbers only the tracks in rotation, in list order', () => {
    expect(admin.programmePatchFromItems(ITEMS)).toEqual([
      { soundId: 's2', isFallback: true, fallbackOrder: 0 },
      { soundId: 's3', isFallback: false },
      { soundId: 's1', isFallback: true, fallbackOrder: 1 },
    ]);
  });

  it('moves a track and ignores moves past either end', () => {
    expect(moveRotationItem(ITEMS, 0, 1).map((item) => item.id)).toEqual([
      's3',
      's2',
      's1',
    ]);
    expect(moveRotationItem(ITEMS, 0, -1)).toBe(ITEMS);
  });
});

describe('ChannelRotationPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens a channel rotation in play order and saves it', async () => {
    const fetchProgramme = vi
      .spyOn(admin, 'fetchAdminChannelProgramme')
      .mockResolvedValue({
        ok: true,
        data: {
          fallbackMode: 'ordered',
          fallbackEnabled: true,
          fallbackAutoEnroll: false,
          announcementsEnabled: true,
          items: ITEMS,
        },
      });
    const save = vi
      .spyOn(admin, 'saveAdminChannelProgramme')
      .mockImplementation(async (_slug, settings, items) => ({
        ok: true,
        data: { ...settings, items },
      }));

    render(<ChannelRotationPanel />);
    fireEvent.change(screen.getByLabelText('Channel slug'), {
      target: { value: ' Yaniho ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open rotation' }));
    });
    expect(fetchProgramme).toHaveBeenCalledWith('yaniho');
    expect(
      screen.getAllByRole('listitem').map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining('Aamu'),
      expect.stringContaining('Ilta'),
      expect.stringContaining('Yö'),
    ]);
    expect(
      screen.getByText('2 of 3 ready tracks in the rotation.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Move Ilta up' }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: "Save yaniho's rotation" }),
      );
    });
    expect(save).toHaveBeenCalledWith(
      'yaniho',
      expect.objectContaining({ fallbackMode: 'ordered' }),
      [
        expect.objectContaining({ id: 's2' }),
        expect.objectContaining({ id: 's1' }),
        expect.objectContaining({ id: 's3' }),
      ],
    );
    expect(screen.getByRole('status').textContent).toBe(
      "Saved yaniho's rotation.",
    );
  });

  it('shows why a channel could not be opened', async () => {
    vi.spyOn(admin, 'fetchAdminChannelProgramme').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    render(<ChannelRotationPanel />);
    fireEvent.change(screen.getByLabelText('Channel slug'), {
      target: { value: 'nobody' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open rotation' }));
    });
    expect(screen.getByRole('alert').textContent).toBe('Channel not found');
  });
});

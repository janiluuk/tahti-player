// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../../../api/studio-types';
import { SoundRow } from './SoundRow';
import type { StudioSoundsState } from './useStudioSoundsState';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

vi.mock('../../../components/AddToPlaylistButton', () => ({
  AddToPlaylistButton: () => null,
}));

vi.mock('../../../components/StudioSoundRowMenu', () => ({
  StudioSoundRowMenu: () => null,
}));

const state = {
  busyId: null,
  embedOpenId: null,
  playItem: vi.fn(),
  playEmbedItem: vi.fn(),
  downloadItem: vi.fn(),
  togglePin: vi.fn(),
  setEditingId: vi.fn(),
  setStatsItem: vi.fn(),
  setPendingDeleteItem: vi.fn(),
} as unknown as StudioSoundsState;

function renderRow(item: Partial<StudioSound>) {
  render(
    <ul>
      <SoundRow
        item={{ id: 's1', title: 'Night Drive', status: 'READY', ...item }}
        state={state}
      />
    </ul>,
  );
}

describe('SoundRow', () => {
  afterEach(cleanup);

  it('lets the owner download their file even with listener downloads off', () => {
    renderRow({ downloadsEnabled: false });
    expect(
      screen.getByRole('button', { name: 'Download Night Drive' }),
    ).toBeTruthy();
    expect(screen.getByText(/downloads off/)).toBeTruthy();
  });

  it('only notes downloads when the artist turned them off', () => {
    renderRow({ downloadsEnabled: true });
    expect(screen.queryByText(/downloads off/)).toBeNull();
    cleanup();
    renderRow({});
    expect(screen.queryByText(/downloads off/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Download Night Drive' }),
    ).toBeTruthy();
  });

  it('has no file download for embedded tracks', () => {
    renderRow({ embedProvider: 'SPOTIFY', embedUri: 'track/abc' });
    expect(
      screen.queryByRole('button', { name: 'Download Night Drive' }),
    ).toBeNull();
  });
});

// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../../../api/studio-types';
import { useProcessingJobsStore } from '../../../stores/processingJobsStore';
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

const { retrySoundProcessing } = vi.hoisted(() => ({
  retrySoundProcessing: vi.fn(),
}));
vi.mock('../../../api/studio', () => ({ retrySoundProcessing }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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
  setItems: vi.fn(),
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
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useProcessingJobsStore.setState({ jobs: [] });
  });

  it('explains a failed upload and retries it', async () => {
    retrySoundProcessing.mockResolvedValue({ ok: true });
    renderRow({
      status: 'ERROR',
      processingError: 'The file is not a supported audio format.',
    });
    expect(screen.getByText(/^Processing failed/)).toBeTruthy();
    expect(screen.queryByText(/ERROR/)).toBeNull();
    expect(
      screen.getByText('The file is not a supported audio format.'),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Retry processing Night Drive' }),
    );
    await waitFor(() => expect(state.setItems).toHaveBeenCalled());
    expect(retrySoundProcessing).toHaveBeenCalledWith('s1');
    expect(useProcessingJobsStore.getState().jobs).toEqual([
      { id: 's1', title: 'Night Drive', status: 'PENDING' },
    ]);
  });

  it('offers no retry when the API does not report a failure reason field', () => {
    renderRow({ status: 'ERROR' });
    expect(screen.getByText(/^Processing failed/)).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Retry processing Night Drive' }),
    ).toBeNull();
  });

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

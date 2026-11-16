// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StashFilesPanel } from './StashFilesPanel';

const stash = vi.hoisted(() => ({
  fetchStashFiles: vi.fn(),
  deleteStashFile: vi.fn(),
}));

vi.mock('../api/sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/sources')>()),
  ...stash,
}));

describe('StashFilesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('deletes a stash file only after a red confirm', async () => {
    stash.fetchStashFiles.mockResolvedValue({
      data: [{ id: 's1', filename: 'stems.wav', shareCount: 0, shares: [] }],
      meta: { source: 'api' },
    });
    stash.deleteStashFile.mockResolvedValue({ ok: true });
    render(<StashFilesPanel filesOnly />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete stems.wav' }),
    );
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(stash.deleteStashFile).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(stash.deleteStashFile).toHaveBeenCalledWith('s1'),
    );
    expect(await screen.findByText('Deleted stems.wav.')).toBeTruthy();
  });

  it('shows the last loaded files at once and keeps them when the refresh fails', async () => {
    stash.fetchStashFiles.mockResolvedValue({
      data: [{ id: 's1', filename: 'stems.wav', shareCount: 0, shares: [] }],
      meta: { source: 'api' },
    });
    render(<StashFilesPanel filesOnly />);
    expect(await screen.findByText('stems.wav')).toBeTruthy();
    cleanup();

    stash.fetchStashFiles.mockReturnValue(new Promise(() => {}));
    render(<StashFilesPanel filesOnly />);
    expect(screen.getByText('stems.wav')).toBeTruthy();
    expect(screen.queryByText('Loading stash files…')).toBeNull();
    cleanup();

    stash.fetchStashFiles.mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<StashFilesPanel filesOnly />);
    expect(
      await screen.findByText(
        'Could not refresh; showing the last loaded version.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('stems.wav')).toBeTruthy();
  });
});

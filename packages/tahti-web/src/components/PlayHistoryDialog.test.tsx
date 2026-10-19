// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { PlayHistoryDialog } from './PlayHistoryDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('PlayHistoryDialog', () => {
  afterEach(cleanup);

  it('offers Retry when the history fails to load', async () => {
    const playHistory = vi
      .fn()
      .mockRejectedValueOnce(new Error('library offline'))
      .mockResolvedValueOnce({ entries: [], total: 0 });
    const library = {
      catalog: { playHistory },
    } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(
        <PlayHistoryDialog
          isOpen
          onClose={() => {}}
          library={library}
          onChanged={() => {}}
        />,
      );
    });
    expect(
      screen.getByText('Could not load your listening history'),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
  });
});

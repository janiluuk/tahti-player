// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/me-listening';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { HistoryView } from './HistoryView';

describe('HistoryView stats tab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('drops the local "Nothing to show yet" under real cross-device stats', async () => {
    useLibraryStore.setState({ history: [] });
    useAuthStore.setState({
      user: { id: 'u1', username: 'listener' } as never,
    });
    vi.spyOn(api, 'fetchMyListening').mockResolvedValue({
      data: api.MOCK_MY_LISTENING,
      meta: { source: 'api' },
    });
    await renderWithRouter(<HistoryView />);
    expect(await screen.findByTestId('across-devices-artists')).toBeTruthy();
    expect(screen.queryByTestId('history-stats-empty')).toBeNull();
  });

  it('keeps the empty state when there is no listening anywhere', async () => {
    useLibraryStore.setState({ history: [] });
    await renderWithRouter(<HistoryView />);
    expect(screen.getByTestId('history-stats-empty')).toBeTruthy();
  });
});

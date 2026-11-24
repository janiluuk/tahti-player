// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
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

describe('HistoryView recently played', () => {
  afterEach(() => {
    cleanup();
    useLibraryStore.setState({ history: [] });
  });

  it('shows no Recently played row before anything was played', async () => {
    useLibraryStore.setState({ history: [] });
    await renderWithRouter(<HistoryView />);
    expect(screen.queryByTestId('history-recently-played')).toBeNull();
  });

  it('puts the latest plays above the tabs and links a radio station to its page', async () => {
    useLibraryStore.setState({
      history: [
        {
          playable: {
            id: 'radio-widget:radio-helsinki',
            kind: 'radio',
            title: 'Radio Helsinki',
            artist: 'Finnish · Talk / Variety',
            streamUrl: 'https://example.test/stream',
            protocol: 'https',
          },
          playedAt: '2026-10-04T10:00:00.000Z',
        },
        {
          playable: {
            id: 'sound:s1',
            kind: 'sound',
            title: 'Night Drive',
            artist: 'Northern Lights',
            streamUrl: 'https://example.test/s1.mp3',
            protocol: 'https',
          },
          playedAt: '2026-10-04T09:00:00.000Z',
        },
      ],
    });
    await renderWithRouter(<HistoryView />);
    const row = within(await screen.findByTestId('history-recently-played'));
    expect(row.getByRole('heading', { name: 'Recently played' })).toBeTruthy();
    expect(
      row.getByRole('link', { name: 'Radio Helsinki' }).getAttribute('href'),
    ).toBe('/radio/station/radio-helsinki');
    expect(row.queryByRole('link', { name: 'Night Drive' })).toBeNull();
    expect(row.getByText('Night Drive')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as shows from '../api/shows';
import type { PublicRadioShow } from '../api/shows';
import { renderWithRouter } from '../test/renderWithRouter';
import { RadioShowView } from './RadioShowView';

type ShowResult = Awaited<ReturnType<typeof shows.fetchPublicRadioShow>>;

function show(displayName: string): ShowResult {
  return {
    data: {
      artist: {
        displayName,
        username: 'aurora',
        avatarUrl: null,
        channelSlug: 'aurora',
        bio: null,
      },
      pastEpisodes: [],
      upcomingEpisodes: [],
      nextShowAt: null,
      lastShowAt: null,
    } as unknown as PublicRadioShow,
    meta: { source: 'api' },
  };
}

describe('RadioShowView', () => {
  beforeEach(() => {
    vi.spyOn(shows, 'fetchRadioShowNowPlaying').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    } as never);
    vi.spyOn(shows, 'fetchRadioShowUpcoming').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the last loaded show at once and swaps in the refresh', async () => {
    const fetch = vi
      .spyOn(shows, 'fetchPublicRadioShow')
      .mockResolvedValue(show('Aurora'));
    const first = await renderWithRouter(
      <RadioShowView channelSlug="aurora" />,
    );
    expect(await screen.findByRole('heading', { name: 'Aurora' })).toBeTruthy();
    first.unmount();

    let resolve: (value: ShowResult) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderWithRouter(<RadioShowView channelSlug="aurora" />);
    expect(screen.getByRole('heading', { name: 'Aurora' })).toBeTruthy();
    expect(screen.queryByText('Loading show…')).toBeNull();

    await act(async () => resolve(show('Aurora Live')));
    expect(screen.getByRole('heading', { name: 'Aurora Live' })).toBeTruthy();
  });

  it('keeps the saved show and says the refresh failed', async () => {
    const fetch = vi
      .spyOn(shows, 'fetchPublicRadioShow')
      .mockResolvedValue(show('Aurora'));
    const first = await renderWithRouter(
      <RadioShowView channelSlug="aurora" />,
    );
    expect(await screen.findByRole('heading', { name: 'Aurora' })).toBeTruthy();
    first.unmount();

    fetch.mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<RadioShowView channelSlug="aurora" />);
    expect(
      await screen.findByText(
        'Could not refresh this show; showing the last loaded schedule.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Aurora' })).toBeTruthy();
  });

  it('says the show failed to load when nothing was saved', async () => {
    vi.spyOn(shows, 'fetchPublicRadioShow').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<RadioShowView channelSlug="aurora" />);
    expect(await screen.findByText('Could not load show')).toBeTruthy();
  });
});

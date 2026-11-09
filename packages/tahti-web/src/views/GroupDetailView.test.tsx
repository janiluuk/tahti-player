// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as groups from '../api/groups';
import { mockFetchPublicGroup } from '../api/groups-mock';
import { renderWithRouter } from '../test/renderWithRouter';
import { GroupDetailView } from './GroupDetailView';

type GroupResult = Awaited<ReturnType<typeof groups.fetchPublicGroup>>;

function group(name: string): GroupResult {
  return {
    data: { ...mockFetchPublicGroup('trance-mixes')!, name },
    meta: { source: 'api' },
  };
}

describe('GroupDetailView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the last loaded group at once and swaps in the refresh', async () => {
    const fetch = vi
      .spyOn(groups, 'fetchPublicGroup')
      .mockResolvedValue(group('Trance mixes'));
    const first = await renderWithRouter(
      <GroupDetailView slug="trance-mixes" />,
    );
    expect(await screen.findByText('Trance mixes')).toBeTruthy();
    first.unmount();

    let resolve: (value: GroupResult) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderWithRouter(<GroupDetailView slug="trance-mixes" />);
    expect(screen.getByText('Trance mixes')).toBeTruthy();
    expect(screen.queryByText('Loading group…')).toBeNull();

    await act(async () => resolve(group('Trance mixes 2')));
    expect(screen.getByText('Trance mixes 2')).toBeTruthy();
  });

  it('keeps the saved group and says the refresh failed', async () => {
    const fetch = vi
      .spyOn(groups, 'fetchPublicGroup')
      .mockResolvedValue(group('Trance mixes'));
    const first = await renderWithRouter(
      <GroupDetailView slug="trance-mixes" />,
    );
    expect(await screen.findByText('Trance mixes')).toBeTruthy();
    first.unmount();

    fetch.mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<GroupDetailView slug="trance-mixes" />);
    expect(
      await screen.findByText(
        'Could not refresh this group; showing the last loaded version.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Trance mixes')).toBeTruthy();
  });

  it('says a private or missing group is not found', async () => {
    vi.spyOn(groups, 'fetchPublicGroup').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await renderWithRouter(<GroupDetailView slug="hidden" />);
    expect(await screen.findByText('Group not found')).toBeTruthy();
    expect(
      screen.getByText('This group does not exist or is private.'),
    ).toBeTruthy();
  });
});

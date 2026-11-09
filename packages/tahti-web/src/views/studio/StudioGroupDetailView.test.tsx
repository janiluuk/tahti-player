// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as groups from '../../api/groups';
import { mockFetchMyGroups } from '../../api/groups-mock';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioGroupDetailView } from './StudioGroupDetailView';

vi.mock('./groups/GroupMembersPanel', () => ({
  GroupMembersPanel: () => null,
}));

type MyGroupsResult = Awaited<ReturnType<typeof groups.fetchMyGroups>>;

function myGroups(name: string): MyGroupsResult {
  const base = mockFetchMyGroups().find((g) => g.role === 'OWNER')!;
  return { data: [{ ...base, name }], meta: { source: 'api' } };
}

function slug() {
  return mockFetchMyGroups().find((g) => g.role === 'OWNER')!.slug;
}

describe('StudioGroupDetailView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'demo',
        displayName: 'Demo Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'demo', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('fills the form from the saved group at once and from the refresh when untouched', async () => {
    const fetch = vi
      .spyOn(groups, 'fetchMyGroups')
      .mockResolvedValue(myGroups('Night crew'));
    const first = await renderWithRouter(
      <StudioGroupDetailView slug={slug()} />,
    );
    expect(await screen.findByDisplayValue('Night crew')).toBeTruthy();
    first.unmount();

    let resolve: (value: MyGroupsResult) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderWithRouter(<StudioGroupDetailView slug={slug()} />);
    expect(screen.getByDisplayValue('Night crew')).toBeTruthy();
    expect(screen.queryByText('Loading group…')).toBeNull();

    await act(async () => resolve(myGroups('Night crew live')));
    expect(await screen.findByDisplayValue('Night crew live')).toBeTruthy();
  });

  it('keeps an edit in progress when the refresh arrives', async () => {
    const fetch = vi
      .spyOn(groups, 'fetchMyGroups')
      .mockResolvedValue(myGroups('Night crew'));
    const first = await renderWithRouter(
      <StudioGroupDetailView slug={slug()} />,
    );
    expect(await screen.findByDisplayValue('Night crew')).toBeTruthy();
    first.unmount();

    let resolve: (value: MyGroupsResult) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderWithRouter(<StudioGroupDetailView slug={slug()} />);
    fireEvent.change(screen.getByDisplayValue('Night crew'), {
      target: { value: 'My new name' },
    });
    await act(async () => resolve(myGroups('Night crew live')));
    expect(screen.getByDisplayValue('My new name')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Night crew live' }),
    ).toBeTruthy();
  });

  it('keeps the saved group and says the refresh failed', async () => {
    const fetch = vi
      .spyOn(groups, 'fetchMyGroups')
      .mockResolvedValue(myGroups('Night crew'));
    const first = await renderWithRouter(
      <StudioGroupDetailView slug={slug()} />,
    );
    expect(await screen.findByDisplayValue('Night crew')).toBeTruthy();
    first.unmount();

    fetch.mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<StudioGroupDetailView slug={slug()} />);
    expect(
      await screen.findByText(
        'Could not refresh this group; showing the last loaded version.',
      ),
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Night crew')).toBeTruthy();
  });
});

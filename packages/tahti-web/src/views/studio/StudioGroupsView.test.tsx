import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setMockSessionUser } from '../../api/mock-session';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioGroupsView } from './StudioGroupsView';

vi.mock('../../api/groups', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/groups')>()),
  fetchMyGroups: vi.fn(async () => ({
    data: [],
    meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
  })),
}));

const ARTIST = {
  id: 'mock-artist-1',
  email: 'artist@tahti.live',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  role: 'ARTIST' as const,
  isMember: true,
  channel: { slug: 'northern-lights', state: 'LIVE' as const },
};

describe('StudioGroupsView empty state', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    setMockSessionUser(ARTIST);
    useAuthStore.setState({ user: ARTIST, hydrated: true, loading: false });
  });

  afterEach(() => {
    cleanup();
    setMockSessionUser(null);
    useAuthStore.setState({ user: null });
    vi.unstubAllEnvs();
  });

  it('opens the create form from the empty state', async () => {
    await renderWithRouter(<StudioGroupsView />);
    await screen.findByText('No groups yet');
    const ctas = screen.getAllByRole('button', { name: 'New group' });
    expect(ctas).toHaveLength(2);
    fireEvent.click(ctas[1]!);
    expect(
      await screen.findByRole('button', { name: 'Create group' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New group' })).toBeNull();
  });
});

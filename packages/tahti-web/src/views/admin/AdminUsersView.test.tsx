// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import type { AdminUserRow } from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminUsersView } from './AdminUsersView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('../../components/AdminUserEditPanel', () => ({
  AdminUserEditPanel: ({ userId }: { userId: string }) => (
    <p data-testid="edit-panel">{userId}</p>
  ),
}));

function row(id: string, displayName: string): AdminUserRow {
  return {
    id,
    memberNumber: null,
    displayName,
    email: `${id}@example.com`,
    username: id,
    role: 'LISTENER',
    tier: 'LISTENER',
    isMember: false,
    isBoard: false,
    suspendedAt: null,
    channelState: null,
    engagementUnitsYtd: 0,
  } as AdminUserRow;
}

function apiUsers(rows: AdminUserRow[]) {
  return {
    data: rows,
    total: rows.length,
    meta: { source: 'api' as const },
  };
}

describe('AdminUsersView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the last loaded list at once and swaps in the refresh', async () => {
    vi.spyOn(admin, 'fetchAdminUsers').mockResolvedValue(
      apiUsers([row('ada', 'Ada')]),
    );
    const first = await renderWithRouter(<AdminUsersView />);
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    first.unmount();

    let resolve: (value: ReturnType<typeof apiUsers>) => void = () => undefined;
    vi.spyOn(admin, 'fetchAdminUsers').mockReturnValue(
      new Promise((r) => (resolve = r)),
    );
    await renderWithRouter(<AdminUsersView />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.queryByText('Loading users…')).toBeNull();

    resolve(apiUsers([row('ada', 'Ada'), row('bo', 'Bo')]));
    expect(await screen.findByText('Bo')).toBeInTheDocument();
    expect(screen.getByText('2 accounts')).toBeInTheDocument();
  });

  it('searches once the typing settles', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminUsers')
      .mockImplementation(async ({ q }) =>
        apiUsers(q ? [row('bo', 'Bo')] : [row('ada', 'Ada')]),
      );
    await renderWithRouter(<AdminUsersView />);
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search users' }), {
      target: { value: 'bo' },
    });
    expect(await screen.findByText('Bo')).toBeInTheDocument();
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith({
        q: 'bo',
        role: '',
        isMember: '',
      }),
    );
    expect(screen.getByTestId('edit-panel')).toHaveTextContent('bo');
  });

  it('says the list failed to load', async () => {
    vi.spyOn(admin, 'fetchAdminUsers').mockResolvedValue({
      data: [],
      total: 0,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<AdminUsersView />);
    expect(await screen.findByText('Could not load users')).toBeInTheDocument();
    expect(screen.getByText('HTTP 502')).toBeInTheDocument();
  });
});

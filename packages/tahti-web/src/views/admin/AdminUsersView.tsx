import { SearchIcon, UserRoundIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Input,
  Select,
  SelectableList,
  SelectableListItem,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAdminUsers, type AdminUserRow } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { AdminUserEditPanel } from '../../components/AdminUserEditPanel';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

const ROLES = ['', 'BOARD', 'ARTIST', 'LISTENER'] as const;

export const AdminUsersView = () => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [isMember, setIsMember] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      void fetchAdminUsers({ q: query, role, isMember }).then((result) => {
        setUsers(result.data);
        setTotal(result.total);
        setSelectedId((current) => {
          if (current && result.data.some((user) => user.id === current)) {
            return current;
          }
          return result.data[0]?.id ?? null;
        });
        setLoading(false);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, role, isMember]);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/users">
          <ViewShell title="Users" classes={{ root: 'px-0 pt-0' }}>
            <p className="text-foreground-secondary text-sm">
              {total} accounts
            </p>

            <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <StudioPanel className="flex min-h-0 flex-col gap-3">
                <Input
                  aria-label="Search users"
                  placeholder="Name, email, or username"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  startAddon={
                    <SearchIcon size={15} aria-hidden className="opacity-70" />
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Filter by role"
                    value={role}
                    onValueChange={setRole}
                    options={ROLES.map((value) => ({
                      id: value,
                      label: value
                        ? value.charAt(0) + value.slice(1).toLowerCase()
                        : 'All roles',
                    }))}
                  />
                  <Select
                    label="Filter by membership"
                    value={isMember}
                    onValueChange={setIsMember}
                    options={[
                      { id: '', label: 'All accounts' },
                      { id: 'true', label: 'Members' },
                      { id: 'false', label: 'Non-members' },
                    ]}
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <PageLoading label="Loading users…" />
                  ) : users.length === 0 ? (
                    <PageEmpty title="No users match these filters" />
                  ) : (
                    <SelectableList
                      items={users.map(
                        (user): SelectableListItem => ({
                          id: user.id,
                          title: user.displayName,
                          subtitle: `@${user.username}${user.suspendedAt ? ' · suspended' : ''}`,
                          meta:
                            user.role.charAt(0) +
                            user.role.slice(1).toLowerCase(),
                        }),
                      )}
                      selected={selectedId}
                      onChange={setSelectedId}
                    />
                  )}
                </div>
              </StudioPanel>

              <div className="min-w-0">
                {!selectedId ? (
                  <StudioPanel className="flex min-h-72 items-center justify-center">
                    <div className="text-center">
                      <UserRoundIcon
                        size={28}
                        aria-hidden
                        className="text-foreground-secondary mx-auto mb-2"
                      />
                      <p className="text-foreground-secondary text-sm">
                        Select a user to view and edit their account.
                      </p>
                    </div>
                  </StudioPanel>
                ) : (
                  <AdminUserEditPanel
                    key={selectedId}
                    userId={selectedId}
                    onUserUpdated={(user) =>
                      setUsers((current) =>
                        current.map((row) =>
                          row.id === user.id
                            ? {
                                ...row,
                                role: user.role,
                                tier: user.tier,
                                isMember: user.isMember,
                                isBoard: user.isBoard,
                                memberNumber: user.memberNumber,
                                suspendedAt: user.suspendedAt,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                )}
              </div>
            </div>
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
};

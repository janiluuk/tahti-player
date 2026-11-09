import { DownloadIcon, SearchIcon, UserRoundIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  Input,
  MediaArtwork,
  Select,
  SelectableList,
  SelectableListItem,
  ViewShell,
} from '@tahti-player/ui';

import {
  adminUsersExportCsvUrl,
  fetchAdminUsers,
  type AdminUserRow,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { AdminUserEditPanel } from '../../components/AdminUserEditPanel';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';

const ROLES = ['', 'BOARD', 'ARTIST', 'LISTENER'] as const;

export const AdminUsersView = () => {
  const { t } = useTranslation('web');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [isMember, setIsMember] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', isMember: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(
      () => setFilters({ q: query.trim(), role, isMember }),
      200,
    );
    return () => clearTimeout(handle);
  }, [query, role, isMember]);

  const snapshot = useSnapshotFetch(
    `admin-users:${JSON.stringify(filters)}`,
    async () => {
      const result = await fetchAdminUsers(filters);
      return { users: apiResult(result), total: result.total };
    },
  );
  const users = snapshot.data?.users ?? [];
  const total = snapshot.data?.total ?? 0;
  const { loading, error: loadError, retry } = snapshot;
  const updateUsers = (
    update: (current: AdminUserRow[]) => AdminUserRow[],
    removed = 0,
  ) =>
    snapshot.mutate((current) => ({
      users: update(current?.users ?? []),
      total: Math.max(0, (current?.total ?? 0) - removed),
    }));
  const shownId =
    selectedId && users.some((user) => user.id === selectedId)
      ? selectedId
      : (users[0]?.id ?? null);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/users">
          <ViewShell
            title={t('adminUsersView.users')}
            classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground-secondary text-sm">
                {total} accounts
              </p>
              <ButtonAnchor
                href={adminUsersExportCsvUrl({ q: query, role, isMember })}
                download
                size="sm"
                variant="secondary"
                data-testid="admin-users-export"
              >
                <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                {t('adminUsersView.exportCsv')}
              </ButtonAnchor>
            </div>

            <div className="grid min-h-[36rem] grid-cols-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <StudioPanel className="flex min-h-0 flex-col gap-3">
                <Input
                  enterKeyHint="search"
                  type="search"
                  aria-label={t('adminUsersView.searchUsers')}
                  placeholder={t('adminUsersView.nameEmailOrUsername')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  startAddon={
                    <SearchIcon size={15} aria-hidden className="opacity-70" />
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label={t('adminUsersView.filterByRole')}
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
                    label={t('adminUsersView.filterByMembership')}
                    value={isMember}
                    onValueChange={setIsMember}
                    options={[
                      { id: '', label: t('adminUsersViewMore.allAccounts') },
                      { id: 'true', label: t('adminUsersViewMore.members') },
                      {
                        id: 'false',
                        label: t('adminUsersViewMore.nonMembers'),
                      },
                    ]}
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <PageLoading label={t('loading.loadingUsers')} />
                  ) : loadError && users.length === 0 ? (
                    <PageError
                      title={t('loadErrors.couldNotLoadUsers')}
                      description={loadError}
                      onRetry={retry}
                    />
                  ) : users.length === 0 ? (
                    query.trim() || role || isMember ? (
                      <PageEmpty
                        title={t('empties.noUsersMatchTheseFilters')}
                        action={
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setQuery('');
                              setRole('');
                              setIsMember('');
                            }}
                          >
                            {t('adminUsersView.clearFilters')}
                          </Button>
                        }
                      />
                    ) : (
                      <PageEmpty title={t('empties.noUsers')} />
                    )
                  ) : (
                    <SelectableList
                      items={users.map((user): SelectableListItem => ({
                        id: user.id,
                        title: user.displayName,
                        subtitle: user.suspendedAt
                          ? t('adminUsersView.usernameSuspended', {
                              username: user.username,
                            })
                          : `@${user.username}`,
                        meta: t(`adminUsersView.role${user.role}`),
                        media: (
                          <MediaArtwork
                            src={user.avatarUrl}
                            alt=""
                            seed={user.username}
                            size="sm"
                            className="size-8 rounded-full"
                          />
                        ),
                      }))}
                      selected={shownId}
                      onChange={setSelectedId}
                    />
                  )}
                </div>
              </StudioPanel>

              <div className="min-w-0">
                {!shownId ? (
                  <StudioPanel className="flex min-h-72 items-center justify-center">
                    <div className="text-center">
                      <UserRoundIcon
                        size={28}
                        aria-hidden
                        className="text-foreground-secondary mx-auto mb-2"
                      />
                      <p className="text-foreground-secondary text-sm">
                        {t('adminUsersView.selectAUserToView')}
                      </p>
                    </div>
                  </StudioPanel>
                ) : (
                  <AdminUserEditPanel
                    key={shownId}
                    userId={shownId}
                    onUserDeleted={(id) =>
                      updateUsers(
                        (current) => current.filter((row) => row.id !== id),
                        1,
                      )
                    }
                    onUserUpdated={(user) =>
                      updateUsers((current) =>
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

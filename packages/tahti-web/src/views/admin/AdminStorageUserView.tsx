import { ArrowLeftIcon, PlayIcon } from 'lucide-react';

import 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  ButtonLink,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminStorageUserFiles,
  type AdminStorageUserDetail,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import {
  formatBytes,
  formatFileDate,
  formatQuota,
  usagePercent,
} from '../../lib/storageFormat';
import { useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { usePlayerStore } from '../../stores/playerStore';

export function AdminStorageUserView({ userId }: { userId: string }) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const { data: detail, loading } = useSnapshotFetch<AdminStorageUserDetail>(
    `admin-storage-user:${userId}`,
    async () => {
      const res = await fetchAdminStorageUserFiles(userId);
      if (!res.data) {
        throw new Error('Storage details unavailable');
      }
      return res.data;
    },
  );

  const pct = detail
    ? usagePercent(detail.usedBytes, detail.quotaBytes, detail.unlimited)
    : null;

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/storage">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminStorageUserView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="platform" />
              <BreadcrumbLink to="/admin/storage">
                {t('adminStorageUserView.storage')}
              </BreadcrumbLink>
              <BreadcrumbLink to="/admin/storage" search={{ tab: 'files' }}>
                {t('adminStorageUserView.files')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {detail?.displayName ?? 'User'}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ButtonLink
              className="w-fit"
              to="/admin/storage"
              size="sm"
              variant="text"
            >
              <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
              {t('adminStorageUserView.backToStorage')}
            </ButtonLink>

            {loading ? (
              <StudioPanel>
                <PageLoading label={t('loading.loadingStorageDetails')} />
              </StudioPanel>
            ) : !detail ? (
              <StudioPanel>
                <PageError
                  description={t('loadErrors.couldNotLoadThisUserS')}
                />
              </StudioPanel>
            ) : (
              <>
                <ViewShell
                  title={detail.displayName}
                  classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
                >
                  <StudioPanel>
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <div className="text-foreground-secondary text-xs uppercase">
                          {t('adminStorageUserView.used')}
                        </div>
                        <div className="text-lg font-semibold">
                          {formatBytes(detail.usedBytes)}
                        </div>
                      </div>
                      <div>
                        <div className="text-foreground-secondary text-xs uppercase">
                          {t('adminStorageUserView.quota')}
                        </div>
                        <div className="text-lg font-semibold">
                          {formatQuota(detail.quotaBytes, detail.unlimited)}
                        </div>
                      </div>
                      {pct != null ? (
                        <div>
                          <div className="text-foreground-secondary text-xs uppercase">
                            {t('adminStorageUserView.usedOfQuota')}
                          </div>
                          <div
                            className={`text-lg font-semibold ${pct > 100 ? 'text-accent-red-strong' : ''}`}
                          >
                            {Math.round(pct)}%
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </StudioPanel>

                  <StudioPanel
                    title={t('adminStorageUserView.files')}
                    description={t(
                      'adminStorageUserView.oldestFirstWithARunning',
                    )}
                  >
                    {detail.files.length === 0 ? (
                      <PageEmpty title={t('empties.noFilesUploaded')} />
                    ) : (
                      <ul className="divide-border divide-y">
                        {detail.files.map((f) => (
                          <li
                            key={f.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{f.title}</div>
                              <div className="text-foreground-secondary text-xs">
                                {f.kind === 'stash'
                                  ? t('adminStorageUserViewStates.stash')
                                  : t('adminStorageUserViewStates.tracks')}{' '}
                                · {formatBytes(f.sizeBytes)} ·{' '}
                                {formatFileDate(f.createdAt)} · running total{' '}
                                {formatBytes(f.runningTotalBytes)}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {f.isPublic != null ? (
                                <Badge
                                  variant="pill"
                                  color={f.isPublic ? 'green' : 'secondary'}
                                >
                                  {f.isPublic
                                    ? t('adminStorageUserViewStates.public')
                                    : t('adminStorageUserViewStates.private')}
                                </Badge>
                              ) : null}
                              {f.isAudio && f.previewUrl ? (
                                <Tooltip
                                  content={t('adminStorageUserView.preview')}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="text"
                                    aria-label={t(
                                      'adminStorageUserViewLabels.previewTitle',
                                      { title: f.title },
                                    )}
                                    onClick={() =>
                                      play({
                                        id: `admin-storage-file:${f.id}`,
                                        kind: 'sound',
                                        title: f.title,
                                        artist: detail.displayName,
                                        streamUrl: f.previewUrl!,
                                        protocol: 'https',
                                      })
                                    }
                                  >
                                    <PlayIcon size={16} aria-hidden />
                                  </Button>
                                </Tooltip>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </StudioPanel>
                </ViewShell>
              </>
            )}
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}

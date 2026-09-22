import { Link } from '@tanstack/react-router';
import { CloudIcon, ExternalLinkIcon, HardDriveIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, DonutChart, Meter, Tooltip } from '@tahti-player/ui';

import {
  fetchAdminFiles,
  fetchAdminStorage,
  type AdminFileRow,
  type AdminStorageOverview,
  type AdminStorageUserRow,
} from '../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { contentTypeLabel } from '../../../content/contentTypes';
import {
  formatBytes,
  formatQuota,
  usagePercent,
} from '../../../lib/storageFormat';
import { DiskSpaceCard, QuotaEditor, STORAGE_TYPE_COLORS } from './shared';

function TopUsersChart({ users }: { users: AdminStorageUserRow[] }) {
  const top = useMemo(
    () => [...users].sort((a, b) => b.usedBytes - a.usedBytes).slice(0, 8),
    [users],
  );
  const max = Math.max(...top.map((u) => u.usedBytes), 1);

  if (top.length === 0) {
    return <PageEmpty title="No usage recorded yet" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {top.map((u) => (
        <div key={u.userId} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              {u.displayName}{' '}
              <span className="text-foreground-secondary font-normal">
                @{u.username}
              </span>
            </span>
            <span className="text-foreground-secondary shrink-0 text-xs">
              {formatBytes(u.usedBytes)}
              {u.unlimited ? ' · unlimited quota' : ''}
            </span>
          </div>
          <Meter value={u.usedBytes} max={max} className="mt-1" />
        </div>
      ))}
    </div>
  );
}

function StorageTypeBreakdown({ files }: { files: AdminFileRow[] }) {
  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    files.forEach((file) => {
      const type = contentTypeLabel(file.contentType);
      totals.set(type, (totals.get(type) ?? 0) + (file.sizeBytes ?? 0));
    });
    return [...totals.entries()]
      .map(([type, bytes]) => ({ type, bytes }))
      .sort((a, b) => b.bytes - a.bytes);
  }, [files]);

  const totalBytes = breakdown.reduce((total, item) => total + item.bytes, 0);

  return (
    <StudioPanel
      title="Storage by file type"
      description="How total stored file usage is distributed across content types."
    >
      {breakdown.length === 0 || totalBytes === 0 ? (
        <PageEmpty title="No file usage recorded yet" />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <DonutChart
            segments={breakdown.map((item, index) => ({
              id: item.type,
              value: item.bytes,
              color: STORAGE_TYPE_COLORS[index % STORAGE_TYPE_COLORS.length],
            }))}
            centerLabel="Total usage"
            centerValue={formatBytes(totalBytes)}
            aria-label={`File type storage breakdown totaling ${formatBytes(totalBytes)}`}
          />
          <ul className="flex w-full flex-col gap-3 text-sm">
            {breakdown.map((item, index) => (
              <li key={item.type} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      STORAGE_TYPE_COLORS[index % STORAGE_TYPE_COLORS.length],
                  }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{item.type}</span>
                <span className="shrink-0 font-semibold">
                  {formatBytes(item.bytes)}
                </span>
                <span className="text-foreground-secondary w-12 shrink-0 text-right text-xs">
                  {Math.round((item.bytes / totalBytes) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </StudioPanel>
  );
}

export function StorageOverviewTab() {
  const [overview, setOverview] = useState<AdminStorageOverview | null>(null);
  const [files, setFiles] = useState<AdminFileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    void Promise.all([fetchAdminStorage(), fetchAdminFiles()]).then(
      ([storageResult, filesResult]) => {
        setOverview(storageResult.data);
        setFiles(filesResult.data);
        setLoading(false);
      },
    );
  };

  useEffect(reload, []);

  if (loading) {
    return (
      <StudioPanel>
        <PageLoading label="Loading storage…" />
      </StudioPanel>
    );
  }

  if (!overview) {
    return (
      <StudioPanel>
        <PageError description="Could not load storage usage." />
      </StudioPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <DiskSpaceCard
          icon={HardDriveIcon}
          title="Local server disk"
          space={overview.localDisk}
        />
        <DiskSpaceCard
          icon={CloudIcon}
          title="Object storage"
          space={overview.objectStorage}
        />
      </div>

      <StorageTypeBreakdown files={files} />

      <StudioPanel
        title="Top users by storage usage"
        description="The heaviest storage accounts across the platform."
      >
        <TopUsersChart users={overview.users} />
      </StudioPanel>

      <StudioPanel
        title="All users"
        description="Quota vs. usage for every account with recorded storage."
      >
        <div className="mb-4 flex flex-wrap gap-6">
          <div>
            <div className="text-foreground-secondary text-xs">Total used</div>
            <div className="text-lg font-semibold">
              {formatBytes(overview.totalUsedBytes)}
            </div>
          </div>
          <div>
            <div className="text-foreground-secondary text-xs">Total quota</div>
            <div className="text-lg font-semibold">
              {formatBytes(overview.totalQuotaBytes)}
            </div>
          </div>
          <div>
            <div className="text-foreground-secondary text-xs">
              Users with usage
            </div>
            <div className="text-lg font-semibold">{overview.userCount}</div>
          </div>
        </div>

        {overview.users.length === 0 ? (
          <PageEmpty title="No usage recorded yet" />
        ) : (
          <ul className="divide-border divide-y">
            {overview.users.map((row) => {
              const pct = usagePercent(
                row.usedBytes,
                row.quotaBytes,
                row.unlimited,
              );
              return (
                <li
                  key={row.userId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {row.displayName}{' '}
                      <span className="text-foreground-secondary font-normal">
                        @{row.username}
                      </span>
                    </div>
                    <div className="text-foreground-secondary text-xs">
                      {formatBytes(row.usedBytes)} of{' '}
                      {formatQuota(row.quotaBytes, row.unlimited)}
                      {pct != null ? (
                        <>
                          {' · '}
                          <span className={pct > 100 ? 'text-accent-red' : ''}>
                            {Math.round(pct)}%
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <QuotaEditor
                      userId={row.userId}
                      quotaBytes={row.quotaBytes}
                      displayName={row.displayName}
                      onSaved={reload}
                    />
                    <Link
                      to="/admin/storage/$userId"
                      params={{ userId: row.userId }}
                    >
                      <Tooltip content="View files" side="top">
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          aria-label={`View ${row.displayName}'s files`}
                        >
                          <ExternalLinkIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </StudioPanel>
    </div>
  );
}

import { Link, useSearch } from '@tanstack/react-router';
import {
  ArrowDownAZIcon,
  CloudIcon,
  ExternalLinkIcon,
  HardDriveIcon,
  PencilIcon,
  PlayIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  Input,
  SaveButton,
  Select,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteAdminFile,
  fetchAdminFileAudio,
  fetchAdminFiles,
  fetchAdminStorage,
  setUserStorageQuota,
  type AdminFileRow,
  type AdminStorageDiskSpace,
  type AdminStorageOverview,
  type AdminStorageUserRow,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { AdminUserEditPanel } from '../../components/AdminUserEditPanel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { contentTypeLabel } from '../../content/contentTypes';
import { formatDuration } from '../../lib/playableToTrack';
import {
  bytesToMb,
  formatBytes,
  formatFileDate,
  formatQuota,
  groupFileRowsByUser,
  usagePercent,
} from '../../lib/storageFormat';
import { usePlayerStore } from '../../stores/playerStore';

const STORAGE_LOCATION_LABELS: Record<'local' | 'r2', string> = {
  local: 'Local disk',
  r2: 'Object storage (R2)',
};

type FileSortKey = 'name' | 'type' | 'size' | 'length';

const SORT_OPTIONS: Array<{ id: FileSortKey; label: string }> = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'size', label: 'Size' },
  { id: 'length', label: 'Length' },
];

const STORAGE_TYPE_COLORS = [
  'var(--accent-orange)',
  'var(--accent-purple)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-yellow)',
  'var(--accent-blue)',
];

function sortFiles(files: AdminFileRow[], sortBy: FileSortKey): AdminFileRow[] {
  const sorted = [...files];
  switch (sortBy) {
    case 'type':
      sorted.sort((a, b) =>
        contentTypeLabel(a.contentType).localeCompare(
          contentTypeLabel(b.contentType),
        ),
      );
      break;
    case 'size':
      sorted.sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));
      break;
    case 'length':
      sorted.sort((a, b) => (b.durationSec ?? 0) - (a.durationSec ?? 0));
      break;
    case 'name':
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

function FileDetailDialog({
  file,
  onClose,
}: {
  file: AdminFileRow;
  onClose: () => void;
}) {
  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>{file.title}</Dialog.Title>
      <Dialog.Description>
        Full file record — everything currently tracked for this upload.
      </Dialog.Description>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Filename
          </dt>
          <dd className="font-medium break-all">{file.title}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Type</dt>
          <dd>{contentTypeLabel(file.contentType)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Uploader
          </dt>
          <dd>
            {file.displayName} · @{file.username}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Uploaded
          </dt>
          <dd>{formatFileDate(file.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Total size
          </dt>
          <dd>{formatBytes(file.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Length
          </dt>
          <dd>
            {file.durationSec != null ? formatDuration(file.durationSec) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Revisions
          </dt>
          <dd>{file.revisionCount}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Storage location
          </dt>
          <dd>
            {file.storageLocation
              ? STORAGE_LOCATION_LABELS[file.storageLocation]
              : 'Not tracked yet'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Visibility
          </dt>
          <dd>{file.isPublic ? 'Public' : 'Private'}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Genre</dt>
          <dd>{file.genre ?? '—'}</dd>
        </div>
      </dl>
      <Dialog.Actions>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

function QuotaEditor({
  userId,
  quotaBytes,
  displayName,
  onSaved,
}: {
  userId: string;
  quotaBytes: number;
  displayName: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(bytesToMb(quotaBytes)));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <Tooltip content="Edit quota" side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={`Edit quota for ${displayName}`}
          onClick={() => {
            setValue(String(bytesToMb(quotaBytes)));
            setEditing(true);
          }}
        >
          <PencilIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        size="sm"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20"
        disabled={saving}
        aria-label={`Quota in MB for ${displayName}`}
      />
      <span className="text-foreground-secondary text-xs">MB</span>
      <SaveButton
        size="sm"
        saving={saving}
        title="Save quota"
        onClick={() => {
          const mb = Number(value);
          if (!Number.isFinite(mb) || mb <= 0) {
            return;
          }
          setSaving(true);
          void setUserStorageQuota(userId, Math.round(mb * 1024 * 1024)).then(
            () => {
              setSaving(false);
              setEditing(false);
              onSaved();
            },
          );
        }}
      />
      <Tooltip content="Cancel" side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label="Cancel editing quota"
          onClick={() => setEditing(false)}
        >
          <XIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </div>
  );
}

function DiskSpaceCard({
  icon: Icon,
  title,
  space,
}: {
  icon: typeof HardDriveIcon;
  title: string;
  space: AdminStorageDiskSpace;
}) {
  const pctUsed =
    space.totalBytes != null && space.totalBytes > 0 && space.usedBytes != null
      ? (space.usedBytes / space.totalBytes) * 100
      : null;

  return (
    <StudioPanel>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} aria-hidden className="text-primary" />
        <h3 className="font-display text-base font-bold">{title}</h3>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Used</dt>
          <dd className="font-semibold">{formatBytes(space.usedBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Free</dt>
          <dd className="font-semibold">{formatBytes(space.freeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Total</dt>
          <dd className="font-semibold">{formatBytes(space.totalBytes)}</dd>
        </div>
      </dl>
      {pctUsed != null ? (
        <div className="bg-background-secondary mt-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${Math.min(100, pctUsed)}%` }}
          />
        </div>
      ) : null}
      {space.note ? (
        <p className="text-foreground-secondary mt-3 text-xs">{space.note}</p>
      ) : null}
    </StudioPanel>
  );
}

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
          <div className="bg-background-secondary mt-1 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${(u.usedBytes / max) * 100}%` }}
            />
          </div>
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
  let accumulatedPercent = 0;
  const gradientStops = breakdown.map((item, index) => {
    const start = accumulatedPercent;
    accumulatedPercent += totalBytes > 0 ? (item.bytes / totalBytes) * 100 : 0;
    return `${STORAGE_TYPE_COLORS[index % STORAGE_TYPE_COLORS.length]} ${start}% ${accumulatedPercent}%`;
  });

  return (
    <StudioPanel
      title="Storage by file type"
      description="How total stored file usage is distributed across content types."
    >
      {breakdown.length === 0 || totalBytes === 0 ? (
        <PageEmpty title="No file usage recorded yet" />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div
            className="relative size-44 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(${gradientStops.join(', ')})`,
            }}
            role="img"
            aria-label={`File type storage breakdown totaling ${formatBytes(totalBytes)}`}
          >
            <div className="bg-background absolute inset-7 flex flex-col items-center justify-center rounded-full text-center">
              <span className="text-foreground-secondary text-[10px] uppercase">
                Total usage
              </span>
              <span className="text-lg font-bold">
                {formatBytes(totalBytes)}
              </span>
            </div>
          </div>
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

function StorageOverviewTab() {
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

function FileRow({
  f,
  pendingPlayId,
  onPlay,
  onViewDetail,
  onEditUploader,
  onDelete,
}: {
  f: AdminFileRow;
  pendingPlayId: string | null;
  onPlay: (f: AdminFileRow) => void;
  onViewDetail: (f: AdminFileRow) => void;
  onEditUploader: (userId: string) => void;
  onDelete: (f: AdminFileRow) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {f.title}{' '}
          <span className="text-foreground-secondary font-normal">
            · {formatBytes(f.sizeBytes)} · {contentTypeLabel(f.contentType)}
          </span>
        </div>
        <div className="text-foreground-secondary text-xs">
          <button
            type="button"
            className="hover:text-foreground underline-offset-2 hover:underline"
            onClick={() => onEditUploader(f.userId)}
          >
            @{f.username}
          </button>{' '}
          · {formatFileDate(f.createdAt)}
          {f.genre ? ` · ${f.genre}` : ''}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge variant="pill" color="secondary">
          {f.format ?? '—'}
        </Badge>
        <Badge variant="pill" color={f.isPublic ? 'green' : 'secondary'}>
          {f.isPublic ? 'Public' : 'Private'}
        </Badge>
        <Tooltip content="Preview" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Preview ${f.title}`}
            disabled={pendingPlayId === f.id}
            onClick={() => onPlay(f)}
          >
            <PlayIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="View details" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`View details for ${f.title}`}
            onClick={() => onViewDetail(f)}
          >
            <SearchIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
        <Link to="/admin/storage/$userId" params={{ userId: f.userId }}>
          <Tooltip content="View uploader's storage" side="top">
            <Button
              size="icon-sm"
              variant="text"
              aria-label={`View ${f.displayName}'s storage`}
            >
              <ExternalLinkIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </Link>
        <Tooltip content="Delete" side="top">
          <Button
            size="icon-sm"
            variant="text"
            className="text-accent-red hover:text-accent-red"
            aria-label={`Delete ${f.title}`}
            onClick={() => onDelete(f)}
          >
            <Trash2Icon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
    </li>
  );
}

function FilesBrowserTab() {
  const play = usePlayerStore((s) => s.play);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<AdminFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByUser, setGroupByUser] = useState(false);
  const [pendingPlayId, setPendingPlayId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FileSortKey>('name');
  const [detailFile, setDetailFile] = useState<AdminFileRow | null>(null);
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] =
    useState<AdminFileRow | null>(null);

  const reload = (q?: string) => {
    setLoading(true);
    void fetchAdminFiles(q).then((res) => {
      setFiles(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    const handle = setTimeout(() => reload(query), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const sortedFiles = useMemo(() => sortFiles(files, sortBy), [files, sortBy]);
  // Groups are built from the already-sorted list so each user's files keep
  // the active sort instead of reverting to insertion order.
  const groupedRows = useMemo(
    () => groupFileRowsByUser(sortedFiles),
    [sortedFiles],
  );
  const totalSizeBytes = useMemo(
    () => sortedFiles.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0),
    [sortedFiles],
  );

  const handlePlay = async (file: AdminFileRow) => {
    if (pendingPlayId) {
      return;
    }
    setPendingPlayId(file.id);
    const resolved = file.audioUrl
      ? {
          audioUrl: file.audioUrl,
          title: file.title,
          artistName: file.artistName,
          channelSlug: file.channelSlug,
          durationSec: file.durationSec,
        }
      : (await fetchAdminFileAudio(file.id)).data;
    setPendingPlayId(null);
    if (!resolved?.audioUrl) {
      return;
    }
    play({
      id: `admin-file:${file.id}`,
      kind: 'sound',
      title: resolved.title,
      artist: resolved.artistName,
      streamUrl: resolved.audioUrl,
      protocol: 'https',
      channelSlug: resolved.channelSlug,
      durationSec: resolved.durationSec,
    });
  };

  const handleDelete = (f: AdminFileRow) => {
    setPendingDeleteFile(f);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search files"
          placeholder="Search by title, artist, or username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm flex-1"
          startAddon={
            <SearchIcon size={15} aria-hidden className="opacity-70" />
          }
        />
        <Button
          size="sm"
          variant={groupByUser ? 'secondary' : 'text'}
          aria-pressed={groupByUser}
          onClick={() => setGroupByUser((v) => !v)}
        >
          <UsersIcon size={14} aria-hidden className="mr-1.5" />
          Group by user
        </Button>
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <ArrowDownAZIcon size={14} aria-hidden />
          <Select
            label="Sort files by"
            value={sortBy}
            onValueChange={(value) => setSortBy(value as FileSortKey)}
            options={SORT_OPTIONS.map((option) => ({
              id: option.id,
              label: option.label,
            }))}
          />
        </div>
      </div>

      {!loading && sortedFiles.length > 0 ? (
        <div className="text-foreground-secondary text-xs">
          Total size:{' '}
          <span className="text-foreground font-semibold">
            {formatBytes(totalSizeBytes)}
          </span>{' '}
          across {sortedFiles.length}{' '}
          {sortedFiles.length === 1 ? 'file' : 'files'}
        </div>
      ) : null}

      {groupByUser ? (
        <StudioPanel
          title="Files by user"
          description="Every matching file, grouped by uploader with a running total per user."
        >
          {loading ? (
            <PageLoading label="Loading storage users…" />
          ) : groupedRows.length === 0 ? (
            <PageEmpty title="No files match this search" />
          ) : (
            <div className="flex flex-col gap-5">
              {groupedRows.map((g) => (
                <div key={g.userId}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <Link
                      to="/admin/storage/$userId"
                      params={{ userId: g.userId }}
                      className="hover:underline"
                    >
                      <span className="font-medium">{g.displayName}</span>{' '}
                      <span className="text-foreground-secondary">
                        @{g.username}
                      </span>
                    </Link>
                    <span className="text-foreground-secondary shrink-0 text-xs">
                      {g.fileCount} {g.fileCount === 1 ? 'file' : 'files'} ·{' '}
                      {formatBytes(g.totalBytes)}
                    </span>
                  </div>
                  <ul className="divide-border [&>li:nth-child(even)]:bg-background-secondary/40 divide-y">
                    {g.files.map((f) => (
                      <FileRow
                        key={f.id}
                        f={f}
                        pendingPlayId={pendingPlayId}
                        onPlay={(file) => void handlePlay(file)}
                        onViewDetail={setDetailFile}
                        onEditUploader={setUserEditId}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </StudioPanel>
      ) : (
        <StudioPanel>
          {loading ? (
            <PageLoading label="Loading files…" />
          ) : files.length === 0 ? (
            <PageEmpty title="No files match this search" />
          ) : (
            <ul className="divide-border [&>li:nth-child(even)]:bg-background-secondary/40 divide-y">
              {sortedFiles.map((f) => (
                <FileRow
                  key={f.id}
                  f={f}
                  pendingPlayId={pendingPlayId}
                  onPlay={(file) => void handlePlay(file)}
                  onViewDetail={setDetailFile}
                  onEditUploader={setUserEditId}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </StudioPanel>
      )}

      {detailFile ? (
        <FileDetailDialog
          file={detailFile}
          onClose={() => setDetailFile(null)}
        />
      ) : null}

      {userEditId ? (
        <Dialog.Root
          isOpen
          onClose={() => setUserEditId(null)}
          className="max-w-3xl"
        >
          <Dialog.Title>Edit uploader</Dialog.Title>
          <AdminUserEditPanel userId={userEditId} />
          <Dialog.Actions>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>
      ) : null}
      <ConfirmDialog
        isOpen={pendingDeleteFile !== null}
        title={
          pendingDeleteFile
            ? `Delete "${pendingDeleteFile.title}" permanently?`
            : 'Delete file?'
        }
        description="This removes the file from platform storage."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteFile(null)}
        onConfirm={() => {
          const file = pendingDeleteFile;
          setPendingDeleteFile(null);
          if (!file) {
            return;
          }
          void deleteAdminFile(file.id).then(() => reload(query));
        }}
      />
    </div>
  );
}

export function AdminStorageView() {
  const search = useSearch({ strict: false }) as { tab?: string };
  const [tab, setTab] = useState<'storage' | 'files'>(
    search.tab === 'files' ? 'files' : 'storage',
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/storage">
          <div className="flex max-w-6xl flex-col gap-6">
            <ViewShell title="Storage" classes={{ root: 'px-0 pt-0' }}>
              <Tabs
                selectedIndex={tab === 'storage' ? 0 : 1}
                onChange={(index) => setTab(index === 0 ? 'storage' : 'files')}
                listClassName="border-border border-b pb-3"
                panelClassName="pt-2"
                items={[
                  {
                    id: 'storage',
                    label: 'Storage',
                    icon: <HardDriveIcon size={14} />,
                    content: <StorageOverviewTab />,
                  },
                  {
                    id: 'files',
                    label: 'Files',
                    icon: <CloudIcon size={14} />,
                    content: <FilesBrowserTab />,
                  },
                ]}
              />
            </ViewShell>{' '}
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}

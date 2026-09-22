import { Link } from '@tanstack/react-router';
import {
  ArrowDownAZIcon,
  ExternalLinkIcon,
  PlayIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  Input,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import {
  deleteAdminFile,
  fetchAdminFileAudio,
  fetchAdminFiles,
  type AdminFileRow,
} from '../../../api/admin';
import { AdminUserEditPanel } from '../../../components/AdminUserEditPanel';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PageEmpty, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { contentTypeLabel } from '../../../content/contentTypes';
import {
  formatBytes,
  formatFileDate,
  groupFileRowsByUser,
} from '../../../lib/storageFormat';
import { usePlayerStore } from '../../../stores/playerStore';
import {
  FileDetailDialog,
  SORT_OPTIONS,
  sortFiles,
  type FileSortKey,
} from './shared';

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

export function FilesBrowserTab() {
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

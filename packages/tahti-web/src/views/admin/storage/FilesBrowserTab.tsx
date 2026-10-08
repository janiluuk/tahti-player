import { Link } from '@tanstack/react-router';
import {
  ArrowDownAZIcon,
  CheckSquareIcon,
  ExternalLinkIcon,
  PlayIcon,
  SearchIcon,
  SquareIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  ButtonLink,
  Dialog,
  Input,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import {
  deleteAdminFile,
  fetchAdminFileAudio,
  fetchAdminFileFacets,
  fetchAdminFiles,
  type AdminFileFacets,
  type AdminFileFilters,
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
import { BulkEditBar } from './BulkEditBar';
import {
  FileDetailDialog,
  SORT_OPTIONS,
  sortFiles,
  type FileSortKey,
} from './shared';

function FileRow({
  f,
  selected,
  onToggleSelect,
  pendingPlayId,
  onPlay,
  onViewDetail,
  onEditUploader,
  onDelete,
}: {
  f: AdminFileRow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  pendingPlayId: string | null;
  onPlay: (f: AdminFileRow) => void;
  onViewDetail: (f: AdminFileRow) => void;
  onEditUploader: (userId: string) => void;
  onDelete: (f: AdminFileRow) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-sm">
      <Button
        size="icon-sm"
        variant="text"
        aria-pressed={selected}
        aria-label={`Select ${f.title}`}
        onClick={() => onToggleSelect(f.id)}
      >
        {selected ? (
          <CheckSquareIcon size={16} aria-hidden />
        ) : (
          <SquareIcon size={16} aria-hidden />
        )}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {f.title}{' '}
          <span className="text-foreground-secondary font-normal">
            · {formatBytes(f.sizeBytes)} · {contentTypeLabel(f.contentType)}
          </span>
        </div>
        <div className="text-foreground-secondary text-xs">
          <Button
            variant="text"
            size="flexible"
            className="hover:text-foreground p-0 text-xs underline-offset-2 hover:underline"
            onClick={() => onEditUploader(f.userId)}
          >
            @{f.username}
          </Button>{' '}
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
        <Tooltip content="View uploader's storage" side="top">
          <ButtonLink
            to="/admin/storage/$userId"
            params={{ userId: f.userId }}
            size="icon-sm"
            variant="text"
            aria-label={`View ${f.displayName}'s storage`}
          >
            <ExternalLinkIcon size={15} aria-hidden />
          </ButtonLink>
        </Tooltip>
        <Tooltip content="Delete" side="top">
          <Button
            size="icon-sm"
            variant="text"
            className="text-accent-red-strong hover:text-accent-red-strong"
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
  const [facets, setFacets] = useState<AdminFileFacets | null>(null);
  const [userId, setUserId] = useState('');
  const [genre, setGenre] = useState('');
  const [contentType, setContentType] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const toggleSelect = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const filters: AdminFileFilters = { q: query, userId, genre, contentType };
  const filtered = Boolean(query.trim() || userId || genre || contentType);

  const reload = (next: AdminFileFilters = filters) => {
    setLoading(true);
    void fetchAdminFiles(next).then((res) => {
      setFiles(res.data);
      setSelectedIds((current) => {
        const loaded = new Set(res.data.map((file) => file.id));
        return new Set([...current].filter((id) => loaded.has(id)));
      });
      setTotal(res.total);
      setLoading(false);
    });
  };

  useEffect(() => {
    void fetchAdminFileFacets().then(setFacets);
  }, []);

  useEffect(() => {
    const handle = setTimeout(
      () => reload({ q: query, userId, genre, contentType }),
      250,
    );
    return () => clearTimeout(handle);
  }, [query, userId, genre, contentType]);

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
        <Select
          label="Uploader"
          value={userId}
          onValueChange={setUserId}
          options={[
            { id: '', label: 'Everyone' },
            ...(facets?.users ?? []).map((user) => ({
              id: user.id,
              label: `${user.displayName && !user.displayName.includes('@') ? user.displayName : user.username} (@${user.username})`,
            })),
          ]}
          className="min-w-44"
        />
        <Select
          label="Genre"
          value={genre}
          onValueChange={setGenre}
          options={[
            { id: '', label: 'Any genre' },
            ...(facets?.genres ?? []).map((name) => ({
              id: name,
              label: name,
            })),
          ]}
          className="min-w-36"
        />
        <Select
          label="Type"
          value={contentType}
          onValueChange={setContentType}
          options={[
            { id: '', label: 'Any type' },
            ...(facets?.contentTypes ?? []).map((type) => ({
              id: type,
              label: contentTypeLabel(type),
            })),
          ]}
          className="min-w-36"
        />
        {filtered ? (
          <Button
            size="sm"
            variant="text"
            onClick={() => {
              setQuery('');
              setUserId('');
              setGenre('');
              setContentType('');
            }}
          >
            Clear filters
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="text"
          disabled={files.length === 0}
          onClick={() =>
            setSelectedIds(
              selectedIds.size === files.length
                ? new Set()
                : new Set(files.map((file) => file.id)),
            )
          }
        >
          {selectedIds.size === files.length && files.length > 0
            ? 'Select none'
            : 'Select all shown'}
        </Button>
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

      {selectedIds.size > 0 ? (
        <BulkEditBar
          selectedIds={[...selectedIds]}
          facets={facets}
          onClear={() => setSelectedIds(new Set())}
          onApplied={(updated) => {
            setSelectedIds(new Set());
            setNotice(
              `Updated ${updated} ${updated === 1 ? 'file' : 'files'}.`,
            );
            reload();
          }}
        />
      ) : null}

      {notice ? (
        <p className="text-foreground-secondary text-sm" role="status">
          {notice}
        </p>
      ) : null}

      {!loading && sortedFiles.length > 0 ? (
        <div className="text-foreground-secondary text-xs">
          Total size:{' '}
          <span className="text-foreground font-semibold">
            {formatBytes(totalSizeBytes)}
          </span>{' '}
          across {sortedFiles.length}{' '}
          {sortedFiles.length === 1 ? 'file' : 'files'}
          {total > sortedFiles.length
            ? ` (the newest ${sortedFiles.length} of ${total} matching; narrow the filters to see the rest)`
            : ''}
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
            <PageEmpty
              title={filtered ? 'No files match these filters' : 'No files yet'}
            />
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
                        selected={selectedIds.has(f.id)}
                        onToggleSelect={toggleSelect}
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
            <PageEmpty
              title={filtered ? 'No files match these filters' : 'No files yet'}
            />
          ) : (
            <ul className="divide-border [&>li:nth-child(even)]:bg-background-secondary/40 divide-y">
              {sortedFiles.map((f) => (
                <FileRow
                  key={f.id}
                  f={f}
                  selected={selectedIds.has(f.id)}
                  onToggleSelect={toggleSelect}
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
          void deleteAdminFile(file.id).then(() => reload());
        }}
      />
    </div>
  );
}

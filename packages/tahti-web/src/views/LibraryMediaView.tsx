import { ImageIcon, PlayIcon, Trash2Icon, VideoIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  ExternalLink,
  FilterChips,
  ImageReveal,
  Tooltip,
} from '@tahti-player/ui';

import {
  deleteUserMedia,
  fetchUserMedia,
  type UserMediaFile,
} from '../api/user-media';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LibrarySectionToolbar } from '../components/library/LibrarySectionToolbar';
import { LibrarySortSelect } from '../components/library/LibrarySortSelect';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { StudioPanel } from '../components/StudioPanel';
import { sortLibraryItems, type LibrarySort } from '../lib/librarySort';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryMediaView() {
  const [files, setFiles] = useState<UserMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<UserMediaFile | null>(
    null,
  );
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<LibrarySort>('newest');

  const reload = async () => {
    setLoading(true);
    const result = await fetchUserMedia();
    setFiles(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const kindChips = useMemo(() => {
    const hasImages = files.some((f) => !f.contentType.startsWith('video/'));
    const hasVideos = files.some((f) => f.contentType.startsWith('video/'));
    return [
      { id: 'ALL', label: 'All' },
      ...(hasImages ? [{ id: 'IMAGE', label: 'Images' }] : []),
      ...(hasVideos ? [{ id: 'VIDEO', label: 'Videos' }] : []),
    ];
  }, [files]);

  const visibleFiles = useMemo(() => {
    const filtered =
      kindFilter === 'ALL'
        ? files
        : files.filter((f) =>
            kindFilter === 'VIDEO'
              ? f.contentType.startsWith('video/')
              : !f.contentType.startsWith('video/'),
          );
    return sortLibraryItems(
      filtered,
      sort,
      (f) => f.filename,
      (f) => f.createdAt,
    );
  }, [files, kindFilter, sort]);

  const remove = async (file: UserMediaFile) => {
    const previous = files;
    setFiles((current) => current.filter((item) => item.id !== file.id));
    const result = await deleteUserMedia(file.id);
    if (!result.ok) {
      setFiles(previous);
      toast.error(result.error);
      return;
    }
    toast.success('Media file removed.');
  };

  return (
    <StudioPanel
      title="Media files"
      description="Background images and videos stored in your Cloudflare R2 media library."
    >
      {loading ? (
        <PageLoading label="Loading media…" />
      ) : loadError && files.length === 0 ? (
        <PageError
          title="Could not load your media files"
          description={loadError}
          onRetry={() => void reload()}
        />
      ) : files.length === 0 ? (
        <PageEmpty title="No media files yet. Add background images or a Video loop backdrop from Artist → Branding." />
      ) : (
        <div className="flex flex-col gap-4">
          <LibrarySectionToolbar>
            {kindChips.length > 2 ? (
              <FilterChips
                items={kindChips}
                selected={kindFilter}
                onChange={setKindFilter}
                aria-label="Filter media by type"
              />
            ) : null}
            {files.length > 1 ? (
              <LibrarySortSelect
                value={sort}
                onChange={setSort}
                label="Sort media files"
              />
            ) : null}
          </LibrarySectionToolbar>
          {visibleFiles.length === 0 ? (
            <PageEmpty
              title="No media files match this filter"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setKindFilter('ALL')}
                >
                  Clear filter
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFiles.map((file) => {
                const isVideo = file.contentType.startsWith('video/');
                return (
                  <article
                    key={file.id}
                    className="border-border overflow-hidden rounded-lg border"
                  >
                    <div className="bg-background-secondary relative aspect-video">
                      {isVideo ? (
                        <video
                          src={file.url}
                          controls
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageReveal
                          src={file.url}
                          alt=""
                          className="h-full w-full"
                        />
                      )}
                      <Badge
                        variant="pill"
                        color="secondary"
                        className="bg-background/80 absolute top-2 left-2 text-[10px] uppercase backdrop-blur-sm"
                      >
                        {isVideo ? (
                          <VideoIcon
                            size={12}
                            className="mr-1 inline"
                            aria-hidden
                          />
                        ) : (
                          <ImageIcon
                            size={12}
                            className="mr-1 inline"
                            aria-hidden
                          />
                        )}
                        {isVideo ? 'Video' : 'Image'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {file.filename}
                        </p>
                        <p className="text-foreground-secondary text-xs">
                          {formatBytes(file.sizeBytes)}
                        </p>
                      </div>
                      <Tooltip content="Open preview" side="top">
                        <ExternalLink
                          href={file.url}
                          aria-label={`Open ${file.filename}`}
                          className="text-foreground-secondary no-underline"
                        >
                          <PlayIcon size={16} aria-hidden />
                        </ExternalLink>
                      </Tooltip>
                      <Tooltip content={`Remove ${file.filename}`} side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={`Remove ${file.filename}`}
                          onClick={() => setPendingRemove(file)}
                        >
                          <Trash2Icon
                            size={16}
                            className="text-accent-red-strong"
                            aria-hidden
                          />
                        </Button>
                      </Tooltip>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={
          pendingRemove
            ? `Remove ${pendingRemove.filename} from your media files?`
            : 'Remove media file?'
        }
        description="The file is deleted from your media library."
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const file = pendingRemove;
          setPendingRemove(null);
          if (!file) {
            return;
          }
          void remove(file);
        }}
      />
    </StudioPanel>
  );
}

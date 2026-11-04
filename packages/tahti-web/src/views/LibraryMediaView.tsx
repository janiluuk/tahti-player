import { PlayIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
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
import { LibraryFilteredEmpty } from '../components/library/LibraryFilteredEmpty';
import { LibraryItemRow } from '../components/library/LibraryItemRow';
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
  const { t } = useTranslation('web');
  const [files, setFiles] = useState<UserMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<UserMediaFile | null>(
    null,
  );
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [query, setQuery] = useState('');
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
      { id: 'ALL', label: t('library.mediaChipAll') },
      ...(hasImages
        ? [{ id: 'IMAGE', label: t('library.mediaChipImages') }]
        : []),
      ...(hasVideos
        ? [{ id: 'VIDEO', label: t('library.mediaChipVideos') }]
        : []),
    ];
  }, [files, t]);

  const visibleFiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = files.filter((f) => {
      if (
        kindFilter !== 'ALL' &&
        (kindFilter === 'VIDEO') !== f.contentType.startsWith('video/')
      ) {
        return false;
      }
      return !needle || f.filename.toLowerCase().includes(needle);
    });
    return sortLibraryItems(
      filtered,
      sort,
      (f) => f.filename,
      (f) => f.createdAt,
    );
  }, [files, kindFilter, query, sort]);

  const remove = async (file: UserMediaFile) => {
    const previous = files;
    setFiles((current) => current.filter((item) => item.id !== file.id));
    const result = await deleteUserMedia(file.id);
    if (!result.ok) {
      setFiles(previous);
      toast.error(result.error);
      return;
    }
    toast.success(t('toasts.mediaRemoved'));
  };

  return (
    <StudioPanel
      title={t('library.mediaTitle')}
      description={t('library.mediaDescription')}
    >
      {loading ? (
        <PageLoading label={t('library.mediaLoading')} />
      ) : loadError && files.length === 0 ? (
        <PageError
          title={t('library.mediaLoadError')}
          description={loadError}
          onRetry={() => void reload()}
        />
      ) : files.length === 0 ? (
        <PageEmpty
          title={t('library.mediaEmptyTitle')}
          description={t('library.mediaEmptyDescription')}
          action={
            <ButtonLink to="/studio/branding" size="sm" variant="secondary">
              {t('library.mediaOpenBranding')}
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <LibrarySectionToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder={t('library.mediaSearchPlaceholder')}
            searchLabel={t('library.mediaSearchLabel')}
          >
            {kindChips.length > 2 ? (
              <FilterChips
                items={kindChips}
                selected={kindFilter}
                onChange={setKindFilter}
                aria-label={t('library.mediaFilterAria')}
              />
            ) : null}
            {files.length > 1 ? (
              <LibrarySortSelect
                value={sort}
                onChange={setSort}
                label={t('library.mediaSortLabel')}
              />
            ) : null}
          </LibrarySectionToolbar>
          {visibleFiles.length === 0 ? (
            <LibraryFilteredEmpty
              noun={t('library.mediaNoun')}
              query={query}
              filtered={kindFilter !== 'ALL'}
              onClear={() => {
                setQuery('');
                setKindFilter('ALL');
              }}
            />
          ) : (
            <ul className="divide-border divide-y">
              {visibleFiles.map((file) => {
                const isVideo = file.contentType.startsWith('video/');
                return (
                  <li key={file.id}>
                    <LibraryItemRow
                      artwork={
                        isVideo ? (
                          <video
                            src={file.url}
                            controls
                            className="border-border h-16 w-28 rounded-md border object-cover"
                          />
                        ) : (
                          <ImageReveal
                            src={file.url}
                            alt=""
                            className="border-border size-16 rounded-md border object-cover"
                          />
                        )
                      }
                      title={file.filename}
                      subtitle={`${isVideo ? t('library.mediaKindVideo') : t('library.mediaKindImage')} · ${formatBytes(file.sizeBytes)}`}
                      actions={
                        <>
                          <Tooltip
                            content={t('library.mediaPreview')}
                            side="top"
                          >
                            <ExternalLink
                              href={file.url}
                              aria-label={t('library.mediaOpenAria', {
                                name: file.filename,
                              })}
                              className="text-foreground-secondary no-underline"
                            >
                              <PlayIcon size={16} aria-hidden />
                            </ExternalLink>
                          </Tooltip>
                          <Tooltip
                            content={t('library.mediaRemoveAria', {
                              name: file.filename,
                            })}
                            side="top"
                          >
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={t('library.mediaRemoveAria', {
                                name: file.filename,
                              })}
                              onClick={() => setPendingRemove(file)}
                            >
                              <Trash2Icon
                                size={16}
                                className="text-accent-red-strong"
                                aria-hidden
                              />
                            </Button>
                          </Tooltip>
                        </>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        destructive
        title={
          pendingRemove
            ? t('library.mediaRemoveNamed', { name: pendingRemove.filename })
            : t('library.mediaRemoveTitle')
        }
        description={t('library.mediaRemoveDescription')}
        confirmLabel={t('actions.remove')}
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

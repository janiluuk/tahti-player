import { Link, useSearch } from '@tanstack/react-router';
import {
  BarChart3Icon,
  Disc3Icon,
  DiscAlbumIcon,
  ExternalLinkIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  CopyButton,
  Dialog,
  EditIconLink,
  ExternalLink,
  FilterChips,
  Input,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createStudioRelease,
  deleteStudioRelease,
  fetchStudioReleases,
  patchStudioReleaseVisual,
} from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { SourceServiceIcon } from '../../components/SourceServiceIcon';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { resolveNewReleaseVisualizer } from '../../lib/releaseVisualizer';
import { toastWithUndo } from '../../lib/undoToast';
import { ReleaseCsvImportButton } from './ReleaseCsvImportButton';
import { ReleasePinButton } from './ReleasePinButton';

const RELEASE_TYPE_DEFS = [
  {
    id: 'SINGLE',
    labelKey: 'studioReleases.typeSingle',
    icon: <DiscAlbumIcon size={18} aria-hidden />,
  },
  {
    id: 'EP',
    labelKey: 'studioReleases.typeEp',
    icon: <DiscAlbumIcon size={18} aria-hidden />,
  },
  {
    id: 'ALBUM',
    labelKey: 'studioReleases.typeAlbum',
    icon: <Disc3Icon size={18} aria-hidden />,
  },
  {
    id: 'COMPILATION',
    labelKey: 'studioReleases.typeCompilation',
    icon: <LibraryIcon size={18} aria-hidden />,
  },
] as const;

export function StudioReleasesView() {
  const { t } = useTranslation('web');
  const releaseTypes = RELEASE_TYPE_DEFS.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    icon: item.icon,
  }));
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('SINGLE');
  const [releaseDate, setReleaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const search = useSearch({ strict: false }) as { create?: boolean };

  useEffect(() => {
    if (search.create) {
      setCreateOpen(true);
    }
  }, [search.create]);

  const reload = () => {
    void fetchStudioReleases().then((res) => {
      setReleases(res.data.releases);
      setLoadError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredReleases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return releases;
    }
    return releases.filter((release) =>
      release.title.toLowerCase().includes(needle),
    );
  }, [releases, query]);

  const closeCreate = () => {
    setCreateOpen(false);
    setTitle('');
    setType('SINGLE');
    setReleaseDate(new Date().toISOString().slice(0, 10));
    setCreating(false);
  };

  const create = async () => {
    setCreating(true);
    const r = await createStudioRelease({
      title: title.trim(),
      type,
      releaseDate,
    });
    setCreating(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    const visualResult = await patchStudioReleaseVisual(
      r.data.id,
      resolveNewReleaseVisualizer(),
    );
    if (!visualResult.ok) {
      toast.error(i18n.t('web:toasts.releaseCreatedVisualizerFailed'));
    }
    const created = r.data;
    toastWithUndo(t('studioReleases.createdToast', { title: created.title }), {
      undo: () => deleteStudioRelease(created.id),
      undoneMessage: t('studioReleases.removedToast', { title: created.title }),
      onUndone: () =>
        setReleases((current) =>
          current.filter((release) => release.id !== created.id),
        ),
    });
    closeCreate();
    reload();
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioReleases.title')}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <div className="flex items-center gap-2">
              <Tooltip content={t('studioReleases.distribution')} side="top">
                <ButtonLink
                  to="/studio/distribution"
                  size="icon-sm"
                  variant="text"
                  aria-label={t('studioReleases.distribution')}
                >
                  <Share2Icon size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
              <ReleaseCsvImportButton onImported={reload} />
              <Tooltip content={t('studioReleases.newRelease')} side="top">
                <Button
                  size="icon-sm"
                  onClick={() => setCreateOpen(true)}
                  aria-label={t('studioReleases.newRelease')}
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </div>
          }
        >
          <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <PlusIcon size={18} aria-hidden />
                  {t('studioReleases.newRelease')}
                </span>
              </Dialog.Title>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label={t('studioReleases.fieldTitle')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                <FilterChips
                  items={releaseTypes}
                  selected={type}
                  onChange={setType}
                  aria-label={t('studioReleases.releaseType')}
                />
                <Input
                  type="date"
                  label={t('studioReleases.releaseDate')}
                  value={releaseDate}
                  onChange={(event) => setReleaseDate(event.target.value)}
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
                <Button
                  type="submit"
                  disabled={creating || !title.trim() || !releaseDate}
                >
                  <PlusIcon size={16} aria-hidden className="mr-1.5" />
                  {creating
                    ? t('studioReleases.creating')
                    : t('studioReleases.create')}
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel>
            {loading ? (
              <PageLoading label={t('settingsBody.loading')} />
            ) : loadError && releases.length === 0 ? (
              <PageError
                title={t('studioReleases.loadError')}
                description={loadError}
                onRetry={() => {
                  setLoading(true);
                  reload();
                }}
              />
            ) : releases.length === 0 ? (
              <PageEmpty
                title={t('studioReleases.emptyTitle')}
                description={t('studioReleases.emptyDescription')}
                action={
                  <Tooltip content={t('studioReleases.newRelease')} side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => setCreateOpen(true)}
                      aria-label={t('studioReleases.newRelease')}
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : (
              <>
                <div className="mb-4 max-w-sm">
                  <Input
                    enterKeyHint="search"
                    size="sm"
                    tone="secondary"
                    type="search"
                    aria-label={t('studioReleases.searchAria')}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('studioReleases.searchPlaceholder')}
                    startAddon={
                      <SearchIcon
                        size={14}
                        aria-hidden
                        className="opacity-70"
                      />
                    }
                  />
                </div>
                {filteredReleases.length === 0 ? (
                  <PageEmpty
                    title={t('studioReleases.noMatch', {
                      query: query.trim(),
                    })}
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setQuery('')}
                      >
                        {t('actions.clearSearch')}
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-border divide-y">
                    {filteredReleases.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/studio/releases/$id"
                            params={{ id: r.id }}
                            className="font-medium hover:underline"
                          >
                            {r.title}
                          </Link>
                          <p className="text-foreground-secondary truncate text-xs">
                            {r.type}, {r.state}
                            {typeof r._count?.tracks === 'number'
                              ? `, ${t('studioReleases.tracksCount', { count: r._count.tracks })}`
                              : ''}
                            {r.pinnedAt
                              ? `, ${t('studioReleases.pinnedToProfile')}`
                              : ''}
                            {' · '}
                            <code className="text-foreground-secondary">
                              /r/{r.smartLinkSlug}
                            </code>
                          </p>
                        </div>
                        <EditIconLink
                          to="/studio/releases/$id"
                          params={{ id: r.id }}
                          search={{ edit: true }}
                          label={t('studioReleases.editItem', {
                            title: r.title,
                          })}
                        />
                        <Tooltip content={t('studioReleases.stats')} side="top">
                          <ButtonLink
                            to="/studio/releases/$id"
                            params={{ id: r.id }}
                            search={{ tab: 'stats' }}
                            size="icon-sm"
                            variant="text"
                            aria-label={t('studioReleases.statsFor', {
                              title: r.title,
                            })}
                          >
                            <BarChart3Icon size={16} aria-hidden />
                          </ButtonLink>
                        </Tooltip>
                        <CopyButton
                          text={`${window.location.origin}/r/${r.smartLinkSlug}`}
                          size="icon-sm"
                          variant="text"
                          aria-label={t('studioReleases.copySmartlink', {
                            title: r.title,
                          })}
                        />
                        {r.smartLinkTargets?.bandcamp ? (
                          <Tooltip
                            content={t('studioReleases.openBandcamp')}
                            side="top"
                          >
                            <ExternalLink
                              href={r.smartLinkTargets.bandcamp}
                              className="border-border size-8 justify-center overflow-hidden rounded border no-underline"
                              aria-label={t('studioReleases.openBandcampItem', {
                                title: r.title,
                              })}
                            >
                              <SourceServiceIcon id="bandcamp" size="detail" />
                            </ExternalLink>
                          </Tooltip>
                        ) : null}
                        <Tooltip
                          content={
                            openMoreId === r.id
                              ? t('actions.less')
                              : t('actions.more')
                          }
                          side="top"
                        >
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label={t('studioReleases.moreFor', {
                              action:
                                openMoreId === r.id
                                  ? t('actions.less')
                                  : t('actions.more'),
                              title: r.title,
                            })}
                            onClick={() =>
                              setOpenMoreId((id) => (id === r.id ? null : r.id))
                            }
                          >
                            <MoreHorizontalIcon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        {openMoreId === r.id && (
                          <div className="flex w-full flex-wrap gap-2 pt-1">
                            <ReleasePinButton
                              release={r}
                              onChange={(pinnedAt) =>
                                setReleases((list) =>
                                  list.map((x) =>
                                    x.id === r.id ? { ...x, pinnedAt } : x,
                                  ),
                                )
                              }
                            />
                            <Tooltip
                              content={t('studioReleases.publicLink')}
                              side="top"
                            >
                              <ButtonLink
                                to="/r/$slug"
                                params={{ slug: r.smartLinkSlug }}
                                size="icon-sm"
                                variant="text"
                                aria-label={t('studioReleases.publicLinkAria')}
                              >
                                <ExternalLinkIcon size={16} aria-hidden />
                              </ButtonLink>
                            </Tooltip>
                            <Tooltip
                              content={t('studioReleases.distribution')}
                              side="top"
                            >
                              <ButtonLink
                                to="/studio/distribution"
                                size="icon-sm"
                                variant="text"
                                aria-label={t(
                                  'studioReleases.distributionAria',
                                )}
                              >
                                <Share2Icon size={16} aria-hidden />
                              </ButtonLink>
                            </Tooltip>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}

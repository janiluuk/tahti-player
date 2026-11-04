import { AudioLinesIcon, FolderOpenIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Dialog,
  Input,
  Select,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createEditorProject,
  deleteEditorProject,
  fetchEditorProjects,
  fetchStudioSounds,
} from '../../api/studio';
import type { EditorProjectRow, StudioSound } from '../../api/studio-types';
import { ListingDate } from '../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { contentTypeLabel } from '../../content/contentTypes';
import { toastWithUndo } from '../../lib/undoToast';

export function StudioEditorListView() {
  const { t } = useTranslation('web');
  const [projects, setProjects] = useState<EditorProjectRow[]>([]);
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [soundId, setSoundItemId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [soundsError, setSoundsError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryType, setLibraryType] = useState('ALL');
  const [libraryQuery, setLibraryQuery] = useState('');

  const libraryTypes = useMemo(() => {
    const types = new Set(
      sounds
        .map((item) => item.contentType?.trim().toUpperCase())
        .filter((type): type is string => Boolean(type)),
    );
    return ['ALL', ...Array.from(types).sort()];
  }, [sounds]);

  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    return sounds.filter((item) => {
      const matchesType =
        libraryType === 'ALL' ||
        item.contentType?.toUpperCase() === libraryType;
      const matchesQuery =
        !query ||
        [item.title, item.artistName, item.genre, item.contentType]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [sounds, libraryQuery, libraryType]);

  const formatLibraryType = (type: string) =>
    type === 'ALL' ? t('studioEditorList.allTypes') : contentTypeLabel(type);

  const reload = () => {
    void Promise.all([fetchEditorProjects(), fetchStudioSounds()]).then(
      ([p, a]) => {
        setProjects(p.data);
        setSounds(a.data.filter((item) => !item.embedProvider));
        setLoadError(p.meta.source === 'api' ? (p.meta.reason ?? null) : null);
        setSoundsError(
          a.meta.source === 'api' ? (a.meta.reason ?? null) : null,
        );
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setTitle('');
    setSoundItemId('');
    setBusy(false);
  };

  const submitCreate = () => {
    if (busy) {
      return;
    }
    setBusy(true);
    createEditorProject({
      title: title || undefined,
      soundId: soundId || undefined,
    })
      .then((r) => {
        setBusy(false);
        if (!r.ok) {
          setMessage(r.error);
          return;
        }
        const created = r.data;
        setMessage(
          t('studioEditorList.createdNamed', { title: created.title }),
        );
        closeCreate();
        reload();
        toastWithUndo(
          t('studioEditorList.createdNamedPeriod', { title: created.title }),
          {
            undo: () => deleteEditorProject(created.id),
            undoneMessage: t('studioEditorList.removedNamed', {
              title: created.title,
            }),
            onUndone: () => {
              setMessage(null);
              setProjects((current) =>
                current.filter((project) => project.id !== created.id),
              );
            },
          },
        );
      })
      .catch(() => {
        setBusy(false);
        setMessage(t('studioEditorList.createFailed'));
      });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioEditorList.title')}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            projects.length > 0 && (
              <Tooltip content={t('studioEditorList.newSession')} side="top">
                <Button
                  size="icon-sm"
                  onClick={() => {
                    setMessage(null);
                    setCreateOpen(true);
                  }}
                  aria-label={t('studioEditorList.newSession')}
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            )
          }
        >
          {message && (
            <p className="text-foreground-secondary text-xs" role="status">
              {message}
            </p>
          )}

          <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <AudioLinesIcon size={18} aria-hidden />
                  {t('studioEditorList.newSession')}
                </span>
              </Dialog.Title>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label={t('studioEditorList.titleLabel')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('studioEditorList.titlePlaceholder')}
                  autoFocus
                />
                <Select
                  label={t('studioEditorList.seedLabel')}
                  value={soundId}
                  onValueChange={setSoundItemId}
                  placeholder={t('studioEditorList.seedNone')}
                  options={sounds.map((item) => ({
                    id: item.id,
                    label: item.title,
                  }))}
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
                <Button type="submit" disabled={busy}>
                  <PlusIcon size={16} aria-hidden className="mr-1.5" />
                  {busy
                    ? t('studioEditorList.creating')
                    : t('studioEditorList.create')}
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel title={t('studioEditorList.projectsTitle')}>
            {loadError && projects.length > 0 ? (
              <PageErrorBanner
                title={t('studioEditorList.refreshError')}
                description={loadError}
                onRetry={reload}
              />
            ) : null}
            {loading ? (
              <PageLoading label={t('studioEditorList.loading')} />
            ) : loadError && projects.length === 0 ? (
              <PageError
                title={t('studioEditorList.loadError')}
                description={loadError}
                onRetry={() => {
                  setLoading(true);
                  reload();
                }}
              />
            ) : projects.length === 0 ? (
              <PageEmpty
                title={t('studioEditorList.emptyTitle')}
                action={
                  <Tooltip
                    content={t('studioEditorList.newSession')}
                    side="top"
                  >
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => setCreateOpen(true)}
                      aria-label={t('studioEditorList.newSession')}
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : (
              <ul className="divide-border divide-y">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs">
                        <span>{t('studioEditorList.updated')}</span>
                        <ListingDate value={p.updatedAt} />
                        {p.soundId ? (
                          <span>{t('studioEditorList.linkedSound')}</span>
                        ) : null}
                      </p>
                    </div>
                    <Tooltip
                      content={t('studioEditorList.openSession')}
                      side="top"
                    >
                      <ButtonLink
                        to="/studio/editor/$id"
                        params={{ id: p.id }}
                        size="icon-sm"
                        variant="secondary"
                        aria-label={t('studioEditorList.openNamed', {
                          title: p.title,
                        })}
                      >
                        <FolderOpenIcon size={16} aria-hidden />
                      </ButtonLink>
                    </Tooltip>
                    {p.soundId && (
                      <Tooltip
                        content={t('studioEditorList.proEditor')}
                        side="top"
                      >
                        <ButtonLink
                          to="/studio/sounds/$id/editor"
                          params={{ id: p.soundId }}
                          size="icon-sm"
                          variant="text"
                          aria-label={t('studioEditorList.proEditor')}
                        >
                          <AudioLinesIcon size={16} aria-hidden />
                        </ButtonLink>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>

          <StudioPanel
            title={t('studioEditorList.openFromLibrary')}
            description={t('studioEditorList.openFromLibraryDescription')}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setLibraryType('ALL');
                setLibraryQuery('');
                setLibraryOpen(true);
              }}
            >
              <FolderOpenIcon size={16} aria-hidden className="mr-1.5" />
              {t('studioEditorList.openFromLibrary')}
            </Button>
          </StudioPanel>

          <Dialog.Root
            isOpen={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            className="max-w-4xl"
          >
            <Dialog.Title>{t('studioEditorList.openFromLibrary')}</Dialog.Title>
            <Dialog.Description>
              {t('studioEditorList.libraryDialogDescription')}
            </Dialog.Description>
            <div className="mt-4 grid min-h-[22rem] gap-4 md:grid-cols-[12rem_1fr]">
              <Tabs.Root
                vertical
                selectedIndex={Math.max(0, libraryTypes.indexOf(libraryType))}
                onChange={(index) => {
                  const next = libraryTypes[index];
                  if (next) {
                    setLibraryType(next);
                  }
                }}
                className="min-w-0"
                listClassName="border-border flex-row gap-1 overflow-x-auto border-b pb-2 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:pr-3 md:pb-0"
                tabClassName="shrink-0 justify-start px-3 py-2 text-left data-[selected]:bg-primary data-[selected]:text-primary-foreground"
              >
                <Tabs.List
                  aria-label={t('studioEditorList.libraryTypesAria')}
                  className="w-auto"
                >
                  {libraryTypes.map((type) => (
                    <Tabs.Tab key={type}>{formatLibraryType(type)}</Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>
              <div className="flex min-w-0 flex-col gap-3">
                <Input
                  enterKeyHint="search"
                  type="search"
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder={t('studioEditorList.searchLibrary')}
                  aria-label={t('studioEditorList.searchLibraryAria')}
                />
                {soundsError && sounds.length > 0 ? (
                  <PageErrorBanner
                    title={t('studioEditorList.libraryRefreshError')}
                    description={soundsError}
                    onRetry={reload}
                  />
                ) : null}
                {soundsError && sounds.length === 0 ? (
                  <PageError
                    title={t('studioEditorList.libraryLoadError')}
                    description={soundsError}
                    onRetry={reload}
                  />
                ) : filteredLibrary.length === 0 ? (
                  <PageEmpty
                    title={
                      sounds.length === 0
                        ? t('studioEditorList.libraryEmptyUpload')
                        : t('studioEditorList.libraryEmptyFilter')
                    }
                  />
                ) : (
                  <ul className="border-border divide-border max-h-[20rem] divide-y overflow-y-auto rounded-md border">
                    {filteredLibrary.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="text-foreground-secondary truncate text-xs">
                            {item.artistName ||
                              t('studioEditorList.unknownArtist')}
                            {item.genre ? ` · ${item.genre}` : ''}
                          </p>
                        </div>
                        <ButtonLink
                          to="/studio/sounds/$id/editor"
                          params={{ id: item.id }}
                          onClick={() => setLibraryOpen(false)}
                          size="sm"
                          variant="secondary"
                        >
                          <AudioLinesIcon
                            size={14}
                            aria-hidden
                            className="mr-1.5"
                          />
                          {t('studioEditorList.open')}
                        </ButtonLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Dialog.Root>
        </ViewShell>
      </div>
    </StudioGate>
  );
}

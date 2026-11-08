import { Link } from '@tanstack/react-router';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  FilterIcon,
  GripVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  Wand2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Dialog,
  InlineError,
  Input,
  SaveButton,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import {
  addStudioReleaseTrack,
  patchStudioRelease,
  removeStudioReleaseTrack,
  reorderStudioReleaseTracks,
} from '../../../api/studio';
import type {
  StudioRelease,
  StudioReleaseTrack,
  StudioSound,
} from '../../../api/studio-types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import {
  composeDspUrl,
  displayDspPrefix,
  DSP_SERVICES,
  fillAllDspUrls,
  isPluginStreamService,
  loadDspPluginPrefixes,
  prefixesForServices,
} from '../../../lib/dspPluginDefaults';
import { toastWithUndo } from '../../../lib/undoToast';
import { NewReleaseTrackUploadDialog } from './NewReleaseTrackUploadDialog';
import { ReleaseTrackAudioUpload } from './ReleaseTrackAudioUpload';
import { ReleaseTrackRow } from './ReleaseTrackRow';
import { useReleaseTrackProcessingPoll } from './useReleaseTrackProcessingPoll';

export function ReleaseSmartLinksPanel({
  release,
  sounds,
  onTargetsSaved,
  onReleaseChange,
}: {
  release: StudioRelease;
  /** The user's library, loaded once by the parent view. */
  sounds: StudioSound[];
  onTargetsSaved: (targets: Record<string, string>) => void;
  onReleaseChange: (release: StudioRelease) => void;
}) {
  const { t } = useTranslation('web');
  const [targets, setTargets] = useState<Record<string, string>>(
    release.smartLinkTargets ?? {},
  );
  const [tracks, setTracks] = useState(release.tracks ?? []);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [newUploadOpen, setNewUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('ALL');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [pluginPrefixes, setPluginPrefixes] = useState<Record<string, string>>(
    {},
  );
  const [fillSlug, setFillSlug] = useState('');
  const [pendingRemoveTrack, setPendingRemoveTrack] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Split so a tracklist refresh doesn't wipe unsaved destination edits.
  useEffect(() => {
    setTargets(release.smartLinkTargets ?? {});
  }, [release.smartLinkTargets]);
  useEffect(() => {
    setTracks(release.tracks ?? []);
  }, [release.tracks]);

  // Uploads finish long after they start; read the latest release, not the
  // one captured when the upload began.
  const releaseRef = useRef(release);
  releaseRef.current = release;
  const updateTracks = (
    change: (current: StudioReleaseTrack[]) => StudioReleaseTrack[],
  ) => {
    const latest = releaseRef.current;
    const next = change(latest.tracks ?? []);
    releaseRef.current = { ...latest, tracks: next };
    setTracks(next);
    onReleaseChange(releaseRef.current);
  };
  const patchTrack = (trackId: string, patch: Partial<StudioReleaseTrack>) =>
    updateTracks((current) =>
      current.map((track) =>
        track.id === trackId ? { ...track, ...patch } : track,
      ),
    );

  useReleaseTrackProcessingPoll(release.id, tracks, (updates) =>
    updateTracks((current) =>
      current.map((track) => {
        const update = updates.get(track.id);
        return update ? { ...track, ...update } : track;
      }),
    ),
  );

  useEffect(() => {
    void loadDspPluginPrefixes().then(setPluginPrefixes);
  }, []);

  const soundById = useMemo(
    () => new Map(sounds.map((sound) => [sound.id, sound])),
    [sounds],
  );

  const filteredSounds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sounds.filter((item) => {
      const matchesType =
        contentType === 'ALL' || item.contentType === contentType;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.artistName, item.genre, item.contentType]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [sounds, contentType, query]);

  const saveTargets = async () => {
    const cleaned = Object.fromEntries(
      DSP_SERVICES.map((service) => {
        const raw = targetValue(service.key).trim();
        const url = /^https?:\/\//i.test(raw)
          ? raw
          : isPluginStreamService(service.key)
            ? ''
            : composeDspUrl(dspPrefixes[service.key] ?? '', raw);
        return [service.key, url] as const;
      }).filter(([, url]) => url),
    );
    const result = await patchStudioRelease(release.id, {
      smartLinkTargets: cleaned,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onTargetsSaved(cleaned);
    toast.success(i18n.t('web:toasts.smartLinksSaved'));
  };

  const moveTrack = async (trackId: string, targetId: string) => {
    if (trackId === targetId || reordering) {
      return;
    }
    const from = tracks.findIndex((track) => track.id === trackId);
    const to = tracks.findIndex((track) => track.id === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(to, 0, moved);
    setReordering(true);
    let result;
    try {
      result = await reorderStudioReleaseTracks(
        release.id,
        next.map((track) => track.id),
      );
    } catch {
      toast.error(i18n.t('web:toasts.couldNotReorderTracks'));
      return;
    } finally {
      setReordering(false);
    }
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTracks(next.map((track, index) => ({ ...track, position: index + 1 })));
    onReleaseChange({
      ...release,
      tracks: next.map((track, index) => ({ ...track, position: index + 1 })),
    });
  };

  const removeTrack = async (trackId: string) => {
    const result = await removeStudioReleaseTrack(release.id, trackId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const next = tracks.filter((track) => track.id !== trackId);
    setTracks(next.map((track, index) => ({ ...track, position: index + 1 })));
    onReleaseChange({
      ...release,
      tracks: next.map((track, index) => ({ ...track, position: index + 1 })),
    });
    toast.success(i18n.t('web:toasts.trackRemovedFromRelease'));
  };

  const addSound = async (item: StudioSound) => {
    if (tracks.some((track) => track.soundId === item.id)) {
      return;
    }
    const result = await addStudioReleaseTrack(release.id, {
      title: item.title,
      soundId: item.id,
      durationSec: item.durationSec,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const created = result.data;
    const next = [...tracks, created];
    setTracks(next);
    onReleaseChange({ ...release, tracks: next });
    toastWithUndo(`${item.title} added to release.`, {
      undo: () => removeStudioReleaseTrack(release.id, created.id),
      undoneMessage: `${item.title} removed from the release.`,
      onUndone: () => {
        const without = next.filter((track) => track.id !== created.id);
        setTracks(without);
        onReleaseChange({ ...release, tracks: without });
      },
    });
  };

  const dspPrefixes = prefixesForServices(pluginPrefixes);
  const missingPluginDsps = DSP_SERVICES.filter(
    (service) =>
      isPluginStreamService(service.key) && !pluginPrefixes[service.key],
  );

  const targetValue = (key: string) => targets[key] ?? '';
  const emptyEnabledDsps = DSP_SERVICES.filter(
    (service) => dspPrefixes[service.key] && !targetValue(service.key).trim(),
  );
  const updateTarget = (key: string, value: string) =>
    setTargets((current) => ({ ...current, [key]: value }));

  const fillAllFromPlugins = () => {
    const filled = fillAllDspUrls(dspPrefixes, fillSlug);
    Object.entries(filled).forEach(([key, url]) => updateTarget(key, url));
  };

  const addTrackButtons = (centered: boolean) => (
    <div className={`flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
      <Button
        className="gap-1.5"
        variant="secondary"
        onClick={() => setLibraryOpen(true)}
      >
        <PlusIcon size={16} aria-hidden />{' '}
        {t('smartLinks.addTracksFromLibrary')}
      </Button>
      <Button
        className="gap-1.5"
        variant="secondary"
        onClick={() => setNewUploadOpen(true)}
      >
        <UploadIcon size={16} aria-hidden /> {t('smartLinks.uploadANewTrack')}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <StudioPanel
        title={t('smartLinks.smartLinkDestinations')}
        description={t('smartLinks.spotifyAndSoundcloudUseThe')}
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            fillAllFromPlugins();
          }}
        >
          <Input
            label={t('smartLinks.pathForEveryService')}
            placeholder="polar-nights"
            value={fillSlug}
            onChange={(event) => setFillSlug(event.target.value)}
            description={t('smartLinks.spotifyAndSoundcloudCopyYour')}
          />
          <Button
            variant="secondary"
            type="submit"
            disabled={Object.keys(dspPrefixes).length === 0}
          >
            <Wand2Icon size={14} aria-hidden className="mr-1.5" />
            {t('smartLinks.fillAll')}
          </Button>
        </form>
        {missingPluginDsps.length > 0 ? (
          <p className="text-foreground-secondary mt-2 text-xs">
            Set{' '}
            {missingPluginDsps.map((service) => service.label).join(' and ')} in{' '}
            <Link
              to="/settings/$section"
              params={{ section: 'plugin-store' }}
              search={{ category: 'import' }}
              className="underline underline-offset-2"
            >
              {t('smartLinks.addOns')}
            </Link>{' '}
            (import, embed, or export) to use those add-on stream URLs.
          </p>
        ) : null}
        {emptyEnabledDsps.length >= 2 ? (
          <InlineError announce={false} textSize="xs" className="mt-2">
            Missing smart-link URLs:{' '}
            {emptyEnabledDsps.map((service) => service.label).join(', ')}.
          </InlineError>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DSP_SERVICES.map((target) => {
            const prefix = dspPrefixes[target.key];
            const value = targetValue(target.key);
            const pluginStream = isPluginStreamService(target.key);
            const showPrefix = Boolean(
              prefix && !pluginStream && !/^https?:\/\//i.test(value.trim()),
            );
            return (
              <Input
                key={target.key}
                label={target.label}
                placeholder={
                  pluginStream
                    ? prefix || 'https://…'
                    : prefix
                      ? 'slug or full URL'
                      : 'https://…'
                }
                value={value}
                onChange={(event) =>
                  updateTarget(target.key, event.target.value)
                }
                startAddon={
                  showPrefix && prefix ? (
                    <Tooltip
                      content={prefix}
                      side="top"
                      wrapperClassName="min-w-0"
                    >
                      <span className="block truncate">
                        {displayDspPrefix(prefix)}
                      </span>
                    </Tooltip>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SaveButton
            onClick={() => void saveTargets()}
            label={t('smartLinks.saveDestinations')}
          />
          <Tooltip content={`Open ${release.title}`} side="top">
            <ButtonLink
              to="/r/$slug"
              params={{ slug: release.smartLinkSlug }}
              size="icon-sm"
              variant="text"
              aria-label={`Open ${release.title}`}
            >
              <ExternalLinkIcon size={16} aria-hidden />
            </ButtonLink>
          </Tooltip>
          <span className="text-foreground-secondary text-xs">
            {release.smartLinkViewCount ?? 0} views · /r/{release.smartLinkSlug}
          </span>
        </div>
      </StudioPanel>

      <StudioPanel
        title={t('smartLinks.smartLinkPlaylist')}
        description={t('smartLinks.arrangeTheReleaseOrderPlay')}
      >
        {tracks.length === 0 ? (
          <PageEmpty
            title={t('empties.noTracksYet')}
            description={t('empties.addTracksFromYourLibraryOr')}
            action={addTrackButtons(true)}
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {tracks.map((track, index) => (
              <li
                key={track.id}
                draggable
                onDragStart={() => setDraggedId(track.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    void moveTrack(draggedId, track.id);
                  }
                  setDraggedId(null);
                }}
                className="border-border bg-background-secondary/30 flex items-center gap-2 rounded-md border px-2 py-2"
              >
                <GripVerticalIcon
                  size={16}
                  className="text-foreground-secondary shrink-0"
                  aria-label={t('smartLinks.dragToReorder')}
                />
                <span className="text-foreground-secondary w-5 text-xs">
                  {index + 1}
                </span>
                <ul className="min-w-0 flex-1">
                  <ReleaseTrackRow
                    track={track}
                    releaseId={release.id}
                    shopUrl={targets.bandcamp}
                    sound={soundById.get(track.soundId ?? '')}
                  />
                  <li className="mt-1 list-none empty:hidden">
                    <ReleaseTrackAudioUpload
                      releaseId={release.id}
                      track={track}
                      onUploaded={patchTrack}
                    />
                  </li>
                </ul>
                <Tooltip content={t('smartLinks.moveUp')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Move ${track.title} up`}
                    disabled={index === 0 || reordering}
                    onClick={() => {
                      const above = tracks[index - 1];
                      if (above) {
                        void moveTrack(track.id, above.id);
                      }
                    }}
                  >
                    <ArrowUpIcon size={15} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content={t('smartLinks.moveDown')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Move ${track.title} down`}
                    disabled={index === tracks.length - 1 || reordering}
                    onClick={() => {
                      const below = tracks[index + 1];
                      if (below) {
                        void moveTrack(track.id, below.id);
                      }
                    }}
                  >
                    <ArrowDownIcon size={15} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content={t('smartLinks.removeFromRelease')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Remove ${track.title}`}
                    onClick={() =>
                      setPendingRemoveTrack({
                        id: track.id,
                        title: track.title,
                      })
                    }
                  >
                    <Trash2Icon
                      className="text-accent-red"
                      size={15}
                      aria-hidden
                    />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ol>
        )}
        {tracks.length > 0 && (
          <div className="mt-4">{addTrackButtons(false)}</div>
        )}
      </StudioPanel>

      <NewReleaseTrackUploadDialog
        releaseId={release.id}
        isOpen={newUploadOpen}
        onClose={() => setNewUploadOpen(false)}
        onTrackCreated={(track) =>
          updateTracks((current) => [...current, track])
        }
        onUploaded={patchTrack}
      />

      <Dialog.Root isOpen={libraryOpen} onClose={() => setLibraryOpen(false)}>
        <Dialog.Title>{t('smartLinks.addTracksFromLibrary')}</Dialog.Title>
        <Dialog.Description>
          {t('smartLinks.searchYourSoundsAndAdd')}
        </Dialog.Description>
        <div className="flex flex-wrap gap-2 py-3">
          <Input
            enterKeyHint="search"
            type="search"
            label={t('smartLinks.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label={t('smartLinks.type')}
            value={contentType}
            onValueChange={setContentType}
            options={[
              { id: 'ALL', label: 'All content' },
              ...[
                ...new Set(
                  sounds.map((item) => item.contentType).filter(Boolean),
                ),
              ].map((type) => ({ id: type ?? '', label: type ?? '' })),
            ]}
          />
          <SearchIcon
            size={16}
            className="text-foreground-secondary mt-7"
            aria-hidden
          />
          <FilterIcon
            size={16}
            className="text-foreground-secondary mt-7"
            aria-hidden
          />
        </div>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {filteredSounds.map((item) => {
            const alreadyAdded = tracks.some(
              (track) => track.soundId === item.id,
            );
            return (
              <Button
                key={item.id}
                type="button"
                variant="secondary"
                disabled={alreadyAdded}
                onClick={() => void addSound(item)}
                className="h-auto w-full justify-start gap-2 px-3 py-2 text-left text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="text-foreground-secondary text-xs">
                  {item.contentType ?? 'Track'}
                </span>
                {alreadyAdded ? (
                  <span className="text-xs">{t('smartLinks.added')}</span>
                ) : (
                  <PlusIcon size={15} aria-hidden />
                )}
              </Button>
            );
          })}
          {filteredSounds.length === 0 && (
            <PageEmpty
              title={
                query.trim()
                  ? `No library items match “${query.trim()}”.`
                  : 'No library items match.'
              }
              action={
                query.trim() || contentType !== 'ALL' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuery('');
                      setContentType('ALL');
                    }}
                  >
                    {t('smartLinks.clearSearch')}
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('smartLinks.done')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingRemoveTrack !== null}
        title={
          pendingRemoveTrack
            ? t('releaseSmartLinks.removeTitleNamed', {
                title: pendingRemoveTrack.title,
              })
            : t('releaseSmartLinks.removeTitle')
        }
        description={t('releaseSmartLinks.removeDescription')}
        confirmLabel={t('actions.remove')}
        destructive
        onCancel={() => setPendingRemoveTrack(null)}
        onConfirm={() => {
          const track = pendingRemoveTrack;
          setPendingRemoveTrack(null);
          if (!track) {
            return;
          }
          void removeTrack(track.id);
        }}
      />
    </div>
  );
}

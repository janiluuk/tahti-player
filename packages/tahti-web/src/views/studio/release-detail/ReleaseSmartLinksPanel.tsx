import { Link } from '@tanstack/react-router';
import {
  ExternalLinkIcon,
  FilterIcon,
  GripVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Wand2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  EmptyState,
  Input,
  SaveButton,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import {
  addStudioReleaseTrack,
  fetchStudioSounds,
  patchStudioRelease,
  removeStudioReleaseTrack,
  reorderStudioReleaseTracks,
} from '../../../api/studio';
import type { StudioRelease, StudioSound } from '../../../api/studio-types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
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
import { ReleaseTrackRow } from './ReleaseTrackRow';

export function ReleaseSmartLinksPanel({
  release,
  onTargetsSaved,
  onReleaseChange,
}: {
  release: StudioRelease;
  onTargetsSaved: (targets: Record<string, string>) => void;
  onReleaseChange: (release: StudioRelease) => void;
}) {
  const [targets, setTargets] = useState<Record<string, string>>(
    release.smartLinkTargets ?? {},
  );
  const [tracks, setTracks] = useState(release.tracks ?? []);
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('ALL');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pluginPrefixes, setPluginPrefixes] = useState<Record<string, string>>(
    {},
  );
  const [fillSlug, setFillSlug] = useState('');
  const [pendingRemoveTrack, setPendingRemoveTrack] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setTargets(release.smartLinkTargets ?? {});
    setTracks(release.tracks ?? []);
  }, [release]);

  useEffect(() => {
    void fetchStudioSounds().then((result) => setSounds(result.data));
  }, []);

  useEffect(() => {
    void loadDspPluginPrefixes().then(setPluginPrefixes);
  }, []);

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
    toast.success('Smart-link targets saved.');
  };

  const moveTrack = async (trackId: string, targetId: string) => {
    if (trackId === targetId) {
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
    const result = await reorderStudioReleaseTracks(
      release.id,
      next.map((track) => track.id),
    );
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
    toast.success('Track removed from release.');
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
    const next = [...tracks, result.data];
    setTracks(next);
    onReleaseChange({ ...release, tracks: next });
    toast.success(`${item.title} added to release.`);
  };

  const dspPrefixes = prefixesForServices(pluginPrefixes);
  const missingPluginDsps = DSP_SERVICES.filter(
    (service) =>
      isPluginStreamService(service.key) && !pluginPrefixes[service.key],
  );

  const targetValue = (key: string) => targets[key] ?? '';
  const updateTarget = (key: string, value: string) =>
    setTargets((current) => ({ ...current, [key]: value }));

  const fillAllFromPlugins = () => {
    const filled = fillAllDspUrls(dspPrefixes, fillSlug);
    Object.entries(filled).forEach(([key, url]) => updateTarget(key, url));
  };

  return (
    <div className="flex flex-col gap-6">
      <StudioPanel
        title="Smart-link destinations"
        description="Spotify and SoundCloud use the stream URLs from your embed, import, and export plugin settings. Fill all, then edit any link."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Path for every service"
            placeholder="polar-nights"
            value={fillSlug}
            onChange={(event) => setFillSlug(event.target.value)}
            description="Spotify and SoundCloud copy your add-on stream URLs. Other services append this path."
          />
          <Button
            variant="secondary"
            onClick={fillAllFromPlugins}
            disabled={Object.keys(dspPrefixes).length === 0}
          >
            <Wand2Icon size={14} aria-hidden className="mr-1.5" />
            Fill all
          </Button>
        </div>
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
              Add-ons
            </Link>{' '}
            (import, embed, or export) to use those add-on stream URLs.
          </p>
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
                    <span className="truncate" title={prefix}>
                      {displayDspPrefix(prefix)}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SaveButton
            onClick={() => void saveTargets()}
            label="Save destinations"
          />
          <Tooltip content="Open smart link" side="top">
            <Link to="/r/$slug" params={{ slug: release.smartLinkSlug }}>
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Open smart link"
              >
                <ExternalLinkIcon size={16} aria-hidden />
              </Button>
            </Link>
          </Tooltip>
          <span className="text-foreground-secondary text-xs">
            {release.smartLinkViewCount ?? 0} views · /r/{release.smartLinkSlug}
          </span>
        </div>
      </StudioPanel>

      <StudioPanel
        title="Smart-link playlist"
        description="Arrange the release order, play a track, remove it, or add audio from your library."
      >
        {tracks.length === 0 ? (
          <EmptyState
            size="sm"
            title="No tracks yet"
            description="Add tracks from your library to build this release."
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
                  aria-label="Drag to reorder"
                />
                <span className="text-foreground-secondary w-5 text-xs">
                  {index + 1}
                </span>
                <ul className="min-w-0 flex-1">
                  <ReleaseTrackRow track={track} shopUrl={targets.bandcamp} />
                </ul>
                <Tooltip content="Remove from release" side="top">
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
                    <Trash2Icon size={15} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ol>
        )}
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => setLibraryOpen(true)}
        >
          <PlusIcon size={16} aria-hidden /> Add tracks from library
        </Button>
      </StudioPanel>

      <Dialog.Root isOpen={libraryOpen} onClose={() => setLibraryOpen(false)}>
        <Dialog.Title>Add tracks from library</Dialog.Title>
        <Dialog.Description>
          Search your sounds and add them to this release.
        </Dialog.Description>
        <div className="flex flex-wrap gap-2 py-3">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Type"
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
              <button
                key={item.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => void addSound(item)}
                className="border-border hover:bg-background-secondary flex items-center gap-2 rounded border px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="text-foreground-secondary text-xs">
                  {item.contentType ?? 'Track'}
                </span>
                {alreadyAdded ? (
                  <span className="text-xs">Added</span>
                ) : (
                  <PlusIcon size={15} aria-hidden />
                )}
              </button>
            );
          })}
          {filteredSounds.length === 0 && (
            <p className="text-foreground-secondary py-6 text-sm">
              No library items match.
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingRemoveTrack !== null}
        title={
          pendingRemoveTrack
            ? `Remove "${pendingRemoveTrack.title}" from this release?`
            : 'Remove track?'
        }
        description="The track leaves this release. It stays in your library."
        confirmLabel="Remove"
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

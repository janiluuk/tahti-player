import { Link } from '@tanstack/react-router';
import { ListMusicIcon, PlusIcon, RadioIcon } from 'lucide-react';
import { FC, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilterChips,
  Input,
  SaveButton,
  Select,
  TabLabel,
  Tabs,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  createStudioCollection,
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioCollections,
  fetchStudioReleases,
  fetchStudioSounds,
} from '../api/studio';
import {
  applyPlaylistToProgramme,
  fetchProgramme,
  patchProgramme,
  type ProgrammeItem,
  type ProgrammeView,
} from '../api/studio-extras';
import type { StudioCollection, StudioRelease } from '../api/studio-types';
import { usePlayerStore } from '../stores/playerStore';
import { ChannelRotationEditor } from './ChannelRotationEditor';

const isPlaylist = (collection: StudioCollection) =>
  !collection.style ||
  collection.style === 'PLAYLIST' ||
  collection.style === 'CUSTOM';

export const ChannelRadioPlaylistPanel: FC = () => {
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [playlists, setPlaylists] = useState<StudioCollection[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(false);
  const [fallbackMode, setFallbackMode] = useState<'shuffle' | 'ordered'>(
    'shuffle',
  );
  const [fallbackAutoEnroll, setFallbackAutoEnroll] = useState(false);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [libraryItems, setLibraryItems] = useState<ProgrammeItem[]>([]);
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [pendingAdd, setPendingAdd] = useState<{
    label: string;
    items: ProgrammeItem[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'programme' | 'rotation'>(
    'programme',
  );
  const play = usePlayerStore((state) => state.play);
  const previewCurrentId = usePlayerStore((state) => state.currentId);
  const previewStatus = usePlayerStore((state) => state.status);
  const previewItemId = previewCurrentId?.startsWith('archive:')
    ? previewCurrentId.slice('archive:'.length)
    : null;
  const previewPlaying = previewStatus === 'playing';

  const applyProgramme = (next: ProgrammeView) => {
    setProgramme(next);
    setFallbackEnabled(next.fallbackEnabled);
    setFallbackMode(next.fallbackMode);
    setFallbackAutoEnroll(next.fallbackAutoEnroll);
    setAnnouncementsEnabled(next.announcementsEnabled);
  };

  const reload = () => {
    void Promise.all([
      fetchProgramme(),
      fetchStudioCollections(),
      fetchStudioSounds(),
      fetchStudioReleases(),
    ]).then(
      ([programmeResult, collectionResult, archiveResult, releaseResult]) => {
        applyProgramme(programmeResult.data);
        setLibraryItems(
          archiveResult.data
            // EMBED_ONLY items have no Tahti-hosted audio, so they can't
            // play unattended in the 24/7 fallback rotation — keep them
            // out of the rotation candidate pool entirely.
            .filter((item) => !item.embedProvider)
            .map((item) => ({
              id: item.id,
              title: item.title,
              status: item.status,
              contentType: item.contentType ?? null,
              durationSec: item.durationSec ?? null,
              isFallback: Boolean(item.isFallback),
              fallbackOrder: null,
            })),
        );
        setReleases(releaseResult.data.releases);
        const nextPlaylists = collectionResult.data.filter(isPlaylist);
        setPlaylists(nextPlaylists);
        setSelectedSlug((current) => current || nextPlaylists[0]?.slug || '');
      },
    );
  };

  useEffect(() => {
    reload();
  }, []);

  const rotation = useMemo(
    () =>
      (programme?.items ?? [])
        .filter((item) => item.isFallback)
        .sort(
          (left, right) =>
            (left.fallbackOrder ?? 0) - (right.fallbackOrder ?? 0),
        ),
    [programme],
  );
  const availableItems = useMemo(
    () =>
      libraryItems.filter(
        (item) =>
          item.status === 'READY' &&
          !rotation.some((active) => active.id === item.id),
      ),
    [libraryItems, rotation],
  );

  const libraryGroups = useMemo(() => {
    const clips = libraryItems.filter(
      (item) => item.contentType?.toUpperCase() === 'CLIP',
    );
    const djSets = libraryItems.filter((item) =>
      item.contentType?.toUpperCase().includes('DJ'),
    );
    const tracks = libraryItems.filter(
      (item) =>
        item.contentType?.toUpperCase() !== 'CLIP' &&
        !djSets.some((djSet) => djSet.id === item.id),
    );
    const releaseGroups = releases.map((release) => ({
      id: `release-${release.id}`,
      label: `Release · ${release.title}`,
      items: (release.tracks ?? [])
        .map((track) => libraryItems.find((item) => item.id === track.soundId))
        .filter((item): item is ProgrammeItem => Boolean(item)),
    }));
    const playlistGroups = playlists.map((playlist) => ({
      id: `playlist-${playlist.slug}`,
      label: `Playlist · ${playlist.name}`,
      items: (playlist.items ?? [])
        .map((item) =>
          libraryItems.find((libraryItem) => libraryItem.id === item.soundId),
        )
        .filter((item): item is ProgrammeItem => Boolean(item)),
    }));
    return [
      { id: 'tracks', label: 'Tracks', items: tracks },
      { id: 'dj-sets', label: 'DJ Sets', items: djSets },
      { id: 'clips', label: 'Clips', items: clips },
      ...releaseGroups,
      ...playlistGroups,
    ].filter((group) => group.items.length > 0);
  }, [libraryItems, playlists, releases]);
  const selectedPlaylist = playlists.find(
    (playlist) => playlist.slug === selectedSlug,
  );
  const settingsDirty = Boolean(
    programme &&
    (fallbackEnabled !== programme.fallbackEnabled ||
      fallbackMode !== programme.fallbackMode ||
      fallbackAutoEnroll !== programme.fallbackAutoEnroll ||
      announcementsEnabled !== programme.announcementsEnabled),
  );

  const saveSettings = async () => {
    setBusy(true);
    const result = await patchProgramme({
      fallbackEnabled,
      fallbackMode,
      fallbackAutoEnroll,
      announcementsEnabled,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    applyProgramme(result.data);
    toast.success('24/7 settings saved.');
  };

  const applySelected = async () => {
    if (!selectedSlug) {
      return;
    }
    setBusy(true);
    const { data } = await fetchStudioCollection(selectedSlug);
    const soundIds = (data.items ?? [])
      .map((item) => item.soundId)
      .filter((id): id is string => Boolean(id));
    const result = await applyPlaylistToProgramme(soundIds, {
      enable: fallbackEnabled,
      mode: fallbackMode,
      autoEnroll: fallbackAutoEnroll,
      announcementsEnabled,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    applyProgramme(result.data);
    toast.success(`Using “${data.name}” with ${soundIds.length} tracks.`);
  };

  const saveRotation = async (
    nextRotation: ProgrammeItem[],
    nextMode: 'shuffle' | 'ordered' = fallbackMode,
  ) => {
    if (!programme) {
      return;
    }
    setBusy(true);
    const positions = new Map(
      nextRotation.map((item, index) => [item.id, index]),
    );
    const result = await patchProgramme({
      fallbackMode: nextMode,
      fallbackEnabled,
      fallbackAutoEnroll,
      announcementsEnabled,
      items: programme.items.map((item) => {
        const position = positions.get(item.id);
        return {
          soundId: item.id,
          isFallback: position !== undefined,
          ...(position !== undefined ? { fallbackOrder: position } : {}),
        };
      }),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    applyProgramme(result.data);
    toast.success('Rotation updated.');
  };

  const createInline = async () => {
    if (!newName.trim()) {
      return;
    }
    setBusy(true);
    const created = await createStudioCollection({
      name: newName.trim(),
      style: 'PLAYLIST',
      isPublic: true,
    });
    setBusy(false);
    if (!created.ok) {
      toast.error(created.error);
      return;
    }
    setCreating(false);
    setNewName('');
    setPlaylists((current) => [created.data, ...current]);
    setSelectedSlug(created.data.slug);
    toast.success(`Created “${created.data.name}”.`);
  };

  const playRotationItem = async (item: ProgrammeItem) => {
    const { data } = await fetchEditorSource(item.id);
    play({
      id: `archive:${item.id}`,
      kind: 'archive',
      title: item.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const confirmAdd = async (mode: 'append' | 'overwrite') => {
    if (!pendingAdd) {
      return;
    }
    const uniqueItems = pendingAdd.items.filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.id === item.id) === index,
    );
    const next =
      mode === 'overwrite'
        ? uniqueItems
        : [
            ...rotation,
            ...uniqueItems.filter(
              (item) => !rotation.some((active) => active.id === item.id),
            ),
          ];
    setPendingAdd(null);
    await saveRotation(next);
  };

  return (
    <section className="border-border bg-background-secondary/40 overflow-hidden rounded-xl border shadow-sm">
      <header className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <RadioIcon size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight">
              24/7 &amp; offline programme
            </h2>
            <p className="text-foreground-secondary text-xs">
              One place for everything that plays between live broadcasts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-xs font-semibold uppercase ${
              fallbackEnabled
                ? 'text-accent-green'
                : 'text-foreground-secondary'
            }`}
          >
            {fallbackEnabled ? 'On' : 'Off'}
          </span>
          <Toggle
            checked={fallbackEnabled}
            disabled={busy || !programme}
            onChange={setFallbackEnabled}
            aria-label="24/7 channel"
          />
        </div>
      </header>

      <Tabs.Root
        selectedIndex={activeTab === 'rotation' ? 1 : 0}
        onChange={(index) =>
          setActiveTab(index === 1 ? 'rotation' : 'programme')
        }
      >
        <Tabs.List
          aria-label="24/7 programme sections"
          className="border-border flex-wrap border-b px-4 pt-3 sm:px-5"
        >
          <Tabs.Tab>
            <TabLabel icon={<RadioIcon size={14} />}>Programme</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel
              icon={<ListMusicIcon size={14} />}
              count={rotation.length}
            >
              Active rotation
            </TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>

      {activeTab === 'programme' ? (
        <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-5">
          <div className="border-border bg-background flex flex-col gap-4 rounded-lg border p-4">
            <div>
              <h3 className="text-sm font-bold">Playlist source</h3>
              <p className="text-foreground-secondary mt-0.5 text-xs">
                Choose a playlist, then publish its archive tracks to rotation.
              </p>
            </div>

            <Select
              label="Playlist"
              value={selectedSlug}
              onValueChange={setSelectedSlug}
              placeholder={
                playlists.length === 0
                  ? 'No playlists yet'
                  : 'Choose a playlist'
              }
              options={playlists.map((playlist) => ({
                id: playlist.slug,
                label: `${playlist.name} · ${playlist.itemCount ?? playlist.items?.length ?? 0} tracks`,
              }))}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy || !selectedSlug}
                onClick={() => void applySelected()}
              >
                Use playlist
              </Button>
              {selectedPlaylist ? (
                <Link
                  to="/studio/collections/$slug"
                  params={{ slug: selectedPlaylist.slug }}
                >
                  <Button size="sm" variant="secondary">
                    <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
                    Edit tracks
                  </Button>
                </Link>
              ) : null}
              <Tooltip content="Create playlist" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  onClick={() => setCreating((current) => !current)}
                  aria-label="Create playlist"
                  aria-pressed={creating}
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </div>

            {creating ? (
              <div className="border-border bg-background-secondary flex flex-col gap-2 rounded-lg border p-3">
                <Input
                  label="Playlist name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  autoFocus
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={busy || !newName.trim()}
                    onClick={() => void createInline()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-border bg-background flex flex-col gap-4 rounded-lg border p-4">
            <div>
              <h3 className="text-sm font-bold">Offline programme settings</h3>
              <p className="text-foreground-secondary mt-0.5 text-xs">
                Keep the rotation predictable or let Tahti balance it.
              </p>
            </div>

            <FilterChips
              items={[
                { id: 'shuffle', label: 'Shuffle' },
                { id: 'ordered', label: 'In order' },
              ]}
              selected={fallbackMode}
              onChange={(id) => setFallbackMode(id as 'shuffle' | 'ordered')}
              aria-label="Rotation mode"
            />

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                Auto-add uploads
                <span className="text-foreground-secondary block text-xs">
                  Add new ready uploads to the rotation automatically
                </span>
              </span>
              <Toggle
                checked={fallbackAutoEnroll}
                disabled={busy || !programme}
                onChange={setFallbackAutoEnroll}
                aria-label="Auto-add uploads"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                Artist announcements
                <span className="text-foreground-secondary block text-xs">
                  Include your station IDs and clips
                </span>
              </span>
              <Toggle
                checked={announcementsEnabled}
                disabled={busy || !programme}
                onChange={setAnnouncementsEnabled}
                aria-label="Artist announcements"
              />
            </label>

            <div className="flex justify-end">
              <SaveButton
                disabled={!programme || !settingsDirty}
                saving={busy}
                label="Save settings"
                onClick={() => void saveSettings()}
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'rotation' ? (
        <ChannelRotationEditor
          items={rotation}
          availableItems={availableItems}
          busy={busy}
          currentItemId={previewItemId}
          isPlaying={previewPlaying}
          onAdd={(item) => void saveRotation([...rotation, item])}
          onReorder={(next) => void saveRotation(next, 'ordered')}
          onRemove={(item) =>
            void saveRotation(
              rotation.filter((candidate) => candidate.id !== item.id),
            )
          }
          onPlay={(item) => void playRotationItem(item)}
          libraryGroups={libraryGroups}
          onAddGroup={(group) => setPendingAdd(group)}
        />
      ) : null}

      <Dialog.Root
        isOpen={Boolean(pendingAdd)}
        onClose={() => setPendingAdd(null)}
        className="max-w-md"
      >
        <Dialog.Title>Add tracks to active rotation</Dialog.Title>
        <Dialog.Description>
          {pendingAdd
            ? `${pendingAdd.label} contains ${pendingAdd.items.length} track${pendingAdd.items.length === 1 ? '' : 's'}. Choose how to add it.`
            : ''}
        </Dialog.Description>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3 text-sm">
          <p>Append keeps the current rotation and adds the selected tracks.</p>
          <p className="mt-2">
            Overwrite replaces the active rotation with this selection.
          </p>
        </div>
        <Dialog.Actions>
          <Button variant="secondary" onClick={() => setPendingAdd(null)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => void confirmAdd('append')}>
            Append tracks
          </Button>
          <Button onClick={() => void confirmAdd('overwrite')}>
            Overwrite rotation
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </section>
  );
};

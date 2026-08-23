import {
  ImageIcon,
  ListMusicIcon,
  Share2Icon,
  TagsIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  CreatableCombobox,
  Dialog,
  FilePicker,
  Input,
  Textarea,
} from '@nuclearplayer/ui';

import {
  fetchStudioArchiveItem,
  importArchiveBanner,
  patchStudioArchiveItem,
  uploadArchiveBanner,
} from '../api/studio';
import type {
  StudioArchiveItem,
  StudioArchivePatch,
} from '../api/studio-types';
import { capitalizeGenre, PRESET_GENRES } from '../lib/genres';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';
import { TrackExportPanel } from './TrackExportPanel';

type Tab = 'metadata' | 'artwork' | 'playlists' | 'export';

type Props = {
  archiveItemId: string | null;
  onClose: () => void;
  onSaved?: (item: StudioArchiveItem) => void;
};

const CONTENT_TYPES = [
  ['STUDIO', 'Studio track'],
  ['LIVE', 'Live recording'],
  ['DJ_MIX', 'DJ mix'],
  ['PODCAST', 'Podcast'],
  ['ORIGINAL', 'Original'],
  ['REMIX', 'Remix'],
  ['RADIO_SHOW', 'Radio show'],
] as const;

const LICENSES = [
  ['', 'No license (default)'],
  ['ALL_RIGHTS_RESERVED', 'All rights reserved'],
  ['CC0', 'No rights reserved (CC0)'],
  ['CC_BY', 'Creative Commons Attribution (CC BY)'],
  ['CC_BY_SA', 'Creative Commons Attribution-ShareAlike (CC BY-SA)'],
  ['CC_BY_NC', 'Creative Commons Attribution-NonCommercial (CC BY-NC)'],
  [
    'CC_BY_NC_SA',
    'Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA)',
  ],
  [
    'CC_BY_NC_ND',
    'Creative Commons Attribution-NonCommercial-NoDerivatives (CC BY-NC-ND)',
  ],
] as const;

const TABS = [
  { id: 'metadata' as const, label: 'Metadata', icon: TagsIcon },
  { id: 'artwork' as const, label: 'Artwork', icon: ImageIcon },
  { id: 'playlists' as const, label: 'Playlists', icon: ListMusicIcon },
  { id: 'export' as const, label: 'Export', icon: Share2Icon },
];

export function TrackEditDialog({ archiveItemId, onClose, onSaved }: Props) {
  const isOpen = Boolean(archiveItemId);
  const [tab, setTab] = useState<Tab>('metadata');
  const [item, setItem] = useState<StudioArchiveItem | null>(null);
  const [form, setForm] = useState<StudioArchivePatch>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [artworkBusy, setArtworkBusy] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!archiveItemId) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNote(null);
    setTab('metadata');
    void fetchStudioArchiveItem(archiveItemId)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setItem(res.data);
        setForm({
          title: res.data.title,
          description: res.data.description ?? '',
          artistName: res.data.artistName ?? '',
          genre: res.data.genre ? capitalizeGenre(res.data.genre) : '',
          contentType: res.data.contentType ?? 'STUDIO',
          license: res.data.license ?? '',
          isPublic: res.data.isPublic ?? true,
          visibility:
            res.data.visibility ??
            (res.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
          releaseDate: res.data.releaseDate ?? '',
          downloadsEnabled: res.data.downloadsEnabled ?? false,
          commentsEnabled: res.data.commentsEnabled ?? true,
          bannerUrl: res.data.bannerUrl ?? '',
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Track load failed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [archiveItemId]);

  const updateArtwork = (url: string) => {
    setForm((current) => ({ ...current, bannerUrl: url }));
    setItem((current) => (current ? { ...current, bannerUrl: url } : current));
    if (item) {
      onSaved?.({ ...item, bannerUrl: url });
    }
  };

  const uploadArtwork = async (file: File) => {
    if (!archiveItemId) {
      return;
    }
    setArtworkBusy(true);
    setError(null);
    setNote(null);
    const result = await uploadArchiveBanner(archiveItemId, file);
    setArtworkBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    updateArtwork(result.url);
    setNote('Cover art uploaded.');
  };

  const importArtwork = async () => {
    if (!archiveItemId || !form.bannerUrl?.trim()) {
      return;
    }
    setArtworkBusy(true);
    setError(null);
    setNote(null);
    const result = await importArchiveBanner(
      archiveItemId,
      form.bannerUrl.trim(),
    );
    setArtworkBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    updateArtwork(result.url);
    setNote('Cover art imported and stored with the track.');
  };

  const save = async () => {
    if (!archiveItemId || !form.title?.trim()) {
      return;
    }
    setSaving(true);
    setError(null);
    setNote(null);
    const { license, ...metadata } = form;
    const result = await patchStudioArchiveItem(archiveItemId, {
      ...metadata,
      ...(license ? { license } : {}),
      title: form.title.trim(),
      artistName: form.artistName?.trim() || null,
      genre: form.genre?.trim() || null,
      isPublic: form.visibility === 'PUBLIC',
      releaseDate: form.releaseDate || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItem(result.data);
    setForm((current) => ({
      ...current,
      title: result.data.title,
      description: result.data.description ?? '',
      artistName: result.data.artistName ?? '',
      genre: result.data.genre ?? '',
      contentType: result.data.contentType ?? current.contentType,
      license: result.data.license ?? '',
      isPublic: result.data.isPublic ?? true,
      visibility:
        result.data.visibility ??
        (result.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      releaseDate: result.data.releaseDate ?? '',
      downloadsEnabled: result.data.downloadsEnabled ?? false,
      commentsEnabled: result.data.commentsEnabled ?? true,
      bannerUrl: result.data.bannerUrl ?? '',
    }));
    setNote('Track details saved.');
    onSaved?.(result.data);
  };

  return (
    <>
      <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
        <Dialog.Title>Edit track</Dialog.Title>
        <Dialog.Description>
          {item ? `Manage “${item.title}”` : 'Loading track…'}
        </Dialog.Description>

        <div
          className="border-border mt-3 mb-4 flex gap-1 overflow-x-auto border-b"
          role="tablist"
          aria-label="Track editor sections"
        >
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                tab === entry.id
                  ? 'border-primary text-foreground'
                  : 'text-foreground-secondary hover:text-foreground border-transparent'
              }`}
            >
              <entry.icon size={15} aria-hidden />
              {entry.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-foreground-secondary text-sm">Loading track…</p>
        ) : item ? (
          <>
            {tab === 'metadata' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Title"
                  value={form.title ?? ''}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
                <Input
                  label="Artist credit"
                  value={form.artistName ?? ''}
                  placeholder="Use channel artist name"
                  onChange={(event) =>
                    setForm({ ...form, artistName: event.target.value })
                  }
                />
                <div className="sm:col-span-2">
                  <label className="flex flex-col gap-1 text-sm">
                    Description
                    <Textarea
                      rows={4}
                      value={form.description ?? ''}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                    />
                  </label>
                </div>
                <CreatableCombobox
                  label="Genre"
                  options={[...PRESET_GENRES]}
                  value={form.genre ?? ''}
                  onValueChange={(genre) => setForm({ ...form, genre })}
                  normalize={capitalizeGenre}
                />
                <label className="flex flex-col gap-1 text-sm">
                  Release date
                  <input
                    type="date"
                    value={form.releaseDate ?? ''}
                    onChange={(event) =>
                      setForm({ ...form, releaseDate: event.target.value })
                    }
                    className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Content type
                  <select
                    value={form.contentType ?? 'STUDIO'}
                    onChange={(event) =>
                      setForm({ ...form, contentType: event.target.value })
                    }
                    className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                  >
                    {CONTENT_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  License (optional)
                  <select
                    value={form.license ?? ''}
                    onChange={(event) =>
                      setForm({ ...form, license: event.target.value })
                    }
                    className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                  >
                    {LICENSES.map(([value, label]) => (
                      <option key={value || 'none'} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Visibility
                  <select
                    value={form.visibility ?? 'PUBLIC'}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        visibility: event.target.value as
                          | 'PUBLIC'
                          | 'UNLISTED'
                          | 'PRIVATE',
                      })
                    }
                    className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">
                      Unlisted — direct link only
                    </option>
                    <option value="PRIVATE">Private — only you</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.downloadsEnabled ?? false}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        downloadsEnabled: event.target.checked,
                      })
                    }
                  />
                  Allow downloads
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.commentsEnabled ?? true}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        commentsEnabled: event.target.checked,
                      })
                    }
                  />
                  Allow comments
                </label>
              </div>
            )}

            {tab === 'artwork' && (
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                <div className="border-border bg-background-secondary flex aspect-square items-center justify-center overflow-hidden rounded-xl border">
                  {form.bannerUrl ? (
                    <img
                      src={form.bannerUrl}
                      alt="Current cover art"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon
                      size={36}
                      className="text-foreground-secondary"
                      aria-label="No cover art"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <FilePicker
                    labels={{
                      title: 'Upload cover art',
                      description: 'JPEG, PNG, or WebP',
                      browse: 'Choose image',
                    }}
                    accept="image/jpeg,image/png,image/webp"
                    disabled={artworkBusy}
                    onFiles={(files) => {
                      const file = files[0];
                      if (file) {
                        void uploadArtwork(file);
                      }
                    }}
                  />
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <Input
                        label="Or import an image URL"
                        value={form.bannerUrl ?? ''}
                        placeholder="https://…"
                        onChange={(event) =>
                          setForm({ ...form, bannerUrl: event.target.value })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={artworkBusy || !form.bannerUrl?.trim()}
                      onClick={() => void importArtwork()}
                    >
                      <UploadIcon size={14} aria-hidden />
                      {artworkBusy ? 'Working…' : 'Import'}
                    </Button>
                  </div>
                  <p className="text-foreground-secondary text-xs">
                    JPEG, PNG, or WebP. Imported images are re-hosted so the
                    artwork stays available.
                  </p>
                </div>
              </div>
            )}

            {tab === 'playlists' && (
              <div className="border-border flex items-center gap-4 rounded-xl border p-4">
                <ListMusicIcon
                  size={28}
                  className="text-primary shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Add this track to playlists</p>
                  <p className="text-foreground-secondary text-sm">
                    Choose one or more existing playlists, or create a new one.
                  </p>
                </div>
                <Button size="sm" onClick={() => setPlaylistOpen(true)}>
                  <ListMusicIcon size={15} aria-hidden />
                  Choose playlists
                </Button>
              </div>
            )}

            {tab === 'export' && <TrackExportPanel archiveItemId={item.id} />}
          </>
        ) : null}

        {error && (
          <p className="text-accent-red mt-3 text-sm" role="alert">
            {error}
          </p>
        )}
        {note && (
          <p className="text-foreground-secondary mt-3 text-sm" role="status">
            {note}
          </p>
        )}

        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
          {(tab === 'metadata' || tab === 'artwork') && item ? (
            <Button
              disabled={saving || artworkBusy || !form.title?.trim()}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog.Root>

      {archiveItemId && (
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          archiveItemId={archiveItemId}
          trackTitle={item?.title ?? ''}
          onClose={() => setPlaylistOpen(false)}
        />
      )}
    </>
  );
}

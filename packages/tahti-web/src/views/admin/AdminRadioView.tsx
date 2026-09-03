import { PauseIcon, PlayIcon, PlusIcon, RadioTowerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  Input,
  SaveButton,
  Textarea,
} from '@tahti-player/ui';

import {
  createAdminInternetRadioPreset,
  deleteAdminInternetRadioPreset,
  fetchAdminInternetRadioPresets,
  fetchAdminRadio,
  fetchAdminRadioRotation,
  patchAdminInternetRadioPreset,
  radioMoveToFront,
  radioOptOut,
  radioRemoveOptOut,
  type AdminInternetRadioPreset,
  type AdminInternetRadioPresetInput,
  type AdminRadioData,
  type AdminSelectsItem,
} from '../../api/admin';
import { fetchRadioStation } from '../../api/client';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { RadioStationCover } from '../../components/RadioStationCover';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
import { TahtiRotationPlaylistEditor } from '../../components/TahtiRotationPlaylistEditor';
import { RADIO_STATIONS } from '../../content/radioStations';
import {
  persistRadioStationCover,
  toPersistableMediaUrl,
} from '../../lib/radioStationCover';
import { usePlayerStore } from '../../stores/playerStore';

const EMPTY_PRESET_DRAFT: AdminInternetRadioPresetInput = {
  name: '',
  genre: '',
  description: '',
  iconUrl: '',
  programmingUrl: '',
  streamUrl: '',
};

function catalogStationIdForName(name: string): string | undefined {
  return RADIO_STATIONS.find((station) => station.name === name.trim())?.id;
}

function catalogLogoForName(name: string): string | undefined {
  return RADIO_STATIONS.find((station) => station.name === name.trim())
    ?.logoUrl;
}

function draftFromPreset(
  preset: AdminInternetRadioPreset,
): AdminInternetRadioPresetInput {
  return {
    name: preset.name,
    genre: preset.genre ?? '',
    description: preset.description ?? '',
    iconUrl: preset.iconUrl ?? '',
    programmingUrl: preset.programmingUrl ?? '',
    streamUrl: preset.streamUrl ?? '',
  };
}

function InternetRadioPresetsPanel() {
  const [presets, setPresets] = useState<AdminInternetRadioPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] =
    useState<AdminInternetRadioPresetInput>(EMPTY_PRESET_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchAdminInternetRadioPresets().then((result) => {
      setPresets(result.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const openNew = () => {
    setEditingId(null);
    setDraft(EMPTY_PRESET_DRAFT);
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (preset: AdminInternetRadioPreset) => {
    setEditingId(preset.id);
    setDraft(draftFromPreset(preset));
    setError(null);
    setEditorOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) {
      return;
    }
    setPending(true);
    setError(null);
    const input: AdminInternetRadioPresetInput = {
      name: draft.name.trim(),
      genre: draft.genre?.trim() || undefined,
      description: draft.description?.trim() || undefined,
      iconUrl: draft.iconUrl?.trim()
        ? toPersistableMediaUrl(draft.iconUrl.trim())
        : undefined,
      programmingUrl: draft.programmingUrl?.trim() || undefined,
      streamUrl: draft.streamUrl?.trim() || undefined,
    };
    const request = editingId
      ? patchAdminInternetRadioPreset(editingId, input)
      : createAdminInternetRadioPreset(input);
    void request.then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditorOpen(false);
      reload();
    });
  };

  const toggleEnabled = (preset: AdminInternetRadioPreset) => {
    void patchAdminInternetRadioPreset(preset.id, {
      enabled: !preset.enabled,
    }).then((result) => {
      if (result.ok) {
        reload();
      }
    });
  };

  return (
    <StudioPanel
      title={`Internet radio — Listen page defaults (${presets.length})`}
      description="Stations toggled on here appear in the radio feed on the Listen page for every visitor, signed in or not — not just listeners who add it to their own library."
      action={
        <Button size="sm" onClick={openNew}>
          <PlusIcon size={15} aria-hidden className="mr-1.5" />
          Add station
        </Button>
      }
    >
      {loading ? (
        <PageLoading label="Loading stations…" />
      ) : presets.length === 0 ? (
        <p className="text-foreground-secondary py-4 text-center text-sm">
          No internet radio stations yet — add one to offer it as a default.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="bg-background-secondary flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold">
                <RadioStationCover
                  src={preset.iconUrl ?? ''}
                  label={preset.name}
                  stationName={preset.name}
                  catalogStationId={catalogStationIdForName(preset.name)}
                  presetId={preset.id}
                  onCoverChange={(iconUrl) =>
                    setPresets((current) =>
                      current.map((item) =>
                        item.id === preset.id ? { ...item, iconUrl } : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{preset.name}</span>
                  <Badge
                    variant="pill"
                    color={preset.enabled ? 'green' : undefined}
                  >
                    {preset.enabled ? 'Enabled for everyone' : 'Off'}
                  </Badge>
                </div>
                <div className="text-foreground-secondary truncate text-xs">
                  {preset.genre ?? 'No genre'} ·{' '}
                  {preset.streamUrl
                    ? 'Stream URL set'
                    : 'No stream URL — won’t be playable'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant={preset.enabled ? 'secondary' : 'default'}
                  onClick={() => toggleEnabled(preset)}
                >
                  {preset.enabled ? 'Disable' : 'Enable for everyone'}
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => openEdit(preset)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => {
                    void deleteAdminInternetRadioPreset(preset.id).then(
                      (result) => {
                        if (result.ok) {
                          reload();
                        }
                      },
                    );
                  }}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root
        isOpen={editorOpen}
        onClose={() => {
          if (!pending) {
            setEditorOpen(false);
          }
        }}
        className="max-w-lg"
      >
        <Dialog.Title>
          {editingId ? 'Edit station' : 'Add internet radio station'}
        </Dialog.Title>
        <Dialog.Description>
          Shown as a default in the Listen page radio feed once enabled.
        </Dialog.Description>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 self-center">
            <RadioStationCover
              src={draft.iconUrl || ''}
              label={draft.name.trim() || 'Station'}
              stationName={draft.name.trim() || 'Station'}
              catalogStationId={catalogStationIdForName(draft.name)}
              presetId={editingId ?? undefined}
              persist={Boolean(editingId)}
              className="h-28 w-28 overflow-hidden rounded-lg"
              onCoverChange={(iconUrl) => {
                setDraft((current) => ({ ...current, iconUrl }));
                if (editingId) {
                  setPresets((current) =>
                    current.map((item) =>
                      item.id === editingId ? { ...item, iconUrl } : item,
                    ),
                  );
                }
              }}
            />
            <span className="text-foreground-secondary text-xs">
              Station logo — JPEG, PNG, or WebP. Hover the image to replace.
            </span>
            {catalogLogoForName(draft.name) ? (
              <Button
                type="button"
                size="xs"
                variant="text"
                disabled={
                  pending || draft.iconUrl === catalogLogoForName(draft.name)
                }
                onClick={() => {
                  const logoUrl = catalogLogoForName(draft.name);
                  if (!logoUrl) {
                    return;
                  }
                  setDraft((current) => ({ ...current, iconUrl: logoUrl }));
                  if (!editingId) {
                    return;
                  }
                  void persistRadioStationCover({
                    catalogStationId: catalogStationIdForName(draft.name),
                    presetId: editingId,
                    stationName: draft.name.trim() || 'Station',
                    logoUrl,
                  }).then((result) => {
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setPresets((current) =>
                      current.map((item) =>
                        item.id === editingId
                          ? { ...item, iconUrl: logoUrl }
                          : item,
                      ),
                    );
                  });
                }}
              >
                Use catalog logo
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={draft.name}
              placeholder="Radio Helsinki"
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
            <Input
              label="Genre"
              value={draft.genre ?? ''}
              placeholder="World"
              onChange={(event) =>
                setDraft({ ...draft, genre: event.target.value })
              }
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-semibold">Description</span>
            <Textarea
              value={draft.description ?? ''}
              rows={2}
              placeholder="What listeners should expect from this station."
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <Input
            label="Stream URL"
            value={draft.streamUrl ?? ''}
            placeholder="https://stream.example.com/live.mp3"
            description="Direct, playable HTTPS stream URL."
            onChange={(event) =>
              setDraft({ ...draft, streamUrl: event.target.value })
            }
          />
          <Input
            label="Programming URL (optional)"
            value={draft.programmingUrl ?? ''}
            placeholder="https://example.com/now-playing"
            description="“What's on now” endpoint, if the station exposes one — display-only."
            onChange={(event) =>
              setDraft({ ...draft, programmingUrl: event.target.value })
            }
          />
          {error ? (
            <p className="text-accent-red text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          {editingId ? (
            <SaveButton
              type="button"
              disabled={pending || !draft.name.trim()}
              saving={pending}
              label="Save changes"
              onClick={save}
            />
          ) : (
            <Button
              type="button"
              disabled={pending || !draft.name.trim()}
              onClick={save}
            >
              Add station
            </Button>
          )}
        </Dialog.Actions>
      </Dialog.Root>
    </StudioPanel>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminRadioView() {
  const play = usePlayerStore((state) => state.play);
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const [data, setData] = useState<AdminRadioData | null>(null);
  const [rotation, setRotation] = useState<AdminSelectsItem[]>([]);
  const [station, setStation] = useState<Awaited<
    ReturnType<typeof fetchRadioStation>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void Promise.all([
      fetchAdminRadio(),
      fetchAdminRadioRotation(),
      fetchRadioStation(),
    ]).then(([radioResult, rotationResult, stationResult]) => {
      setData(radioResult.data);
      setRotation(rotationResult.data);
      setStation(stationResult);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const stationPlayableId = 'radio:tahti-radio';
  const stationPlaying =
    currentId === stationPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const togglePlayback = () => {
    if (!station?.playable) {
      return;
    }
    if (currentId === stationPlayableId) {
      setPlaybackStatus(stationPlaying ? 'paused' : 'playing');
      return;
    }
    play({ ...station.playable, id: stationPlayableId });
  };

  const preview = (item: AdminSelectsItem) => {
    if (!item.audioUrl) {
      return;
    }
    play({
      id: `archive:${item.soundId}`,
      kind: 'archive',
      title: item.title,
      artist: item.artistName,
      streamUrl: item.audioUrl,
      protocol: item.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: item.channelSlug,
    });
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/radio">
          <div className="flex max-w-4xl flex-col gap-6">
            <StudioPageHeader
              title="Radio"
              subtitle="Fair-rotation meta-stream — member channels, no editorial picks."
            />

            {msg && (
              <p className="text-foreground-secondary text-sm" role="status">
                {msg}
              </p>
            )}

            {loading || !data ? (
              <StudioPanel>
                <PageLoading label="Loading radio…" />
              </StudioPanel>
            ) : (
              <>
                <StudioPanel
                  title={
                    station?.data.hlsUrl && station.data.nowPlaying
                      ? 'Stream live'
                      : 'Stream offline'
                  }
                  description={
                    station?.data.hlsUrl && station.data.nowPlaying
                      ? 'Tahti Radio is broadcasting the member rotation or a live guest channel.'
                      : 'The Tahti Radio stream is currently unavailable.'
                  }
                  action={
                    station?.playable ? (
                      <Button
                        size="sm"
                        aria-label={
                          stationPlaying
                            ? 'Pause Tahti Radio stream'
                            : 'Play Tahti Radio stream'
                        }
                        onClick={togglePlayback}
                      >
                        {stationPlaying ? (
                          <PauseIcon size={15} aria-hidden className="mr-1.5" />
                        ) : (
                          <PlayIcon size={15} aria-hidden className="mr-1.5" />
                        )}
                        {stationPlaying ? 'Pause' : 'Listen'}
                      </Button>
                    ) : undefined
                  }
                >
                  <div className="border-border bg-background flex items-center gap-3 rounded-lg border p-3">
                    <div className="bg-background-secondary text-foreground-secondary flex size-10 shrink-0 items-center justify-center rounded-full">
                      <RadioTowerIcon size={20} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                        {station?.data.hlsUrl && station.data.nowPlaying
                          ? data.nowPlaying.live
                            ? 'Live guest on air'
                            : 'Rotation on air'
                          : 'Playback state'}
                      </p>
                      <p className="truncate font-semibold">
                        {station?.data.nowPlaying?.title ?? 'No active track'}
                      </p>
                      {station?.data.nowPlaying ? (
                        <p className="text-foreground-secondary truncate text-sm">
                          {station.data.nowPlaying.artistName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-foreground-secondary mt-3 text-xs">
                    Member relay:{' '}
                    {data.nowPlaying.live && data.nowPlaying.artistName
                      ? `${data.nowPlaying.artistName} · /c/${data.nowPlaying.slug}`
                      : 'no live member channel · rotation should continue'}
                  </p>
                </StudioPanel>

                <StudioPanel
                  title={`Current rotation (${rotation.length})`}
                  description="Drag tracks into the exact order listeners will hear between live shows."
                >
                  {rotation.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      Nothing is in rotation yet.
                    </p>
                  ) : (
                    <TahtiRotationPlaylistEditor
                      items={rotation}
                      onPreview={preview}
                      readOnly
                      onReorder={() => undefined}
                      onRemove={() => undefined}
                    />
                  )}
                </StudioPanel>

                <StudioPanel
                  title={`Eligible channels (${data.eligible.length})`}
                >
                  {data.eligible.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No member channels are live right now.
                    </p>
                  ) : (
                    <ul className="divide-border divide-y">
                      {data.eligible.map((ch) => (
                        <li
                          key={ch.channelId}
                          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                        >
                          <div>
                            <div className="font-medium">{ch.artistName}</div>
                            <div className="text-foreground-secondary text-xs">
                              /c/{ch.slug} ·{' '}
                              {ch.lastFeaturedAt
                                ? `last featured ${fmt(ch.lastFeaturedAt)}`
                                : 'never featured'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                void radioMoveToFront(ch.channelId).then(
                                  (r) => {
                                    if (!r.ok) {
                                      setMsg(r.error);
                                    } else {
                                      reload();
                                    }
                                  },
                                );
                              }}
                            >
                              Move to front
                            </Button>
                            <Button
                              size="sm"
                              variant="text"
                              onClick={() => {
                                void radioOptOut(ch.channelId).then((r) => {
                                  if (!r.ok) {
                                    setMsg(r.error);
                                  } else {
                                    reload();
                                  }
                                });
                              }}
                            >
                              Opt out
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </StudioPanel>

                {data.optedOut.length > 0 && (
                  <StudioPanel title={`Opted out (${data.optedOut.length})`}>
                    <ul className="divide-border divide-y">
                      {data.optedOut.map((ch) => (
                        <li
                          key={ch.channelId}
                          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2">
                            <span>{ch.artistName}</span>
                            <span className="text-foreground-secondary text-xs">
                              /c/{ch.slug}
                            </span>
                            {ch.isLive && (
                              <Badge variant="pill" color="green">
                                Live
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              void radioRemoveOptOut(ch.channelId).then((r) => {
                                if (!r.ok) {
                                  setMsg(r.error);
                                } else {
                                  reload();
                                }
                              });
                            }}
                          >
                            Re-enable
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </StudioPanel>
                )}

                <StudioPanel title="Feature history">
                  {data.history.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No history yet.
                    </p>
                  ) : (
                    <ul className="divide-border divide-y">
                      {data.history.map((item, i) => (
                        <li
                          key={`${item.channelId}-${i}`}
                          className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                        >
                          <span>{item.artistName}</span>
                          <span className="text-foreground-secondary text-xs">
                            {fmt(item.featuredAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </StudioPanel>
              </>
            )}

            <InternetRadioPresetsPanel />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}

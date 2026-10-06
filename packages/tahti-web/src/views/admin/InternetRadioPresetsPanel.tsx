import {
  BanIcon,
  CheckCircle2Icon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
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
  patchAdminInternetRadioPreset,
  type AdminInternetRadioPreset,
  type AdminInternetRadioPresetInput,
} from '../../api/admin';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { RadioStationCover } from '../../components/RadioStationCover';
import { StudioPanel } from '../../components/StudioPanel';
import { RADIO_STATIONS } from '../../content/radioStations';
import {
  persistRadioStationCover,
  toPersistableMediaUrl,
} from '../../lib/radioStationCover';

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

export function InternetRadioPresetsPanel() {
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
        <PageEmpty
          title="No internet radio stations yet"
          description="Add one to offer it as a default."
        />
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
                  {preset.enabled ? (
                    <BanIcon size={14} aria-hidden />
                  ) : (
                    <CheckCircle2Icon size={14} aria-hidden />
                  )}
                  {preset.enabled ? 'Disable' : 'Enable for everyone'}
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => openEdit(preset)}
                >
                  <PencilIcon size={14} aria-hidden />
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
                  <Trash2Icon size={14} aria-hidden />
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
                <ImageIcon size={14} aria-hidden />
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
            <p className="text-accent-red-strong text-sm" role="alert">
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
              <PlusIcon size={14} aria-hidden />
              Add station
            </Button>
          )}
        </Dialog.Actions>
      </Dialog.Root>
    </StudioPanel>
  );
}

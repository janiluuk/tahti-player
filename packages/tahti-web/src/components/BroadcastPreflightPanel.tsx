import { CheckCircle2Icon, ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Input, SaveButton, Select } from '@tahti-player/ui';

import { uploadProfileAvatar } from '../api/artist-settings';
import {
  fetchBroadcastPreflight,
  patchBroadcastPreflight,
  type BroadcastPreflight,
} from '../api/broadcast';
import { fetchShowSeries } from '../api/shows';
import { fetchMeProfile } from '../api/studio-extras';
import { PageLoading } from './PageStates';
import { RoundImageUploadButton } from './RoundImageUploadButton';

type Props = {
  onSaved?: () => void;
  onDirty?: () => void;
};

const segmentClassName =
  'border-border flex min-h-8 flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition-colors';

export function BroadcastPreflightPanel({ onSaved, onDirty }: Props) {
  const [preflight, setPreflight] = useState<BroadcastPreflight | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [showType, setShowType] =
    useState<BroadcastPreflight['showType']>('LIVE_SET');
  const [visibility, setVisibility] =
    useState<BroadcastPreflight['visibility']>('PUBLIC');
  const [seriesId, setSeriesId] = useState('');
  const [series, setSeries] = useState<
    Array<{ id: string; title: string; nextEpisodeNumber: number }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchBroadcastPreflight(),
      fetchShowSeries(),
      fetchMeProfile(),
    ]).then(([preflightResult, seriesResult, profileResult]) => {
      if (cancelled) {
        return;
      }
      const loadedPreflight = preflightResult.data;
      if (loadedPreflight) {
        setPreflight(loadedPreflight);
        setTitle(loadedPreflight.title ?? '');
        setTagline(
          loadedPreflight.tagline ??
            loadedPreflight.plannedRadioShow?.tagline ??
            '',
        );
        setShowType(loadedPreflight.showType);
        setVisibility(loadedPreflight.visibility);
        setSeriesId(loadedPreflight.plannedLiveShow?.seriesId ?? '');
      }
      setAvatarUrl(profileResult.data.avatarUrl ?? null);
      setSeries(
        seriesResult.data.map((show) => ({
          id: show.id,
          title: show.title,
          nextEpisodeNumber: show.nextEpisodeNumber,
        })),
      );
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return <PageLoading label="Loading show info…" />;
  }

  if (!preflight) {
    return (
      <p className="text-foreground-secondary text-sm">
        Show details could not be loaded.
      </p>
    );
  }

  const markDirty = () => onDirty?.();
  const episodeNumber =
    preflight.episodeNumber ?? preflight.plannedRadioShow?.episodeNumber;

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Add a show name before saving.');
      return;
    }
    setSaving(true);
    const result = await patchBroadcastPreflight({
      title: trimmedTitle,
      tagline: tagline.trim() || null,
      showType,
      visibility,
      ...(seriesId ? { seriesId } : {}),
    });
    setSaving(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    setPreflight(result.data);
    setTitle(result.data.title ?? '');
    setTagline(result.data.tagline ?? '');
    setShowType(result.data.showType);
    setVisibility(result.data.visibility);
    setSeriesId(result.data.plannedLiveShow?.seriesId ?? '');
    toast.success('Show info saved.');
    onSaved?.();
  };

  const uploadAvatar = async (file: File) => {
    const result = await uploadProfileAvatar(file);
    return result.ok
      ? { ok: true as const, data: { url: result.avatarUrl } }
      : result;
  };

  return (
    <section className="border-border bg-background-secondary/35 rounded-xl border p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <ImageIcon size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Confirm show info</h2>
          <p className="text-foreground-secondary mt-0.5 text-xs">
            Check what listeners will see before you start the encoder.
          </p>
        </div>
        <RoundImageUploadButton
          value={avatarUrl}
          onChange={setAvatarUrl}
          label="Show avatar"
          sizeClassName="h-12 w-12"
          upload={uploadAvatar}
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1.3fr)_7rem]">
        <Input
          label="Show name"
          size="sm"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            markDirty();
          }}
          placeholder="Show name"
        />
        {preflight.plannedLiveShow?.seriesId ? (
          <Input
            type="number"
            variant="number"
            label="Episode"
            size="sm"
            min={1}
            value={episodeNumber ?? ''}
            disabled
          />
        ) : null}
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-1 text-xs font-medium">Show type</legend>
          <div
            className="flex gap-1.5"
            role="radiogroup"
            aria-label="Show type"
          >
            {(['LIVE_SET', 'TALK'] as const).map((value) => (
              <label
                key={value}
                className={`${segmentClassName} ${showType === value ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-background'}`}
              >
                <input
                  type="radio"
                  name="broadcast-show-type"
                  className="sr-only"
                  checked={showType === value}
                  onChange={() => {
                    setShowType(value);
                    markDirty();
                  }}
                />
                {value === 'LIVE_SET' ? 'Live set' : 'Talk'}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-xs font-medium">Visibility</legend>
          <div
            className="flex gap-1.5"
            role="radiogroup"
            aria-label="Show visibility"
          >
            {(
              [
                ['PUBLIC', 'Public'],
                ['PRIVATE', 'Private'],
                ['FAN_ONLY', 'Fans'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`${segmentClassName} ${visibility === value ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-background'}`}
              >
                <input
                  type="radio"
                  name="broadcast-visibility"
                  className="sr-only"
                  checked={visibility === value}
                  onChange={() => {
                    setVisibility(value);
                    markDirty();
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        {series.length > 0 && (
          <Select
            label="Series episode"
            value={seriesId}
            disabled={Boolean(preflight.plannedLiveShow)}
            onValueChange={(value) => {
              setSeriesId(value);
              markDirty();
            }}
            options={[
              { id: '', label: 'One-off broadcast' },
              ...series.map((show) => ({
                id: show.id,
                label: `${show.title} — next #${show.nextEpisodeNumber}`,
              })),
            ]}
          />
        )}
        {episodeNumber !== null ? (
          <Input
            label="Tagline"
            size="sm"
            value={tagline}
            onChange={(event) => {
              setTagline(event.target.value);
              markDirty();
            }}
            placeholder="What is this broadcast about?"
            maxLength={200}
          />
        ) : null}
      </div>

      <div className="border-border/70 mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <p className="text-foreground-secondary text-[11px]">
          This appears on your channel while you are live.
        </p>
        <SaveButton
          size="sm"
          saving={saving}
          label="Save show info"
          onClick={() => void save()}
        />
      </div>
    </section>
  );
}

export function ShowInfoConfirmed() {
  return (
    <span className="text-accent-green inline-flex items-center gap-1 text-xs font-semibold">
      <CheckCircle2Icon size={15} aria-hidden />
      Confirmed
    </span>
  );
}

import { ImagePlusIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  HiddenFileInput,
  Input,
  MediaArtwork,
  Select,
} from '@tahti-player/ui';

import {
  BROADCAST_TAGLINE_MAX,
  BROADCAST_TITLE_MAX,
  type BroadcastPreflight,
} from '../../../api/broadcast';
import { fetchShowSeries } from '../../../api/shows';
import type { StudioShowSeries } from '../../../api/shows/types';
import { uploadUserMediaFile } from '../../../api/user-media';
import { cn } from '../../../lib/cn';
import {
  useShowInfoAutosave,
  type AutosaveStatus,
  type ShowInfoFieldErrors,
} from './useShowInfoAutosave';

function showTypeOptions(t: TFunction<'web'>) {
  return [
    { id: 'LIVE_SET', label: t('broadcastPreflightPanel.liveSet') },
    { id: 'TALK', label: t('broadcastPreflightPanel.talk') },
  ];
}

function visibilityOptions(t: TFunction<'web'>) {
  return [
    { id: 'PUBLIC', label: t('broadcastPreflightPanel.public') },
    { id: 'FAN_ONLY', label: t('goLivePage.showInfo.fansOnly') },
    { id: 'PRIVATE', label: t('broadcastPreflightPanel.private') },
  ];
}

function fieldError(
  t: TFunction<'web'>,
  error: ShowInfoFieldErrors['title'] | ShowInfoFieldErrors['tagline'],
  max: number,
): string | undefined {
  if (error === 'required') {
    return t('goLivePage.showInfo.nameRequired');
  }
  if (error === 'tooLong') {
    return t('goLivePage.showInfo.tooLong', { max });
  }
  return undefined;
}

function statusText(t: TFunction<'web'>, status: AutosaveStatus) {
  if (status === 'saving') {
    return t('goLivePage.autosave.saving');
  }
  if (status === 'saved') {
    return t('goLivePage.autosave.saved');
  }
  if (status === 'error') {
    return t('goLivePage.autosave.failed');
  }
  return '';
}

function CoverSlot({
  coverUrl,
  onUploaded,
}: {
  coverUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const { t } = useTranslation('web');
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const result = await uploadUserMediaFile(file);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUploaded(result.data.url);
  };

  return (
    <div className="flex w-33 shrink-0 flex-col gap-2">
      <Button
        variant="plain"
        size="flexible"
        aria-label={
          coverUrl
            ? t('goLivePage.showInfo.changeCover')
            : t('goLivePage.showInfo.addCover')
        }
        aria-describedby={error ? errorId : undefined}
        aria-busy={uploading || undefined}
        disabled={uploading}
        onClick={() => input.current?.click()}
        className="group border-border-input bg-background-input text-foreground-secondary hover:text-foreground focus-visible:outline-focus-ring relative flex size-33 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed text-sm focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {coverUrl ? (
          <>
            <MediaArtwork src={coverUrl} alt="" size="fill" />
            <span className="bg-background/85 text-foreground absolute inset-x-0 bottom-0 py-1.5 text-center text-xs font-semibold">
              {uploading
                ? t('goLivePage.showInfo.uploading')
                : t('goLivePage.showInfo.change')}
            </span>
          </>
        ) : (
          <>
            <ImagePlusIcon size={24} aria-hidden />
            <span className="px-2 text-center text-xs font-semibold">
              {uploading
                ? t('goLivePage.showInfo.uploading')
                : t('goLivePage.showInfo.cover')}
            </span>
          </>
        )}
      </Button>
      <HiddenFileInput
        ref={input}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onFiles={([file]) => {
          if (file) {
            void upload(file);
          }
        }}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ShowInfoCard({
  preflight,
  isLive,
  onSaved,
  footer,
}: {
  preflight: BroadcastPreflight;
  isLive: boolean;
  onSaved: (preflight: BroadcastPreflight) => void;
  footer?: ReactNode;
}) {
  const { t } = useTranslation('web');
  const headingId = useId();
  const helperId = useId();
  const [series, setSeries] = useState<StudioShowSeries[]>([]);
  const autosave = useShowInfoAutosave({ preflight, onSaved });
  const { values, edit, commit, fieldErrors } = autosave;

  useEffect(() => {
    let cancelled = false;
    void fetchShowSeries().then(({ data }) => {
      if (!cancelled) {
        setSeries(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!values) {
    return null;
  }

  const lockedHint = isLive
    ? t('goLivePage.showInfo.lockedWhileLive')
    : undefined;
  const episodeNumber =
    preflight.episodeNumber ?? preflight.plannedLiveShow?.episodeNumber ?? null;
  const coverUrl = preflight.artworkUrl ?? preflight.coverUrl;
  const message = statusText(t, autosave.status);
  const titleError = fieldError(t, fieldErrors.title, BROADCAST_TITLE_MAX);
  const taglineError = fieldError(
    t,
    fieldErrors.tagline,
    BROADCAST_TAGLINE_MAX,
  );

  return (
    <section
      aria-labelledby={headingId}
      className="border-border-subtle bg-background-secondary @container rounded-xl border p-4 sm:p-6"
    >
      <h2 id={headingId} className="font-display text-lg font-bold">
        {t('goLivePage.steps.show-info')}
      </h2>
      <p id={helperId} className="text-foreground-secondary mt-1 text-sm">
        {preflight.session === 'NONE'
          ? t('goLivePage.showInfo.helperDraft')
          : t('goLivePage.showInfo.helper')}
      </p>

      <div className="mt-5 flex flex-col gap-5 @min-[480px]:flex-row @min-[480px]:items-start">
        <CoverSlot
          coverUrl={coverUrl}
          onUploaded={(url) => autosave.saveNow({ artworkUrl: url })}
        />
        <div className="grid min-w-0 flex-1 gap-4 @min-[720px]:grid-cols-2">
          <Input
            label={t('broadcastPreflight.showName')}
            value={values.title}
            required
            aria-required
            maxLength={BROADCAST_TITLE_MAX}
            description={t('goLivePage.showInfo.nameHint', {
              max: BROADCAST_TITLE_MAX,
            })}
            error={titleError}
            onChange={(event) => edit('title', event.target.value)}
            onBlur={() => commit(['title'])}
          />
          <Input
            label={t('goLivePage.showInfo.taglineOptional')}
            value={values.tagline}
            maxLength={BROADCAST_TAGLINE_MAX}
            placeholder={t('broadcastPreflight.whatIsThisBroadcastAbout')}
            error={taglineError}
            onChange={(event) => edit('tagline', event.target.value)}
            onBlur={() => commit(['tagline'])}
          />
          <Select
            label={t('broadcastPreflight.showType')}
            value={values.showType}
            disabled={isLive}
            description={lockedHint}
            options={showTypeOptions(t)}
            onValueChange={(value) => {
              const showType = value as BroadcastPreflight['showType'];
              edit('showType', showType);
              commit(['showType'], { showType });
            }}
          />
          <Select
            label={t('broadcastPreflight.visibility')}
            value={values.visibility}
            disabled={isLive}
            description={lockedHint}
            options={visibilityOptions(t)}
            onValueChange={(value) => {
              const visibility = value as BroadcastPreflight['visibility'];
              edit('visibility', visibility);
              commit(['visibility'], { visibility });
            }}
          />
          <Select
            label={t('goLivePage.showInfo.series')}
            value={values.seriesId}
            disabled={isLive}
            description={
              lockedHint ??
              (values.seriesId && episodeNumber
                ? t('goLivePage.showInfo.episode', { number: episodeNumber })
                : undefined)
            }
            options={[
              {
                id: '',
                label: t('broadcastPreflightPanelFields.oneOffBroadcast'),
              },
              ...series.map((show) => ({ id: show.id, label: show.title })),
            ]}
            onValueChange={(seriesId) => {
              edit('seriesId', seriesId);
              const picked = series.find((show) => show.id === seriesId);
              if (picked && !values.title.trim()) {
                const title = t('goLivePage.showInfo.seriesEpisodeTitle', {
                  series: picked.title,
                  number: picked.nextEpisodeNumber,
                });
                edit('title', title);
                commit(['seriesId', 'title'], { seriesId, title });
                return;
              }
              commit(['seriesId'], { seriesId });
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex min-h-11 flex-wrap items-center gap-3">
        <p
          aria-live="polite"
          data-testid="show-info-autosave"
          data-status={autosave.status}
          className={cn(
            'text-sm',
            autosave.status === 'error'
              ? 'text-accent-red-strong'
              : 'text-foreground-secondary',
          )}
        >
          {message}
          {autosave.status === 'error' && autosave.error
            ? ` ${autosave.error}`
            : ''}
        </p>
        {autosave.status === 'error' ? (
          <Button
            variant="tertiary"
            size="sm"
            className="min-h-11"
            onClick={autosave.retry}
          >
            {t('goLivePage.autosave.retry')}
          </Button>
        ) : null}
      </div>
      {footer}
    </section>
  );
}

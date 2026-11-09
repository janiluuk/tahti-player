import { Link } from '@tanstack/react-router';
import { DownloadIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  FilePicker,
  InlineError,
  ViewShell,
} from '@tahti-player/ui';

import { fetchEditorSource } from '../../api/studio';
import type { EditorSource } from '../../api/studio-types';
import { PageBackLink } from '../../components/PageBackLink';
import { PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { decodeSourceAndReference } from '../../plugins/mastering/decodeAudio';
import type { MasteringStage } from '../../plugins/mastering/match';
import { useMasteringWorker } from '../../plugins/mastering/useMasteringWorker';

const STAGE_LABELS: Record<MasteringStage, string> = {
  'matching-levels': 'Matching loudness…',
  'matching-frequencies': 'Matching tone…',
  'correcting-levels': 'Correcting levels…',
  limiting: 'Finalizing…',
};

export function StudioMasteringView({ soundId }: { soundId: string }) {
  const { t } = useTranslation('web');
  const [source, setSource] = useState<EditorSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const { status, error, result, run, reset } = useMasteringWorker();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchEditorSource(soundId).then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      setSource(data);
      setLoadError(meta.source === 'api' && meta.reason ? meta.reason : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [soundId, attempt]);

  const handleReferenceFiles = (files: readonly File[]) => {
    setDecodeError(null);
    reset();
    setReferenceFile(files[0] ?? null);
  };

  const startMatching = async () => {
    if (!source || !referenceFile) {
      return;
    }
    setDecodeError(null);
    setDecoding(true);
    try {
      const { source: decodedSource, reference: decodedReference } =
        await decodeSourceAndReference(source.url, referenceFile);
      run(
        {
          left: decodedSource.left,
          right: decodedSource.right,
          sampleRate: decodedSource.sampleRate,
        },
        {
          left: decodedReference.left,
          right: decodedReference.right,
          sampleRate: decodedReference.sampleRate,
        },
      );
    } catch (err) {
      setDecodeError(
        err instanceof Error ? err.message : 'Could not read that audio.',
      );
    } finally {
      setDecoding(false);
    }
  };

  const busy =
    decoding || (status !== 'idle' && status !== 'done' && status !== 'error');

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <div className="flex flex-wrap gap-3 text-xs">
          <PageBackLink
            to="/library/sounds"
            label={t('studioMastering.sounds')}
          />
          <Link
            to="/studio/sounds/$id"
            params={{ id: soundId }}
            search={{ edit: true }}
            className="text-foreground-secondary hover:underline"
          >
            {t('studioMastering.metadata')}
          </Link>
          <Link
            to="/studio/sounds/$id/editor"
            params={{ id: soundId }}
            className="text-foreground-secondary hover:underline"
          >
            {t('studioMastering.audioEditor')}
          </Link>
        </div>

        <ViewShell
          title={t('studioMastering.referenceMastering')}
          classes={{ root: 'px-0 pt-0' }}
        >
          {loading ? (
            <PageLoading label={t('loading.loadingTrack')} />
          ) : loadError || !source ? (
            <PageError
              title={t('loadErrors.couldNotLoadThisTrack')}
              description={loadError ?? 'Source audio is unavailable.'}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : (
            <>
              <StudioPanel
                title={t('studioMastering.track')}
                description={source.title}
              >
                <p className="text-foreground-secondary text-sm">
                  {source.durationSec != null
                    ? `${Math.round(source.durationSec)}s — `
                    : ''}
                  This is the track that will be matched to your reference.
                </p>
              </StudioPanel>

              <StudioPanel
                title={t('studioMastering.referenceTrack')}
                description={t('studioMastering.aCommerciallyMasteredTrackOr')}
              >
                <FilePicker
                  labels={{
                    title: t('studioMasteringView.referenceTrack'),
                    description: t('studioMasteringView.dropAnAudioFileOr'),
                    browse: referenceFile
                      ? t('studioMasteringViewStates.chooseAnotherFile')
                      : t('studioMasteringViewStates.chooseFile'),
                  }}
                  accept="audio/*"
                  selectedFiles={referenceFile ? [referenceFile] : []}
                  disabled={busy}
                  onFiles={handleReferenceFiles}
                />
                {decodeError ? (
                  <InlineError className="mt-2">{decodeError}</InlineError>
                ) : null}
              </StudioPanel>

              <StudioPanel title={t('studioMastering.match')}>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void startMatching()}
                    disabled={!referenceFile || busy}
                  >
                    <SlidersHorizontalIcon
                      size={16}
                      aria-hidden
                      className="mr-1.5"
                    />
                    {t('studioMastering.matchToReference')}
                  </Button>
                  {busy ? (
                    <span className="text-foreground-secondary text-sm">
                      {status in STAGE_LABELS
                        ? STAGE_LABELS[status as MasteringStage]
                        : 'Reading audio…'}
                    </span>
                  ) : null}
                </div>

                {status === 'error' && error ? (
                  <InlineError className="mt-3">{error}</InlineError>
                ) : null}

                {status === 'done' && result ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <audio controls src={result.url} className="w-full" />
                    <ButtonAnchor
                      href={result.url}
                      download={`${source.title || 'mastered'}.wav`}
                      size="sm"
                      variant="secondary"
                      className="w-fit"
                    >
                      <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                      {t('studioMastering.downloadWav')}
                    </ButtonAnchor>
                  </div>
                ) : null}
              </StudioPanel>
            </>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}

import { Link } from '@tanstack/react-router';
import { DownloadIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

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
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { decodeSourceAndReference } from '../../plugins/mastering/decodeAudio';
import type { MasteringStage } from '../../plugins/mastering/match';
import { useMasteringWorker } from '../../plugins/mastering/useMasteringWorker';

const STAGE_LABELS = {
  'matching-levels': 'studioMasteringViewBatch31.stageMatchingLevels',
  'matching-frequencies': 'studioMasteringViewBatch31.stageMatchingFrequencies',
  'correcting-levels': 'studioMasteringViewBatch31.stageCorrectingLevels',
  limiting: 'studioMasteringViewBatch31.stageLimiting',
} as const satisfies Record<MasteringStage, string>;

export function StudioMasteringView({ soundId }: { soundId: string }) {
  const { t } = useTranslation('web');
  // The saved source only fills the page while it refreshes: its audio URL
  // may have expired, so matching waits for the fresh one and a failed
  // refresh shows the error.
  const {
    data: source,
    loading,
    refreshing,
    error: loadError,
    retry,
  } = useSnapshotFetch<EditorSource>(`mastering-source:${soundId}`, async () =>
    apiResult(await fetchEditorSource(soundId)),
  );
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const { status, error, result, run, reset } = useMasteringWorker();

  const handleReferenceFiles = (files: readonly File[]) => {
    setDecodeError(null);
    reset();
    setReferenceFile(files[0] ?? null);
  };

  const startMatching = async () => {
    if (!source || !referenceFile || refreshing) {
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
        err instanceof Error
          ? err.message
          : t('studioMasteringViewBatch31.couldNotReadAudio'),
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
            to="/studio/sounds"
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
              description={
                loadError ?? t('studioMasteringViewBatch31.sourceUnavailable')
              }
              onRetry={retry}
            />
          ) : (
            <>
              <StudioPanel
                title={t('studioMastering.track')}
                description={source.title}
              >
                <p className="text-foreground-secondary text-sm">
                  {source.durationSec != null
                    ? t('studioMasteringViewBatch31.durationPrefix', {
                        seconds: Math.round(source.durationSec),
                      })
                    : ''}
                  {t('studioMoneyText.masteringSource')}
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
                    disabled={!referenceFile || busy || refreshing}
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
                        ? t(STAGE_LABELS[status as MasteringStage])
                        : t('studioMasteringViewBatch31.readingAudio')}
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

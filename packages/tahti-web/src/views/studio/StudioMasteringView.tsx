import { Link } from '@tanstack/react-router';
import { DownloadIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonAnchor, FilePicker, ViewShell } from '@tahti-player/ui';

import { fetchEditorSource } from '../../api/studio';
import type { EditorSource } from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
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
  const [source, setSource] = useState<EditorSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const { status, error, result, run, reset } = useMasteringWorker();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEditorSource(soundId).then(({ data }) => {
      if (!cancelled) {
        setSource(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

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
        <StudioNav current="/studio/editor" />

        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/studio/sounds"
            className="text-foreground-secondary hover:underline"
          >
            ← Music
          </Link>
          <Link
            to="/studio/sounds/$id"
            params={{ id: soundId }}
            className="text-foreground-secondary hover:underline"
          >
            Metadata
          </Link>
          <Link
            to="/studio/sounds/$id/editor"
            params={{ id: soundId }}
            className="text-foreground-secondary hover:underline"
          >
            Audio editor
          </Link>
        </div>

        <ViewShell title="Reference mastering" classes={{ root: 'px-0 pt-0' }}>
          {loading || !source ? (
            <PageLoading label="Loading track…" />
          ) : (
            <>
              <StudioPanel title="Track" description={source.title}>
                <p className="text-foreground-secondary text-sm">
                  {source.durationSec != null
                    ? `${Math.round(source.durationSec)}s — `
                    : ''}
                  This is the track that will be matched to your reference.
                </p>
              </StudioPanel>

              <StudioPanel
                title="Reference track"
                description="A commercially mastered track (or any reference) you want this track to sound like."
              >
                <FilePicker
                  labels={{
                    title: 'Reference track',
                    description: 'Drop an audio file, or browse for one.',
                    browse: referenceFile
                      ? 'Choose another file'
                      : 'Choose file',
                  }}
                  accept="audio/*"
                  selectedFiles={referenceFile ? [referenceFile] : []}
                  disabled={busy}
                  onFiles={handleReferenceFiles}
                />
                {decodeError ? (
                  <p className="text-accent-red mt-2 text-sm">{decodeError}</p>
                ) : null}
              </StudioPanel>

              <StudioPanel title="Match">
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
                    Match to reference
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
                  <p className="text-accent-red mt-3 text-sm">{error}</p>
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
                      Download WAV
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

import { ActivityIcon, LoaderCircleIcon, Undo2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

import type {
  NativeAnalysisDetail,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { runAnalysis } from './LocalLibraryAnalysis';

/** Waveform of the stored peaks; decorative, the numbers below carry the meaning. */
export function Waveform({ peaks }: { peaks: number[] }) {
  if (peaks.length === 0) {
    return null;
  }
  const height = 40;
  return (
    <svg
      viewBox={`0 0 ${peaks.length} ${height}`}
      preserveAspectRatio="none"
      className="text-foreground-secondary h-10 w-full"
      role="img"
      aria-label="Waveform"
      data-testid="waveform"
    >
      {peaks.map((peak, index) => {
        const bar = Math.max(1, (peak / 255) * height);
        return (
          <rect
            key={index}
            x={index}
            y={(height - bar) / 2}
            width={0.8}
            height={bar}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

const rounded = (value: number) => Math.round(value * 10) / 10;
const percent = (value: number | null) =>
  value === null ? '' : ` (${Math.round(value * 100)}% sure)`;

/** Label/value rows for the analysis, with each value's origin spelled out. */
export function analysisRows(
  detail: NativeAnalysisDetail,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const bpm =
    detail.userBpm !== null
      ? `${rounded(detail.userBpm)} (your correction)`
      : detail.tagBpm !== null
        ? `${rounded(detail.tagBpm)} (from the file's tag)`
        : detail.bpmEstimate !== null
          ? `${rounded(detail.bpmEstimate)} (estimate${percent(detail.bpmConfidence)})`
          : '—';
  const key =
    detail.userKey !== null
      ? `${detail.userKey} (your correction)`
      : detail.tagKey !== null
        ? `${detail.tagKey} (from the file's tag)`
        : detail.keyEstimate !== null
          ? `${detail.keyEstimate} (estimate${percent(detail.keyConfidence)})`
          : '—';
  rows.push({ label: 'BPM', value: bpm }, { label: 'Key', value: key });
  if (detail.analyzed) {
    rows.push(
      {
        label: 'Loudness',
        value:
          detail.loudnessLufs === null
            ? '—'
            : `${detail.loudnessLufs.toFixed(1)} LUFS`,
      },
      {
        label: 'True peak',
        value:
          detail.truePeakDbtp === null
            ? '—'
            : `${detail.truePeakDbtp.toFixed(1)} dBTP`,
      },
    );
  }
  return rows;
}

type Props = {
  library: TahtiNativeLibrary;
  track: NativeLibraryTrack;
  onChanged?: () => void;
};

/** Waveform, analysis results and BPM/key correction for one track. */
export function TrackAnalysisSection({ library, track, onChanged }: Props) {
  const [detail, setDetail] = useState<NativeAnalysisDetail | null>(null);
  const [bpmText, setBpmText] = useState('');
  const [keyText, setKeyText] = useState('');
  const [busy, setBusy] = useState<'analyze' | 'save' | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await library.analysis.detail(track.id);
      setDetail(next);
      setBpmText(next.userBpm === null ? '' : String(next.userBpm));
      setKeyText(next.userKey ?? '');
    } catch {
      setDetail(null);
    }
  }, [library, track.id]);

  useEffect(() => {
    setDetail(null);
    void load();
  }, [load]);

  const analyze = async () => {
    setBusy('analyze');
    try {
      await runAnalysis(library, [track.id], true);
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!detail) {
      return;
    }
    const bpm = bpmText.trim() === '' ? 0 : Number(bpmText);
    if (!Number.isFinite(bpm)) {
      toast.error('BPM must be a number.');
      return;
    }
    setBusy('save');
    try {
      const undo = await library.analysis.setCorrections(
        [track.id],
        bpm,
        keyText.trim(),
      );
      await load();
      onChanged?.();
      toast.success('Correction saved.', {
        action: {
          label: 'Undo',
          onClick: () => {
            void library.analysis
              .restoreCorrections(undo)
              .then(() => load())
              .then(() => onChanged?.())
              .catch((failure: unknown) =>
                toast.error(
                  failure instanceof Error
                    ? failure.message
                    : 'Could not undo.',
                ),
              );
          },
        },
      });
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not save.',
      );
    } finally {
      setBusy(null);
    }
  };

  if (!track.available) {
    return null;
  }
  const dirty =
    detail !== null &&
    (bpmText.trim() !==
      (detail.userBpm === null ? '' : String(detail.userBpm)) ||
      keyText.trim() !== (detail.userKey ?? ''));
  return (
    <section data-testid="track-analysis">
      <h3 className="mb-1 text-sm font-semibold">Analysis</h3>
      {detail?.analyzed ? <Waveform peaks={detail.peaks} /> : null}
      {detail ? (
        <dl className="mt-1 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
          {analysisRows(detail).map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-foreground-secondary">{row.label}</dt>
              <dd className="min-w-0 break-words">{row.value}</dd>
            </div>
          ))}
          <div className="contents">
            <dt className="text-foreground-secondary">Status</dt>
            <dd>
              {!detail.analyzed
                ? 'Not analyzed yet'
                : detail.stale
                  ? 'Out of date — the file or the analysis changed'
                  : `Analyzed ${detail.analyzedAt ?? ''} UTC`}
            </dd>
          </div>
        </dl>
      ) : null}
      <p className="text-foreground-secondary mt-1 text-xs">
        BPM and key are estimates and can be wrong (half or double tempo,
        relative major/minor). Correct them below; corrections are never
        overwritten by re-analysis.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Input
          type="number"
          label="Your BPM"
          placeholder={
            detail?.bpmEstimate ? String(rounded(detail.bpmEstimate)) : ''
          }
          value={bpmText}
          onChange={(event) => setBpmText(event.target.value)}
        />
        <Input
          label="Your key"
          placeholder={detail?.keyEstimate ?? 'Am, F#, 8A'}
          value={keyText}
          onChange={(event) => setKeyText(event.target.value)}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={!dirty || busy !== null}
          onClick={() => void save()}
        >
          {busy === 'save' ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Save correction
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={busy !== null}
          onClick={() => void analyze()}
        >
          {busy === 'analyze' ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : detail?.analyzed ? (
            <Undo2Icon size={14} aria-hidden />
          ) : (
            <ActivityIcon size={14} aria-hidden />
          )}
          {detail?.analyzed ? 'Re-analyze' : 'Analyze'}
        </Button>
      </div>
    </section>
  );
}

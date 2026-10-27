import { ActivityIcon, HandIcon, Undo2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Loader, Tooltip } from '@tahti-player/ui';

import {
  addTap,
  bpmInputError,
  doubleBpm,
  halveBpm,
  tempoFromTaps,
} from '../lib/bpm';
import {
  formatKey,
  keyInputError,
  keyName,
  parseKey,
  type KeyNotation,
} from '../lib/musicalKey';
import type {
  NativeAnalysisDetail,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { useDjPrefsStore } from '../stores/djPrefsStore';
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
  notation: KeyNotation = 'musical',
): Array<{ label: string; value: string }> {
  const showKey = (raw: string) => {
    const shown = formatKey(raw, notation) ?? raw;
    const key = parseKey(raw);
    return notation !== 'musical' && key ? `${shown} · ${keyName(key)}` : shown;
  };
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
      ? `${showKey(detail.userKey)} (your correction)`
      : detail.tagKey !== null
        ? `${showKey(detail.tagKey)} (from the file's tag)`
        : detail.keyEstimate !== null
          ? `${showKey(detail.keyEstimate)} (estimate${percent(detail.keyConfidence)})`
          : '—';
  rows.push({ label: 'BPM', value: bpm }, { label: 'Key', value: key });
  const replayGain = (gain?: number | null, peak?: number | null) =>
    gain == null
      ? null
      : `${gain > 0 ? '+' : ''}${gain.toFixed(2)} dB${peak == null ? '' : `, peak ${peak.toFixed(3)}`}`;
  const trackGain = replayGain(
    detail.replaygainTrackGain,
    detail.replaygainTrackPeak,
  );
  const albumGain = replayGain(
    detail.replaygainAlbumGain,
    detail.replaygainAlbumPeak,
  );
  if (trackGain) {
    rows.push({ label: 'ReplayGain (track)', value: trackGain });
  }
  if (albumGain) {
    rows.push({ label: 'ReplayGain (album)', value: albumGain });
  }
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
  const [taps, setTaps] = useState<number[]>([]);
  const notation = useDjPrefsStore((state) => state.keyNotation);
  const bpmError = bpmInputError(bpmText);
  const keyError = keyInputError(keyText);
  const tapped = tempoFromTaps(taps);
  const baseBpm =
    bpmText.trim() !== '' && !bpmError
      ? Number(bpmText)
      : (detail?.bpm ?? null);
  const half = baseBpm ? halveBpm(baseBpm) : null;
  const double = baseBpm ? doubleBpm(baseBpm) : null;

  const tap = () => {
    const next = addTap(taps, performance.now());
    setTaps(next);
    const bpm = tempoFromTaps(next);
    if (bpm !== null) {
      setBpmText(String(bpm));
    }
  };

  const load = useCallback(async () => {
    try {
      const next = await library.analysis.detail(track.id);
      setDetail(next);
      setBpmText(next.userBpm === null ? '' : String(next.userBpm));
      setKeyText(next.userKey ?? '');
      setTaps([]);
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
    if (bpmError || keyError) {
      return;
    }
    const bpm = bpmText.trim() === '' ? 0 : Number(bpmText);
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
          {analysisRows(detail, notation).map((row) => (
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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            type="number"
            label="Your BPM"
            placeholder={
              detail?.bpmEstimate ? String(rounded(detail.bpmEstimate)) : ''
            }
            value={bpmText}
            error={bpmError ?? undefined}
            onChange={(event) => setBpmText(event.target.value)}
          />
          <Input
            label="Your key"
            placeholder={detail?.keyEstimate ?? 'Am, F#, 8A'}
            value={keyText}
            error={keyError ?? undefined}
            onChange={(event) => setKeyText(event.target.value)}
          />
        </div>
        <div
          className="mt-2 flex flex-wrap items-center gap-1"
          data-testid="bpm-tools"
        >
          <Tooltip content="Tap along with the beat" side="top">
            <Button
              size="sm"
              variant="text"
              className="gap-1.5"
              onClick={tap}
              aria-label="Tap tempo"
            >
              <HandIcon size={14} aria-hidden />
              Tap
            </Button>
          </Tooltip>
          <span
            className="text-foreground-secondary text-xs tabular-nums"
            aria-live="polite"
          >
            {taps.length === 0
              ? 'Tap along with the beat to set the BPM.'
              : tapped === null
                ? 'Keep tapping…'
                : `${tapped} BPM from ${taps.length} taps`}
          </span>
          <Button
            size="sm"
            variant="text"
            disabled={half === null}
            onClick={() => half !== null && setBpmText(String(half))}
            aria-label={
              half === null ? 'Half tempo' : `Half tempo, ${half} BPM`
            }
          >
            ½×
          </Button>
          <Button
            size="sm"
            variant="text"
            disabled={double === null}
            onClick={() => double !== null && setBpmText(String(double))}
            aria-label={
              double === null ? 'Double tempo' : `Double tempo, ${double} BPM`
            }
          >
            2×
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={!dirty || busy !== null || !!bpmError || !!keyError}
            type="submit"
            className="gap-1.5"
          >
            {busy === 'save' ? <Loader size="inline" shape="circle" /> : null}
            Save correction
          </Button>
          <Button
            size="sm"
            variant="text"
            disabled={busy !== null}
            onClick={() => void analyze()}
            className="gap-1.5"
          >
            {busy === 'analyze' ? (
              <Loader size="inline" shape="circle" />
            ) : detail?.analyzed ? (
              <Undo2Icon size={14} aria-hidden />
            ) : (
              <ActivityIcon size={14} aria-hidden />
            )}
            {detail?.analyzed ? 'Re-analyze' : 'Analyze'}
          </Button>
        </div>
      </form>
    </section>
  );
}

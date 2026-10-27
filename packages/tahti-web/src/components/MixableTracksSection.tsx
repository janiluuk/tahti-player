import { ListPlusIcon, PlayIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Loader, Tooltip } from '@tahti-player/ui';

import { roundBpm } from '../lib/bpm';
import { findMixableTracks, type MixableMatch } from '../lib/mixableTracks';
import { formatKey, parseKey, RELATION_LABEL } from '../lib/musicalKey';
import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { useDjPrefsStore } from '../stores/djPrefsStore';
import { prepareTracks } from './desktop-library/prepareTracks';

type Props = {
  library: TahtiNativeLibrary;
  track: NativeLibraryTrack;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
};

function shiftLabel(
  shift: number | null,
  from: number | null,
  to: number | null,
): string {
  if (shift === null) {
    return '';
  }
  const percent = shift === 0 ? '' : `${shift > 0 ? '+' : ''}${shift}%`;
  const ratio = from && to ? to / from : 1;
  const scale = ratio < 0.75 ? 'half tempo' : ratio > 1.5 ? 'double tempo' : '';
  return [scale, percent].filter(Boolean).join(' ') || 'same tempo';
}

export function MixableTracksSection({
  library,
  track,
  onPlay,
  onQueue,
}: Props) {
  const notation = useDjPrefsStore((state) => state.keyNotation);
  const tolerancePercent = useDjPrefsStore((state) => state.bpmTolerance);
  const halfDouble = useDjPrefsStore((state) => state.halfDouble);
  const [matches, setMatches] = useState<MixableMatch[] | null>(null);
  const [failed, setFailed] = useState(false);
  const searchable = Boolean(track.bpm) || parseKey(track.musicalKey) !== null;

  useEffect(() => {
    setMatches(null);
    setFailed(false);
    if (!searchable) {
      return;
    }
    let cancelled = false;
    findMixableTracks(library, track, { tolerancePercent, halfDouble })
      .then((found) => !cancelled && setMatches(found))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [library, track, tolerancePercent, halfDouble, searchable]);

  return (
    <section data-testid="mixable-tracks">
      <h3 className="mb-1 text-sm font-semibold">Mixes well with</h3>
      <p className="text-foreground-secondary mb-2 text-xs">
        Tracks in a neighbouring key on the Camelot wheel, within ±
        {tolerancePercent}% of{' '}
        {track.bpm ? `${roundBpm(track.bpm)} BPM` : 'this tempo'}
        {halfDouble ? ', counting half and double tempo' : ''}. Change this
        under DJ settings above the track list.
      </p>
      {!searchable ? (
        <p className="text-sm">
          Analyze this track or set its BPM and key first. Matches need at least
          one of them.
        </p>
      ) : failed ? (
        <p className="text-sm">Could not look for mixable tracks.</p>
      ) : matches === null ? (
        <Loader size="inline" shape="circle" />
      ) : matches.length === 0 ? (
        <p className="text-sm">
          Nothing in your library matches yet. Widen the tempo range or analyze
          more tracks.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {matches.map((match) => (
            <li
              key={match.track.id}
              className="flex items-center gap-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {match.track.title}
                <span className="text-foreground-secondary">
                  {' '}
                  · {match.track.artist || 'Unknown artist'}
                </span>
              </span>
              <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                {[
                  formatKey(match.track.musicalKey, notation),
                  match.track.bpm ? `${roundBpm(match.track.bpm)} BPM` : null,
                  shiftLabel(match.bpmShift, track.bpm, match.track.bpm) ||
                    null,
                  match.relation ? RELATION_LABEL[match.relation] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <Tooltip content="Play" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Play ${match.track.title}`}
                  onClick={() => onPlay(match.track)}
                >
                  <PlayIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Add to queue" side="top">
                <Button
                  size="sm"
                  variant="text"
                  aria-label={`Queue ${match.track.title}`}
                  onClick={() => onQueue(match.track)}
                >
                  Queue
                </Button>
              </Tooltip>
              <Tooltip content="Add to the Prepare playlist" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Add ${match.track.title} to Prepare`}
                  onClick={() => void prepareTracks([match.track.id])}
                >
                  <ListPlusIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

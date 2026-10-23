import type { TrackComment } from '../api/types';
import { formatDuration } from './playableToTrack';
import { parseTimedComment } from './timedComment';

export type WaveformMarker = {
  /** 0..1 position on the waveform. */
  fraction: number;
  seconds: number;
  /** Tooltip / accessible name, e.g. "1:05 · Aino: love this break". */
  label: string;
  count: number;
};

const GROUP_GAP_FRACTION = 0.015;
const TEXT_LIMIT = 80;

function clip(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > TEXT_LIMIT
    ? `${trimmed.slice(0, TEXT_LIMIT - 1)}…`
    : trimmed;
}

/** Timed comments as waveform markers. Comments closer than 1.5% of the
 * track share one marker so they don't stack into an unclickable pile. */
export function buildCommentMarkers(
  comments: TrackComment[],
  totalDuration: number,
): WaveformMarker[] {
  if (!(totalDuration > 0)) {
    return [];
  }
  const timed = comments
    .flatMap((comment) => {
      const parsed = parseTimedComment(comment.body);
      if (parsed.seconds == null || parsed.seconds > totalDuration) {
        return [];
      }
      return [{ comment, seconds: parsed.seconds, text: parsed.text }];
    })
    .sort((a, b) => a.seconds - b.seconds);

  const groups: (typeof timed)[] = [];
  for (const entry of timed) {
    const group = groups[groups.length - 1];
    const first = group?.[0];
    if (
      group &&
      first &&
      (entry.seconds - first.seconds) / totalDuration < GROUP_GAP_FRACTION
    ) {
      group.push(entry);
    } else {
      groups.push([entry]);
    }
  }

  return groups.map((group) => {
    const first = group[0]!;
    const clock = formatDuration(first.seconds);
    const author =
      first.comment.authorDisplayName || first.comment.authorUsername;
    const label =
      group.length === 1
        ? `${clock} · ${author}: ${clip(first.text)}`
        : `${clock} · ${group.length} comments`;
    return {
      fraction: first.seconds / totalDuration,
      seconds: first.seconds,
      label,
      count: group.length,
    };
  });
}

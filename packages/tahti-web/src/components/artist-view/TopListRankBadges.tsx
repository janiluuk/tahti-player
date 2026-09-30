import { Link } from '@tanstack/react-router';
import { TrophyIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import { fetchTopListRanks } from '../../api/top-list-ranks';
import type { TahtiPlayable } from '../../api/types';
import { soundIdFromPlayableId } from '../../lib/soundId';

/** "#3 Night Drive" badges for the tracks currently in Tahti's top lists. */
export function TopListRankBadges({ items }: { items: TahtiPlayable[] }) {
  const tracks = useMemo(
    () =>
      items.flatMap((item) => {
        const soundId = soundIdFromPlayableId(item.id);
        return soundId ? [{ soundId, title: item.title }] : [];
      }),
    [items],
  );
  const idsKey = tracks.map((track) => track.soundId).join(',');
  const [ranks, setRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    void fetchTopListRanks(idsKey ? idsKey.split(',') : []).then((result) => {
      if (!cancelled) {
        setRanks(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const ranked = tracks
    .filter((track) => ranks[track.soundId] !== undefined)
    .sort((a, b) => ranks[a.soundId]! - ranks[b.soundId]!);

  if (ranked.length === 0) {
    return null;
  }

  return (
    <ul
      className="mb-3 flex flex-wrap gap-2"
      aria-label="In the top lists"
      data-testid="top-list-ranks"
    >
      {ranked.map((track) => (
        <li key={track.soundId}>
          <Link to="/t/$id" params={{ id: track.soundId }}>
            <Badge variant="pill" color="yellow" className="gap-1">
              <TrophyIcon size={12} aria-hidden />#{ranks[track.soundId]}{' '}
              {track.title}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

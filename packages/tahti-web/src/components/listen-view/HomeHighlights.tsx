import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { Card, CardsRow } from '@tahti-player/ui';

import type { FetchMeta } from '../../api/client';
import { fetchTahtiSelects, fetchTopTracks } from '../../api/discover';
import {
  fetchLatestReleases,
  type LatestRelease,
} from '../../api/latest-releases';
import { isForceMock } from '../../api/mode';
import type { DiscoverTrackItem } from '../../api/types';
import { useDiscoverTrackPlayback } from '../../hooks/useDiscoverTrackPlayback';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { ListenSection } from './ListenSection';
import type { ListenSectionStatus } from './useListenSections';

const ROW_LABELS = {
  filterPlaceholder: 'Filter…',
  nothingFound: 'Nothing matches that filter.',
};

type Section<T> = { data: T[]; status: ListenSectionStatus };

function useSection<T>(
  load: () => Promise<{ data: T[]; meta: FetchMeta }>,
): Section<T> & { retry: () => void } {
  const [state, setState] = useState<Section<T>>({
    data: [],
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    void load().then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      const failed = Boolean(meta.reason) && !isForceMock();
      setState({ data, status: failed ? 'error' : 'ready' });
    });
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}

type TrackRowItem = {
  id: string;
  title: string;
  track: DiscoverTrackItem;
  rank?: number;
};

function TrackCard({
  track,
  rank,
}: {
  track: DiscoverTrackItem;
  rank?: number;
}) {
  const navigate = useNavigate();
  const { isPlaying, loading, togglePlay, queue } =
    useDiscoverTrackPlayback(track);
  const soundId = track.id.replace(/^sound:/, '');
  return (
    <Card
      surface="neutral"
      src={track.coverUrl ?? placeholderArtworkUrl(soundId)}
      title={
        <Link to="/t/$id" params={{ id: soundId }} className="hover:underline">
          {rank ? `${rank}. ` : ''}
          {track.title}
        </Link>
      }
      subtitle={
        <Link
          to="/channel/$slug"
          params={{ slug: track.channelSlug }}
          className="hover:underline"
        >
          {track.artist}
        </Link>
      }
      isPlaying={isPlaying}
      playDisabled={loading}
      playLabel={`Play ${track.title}`}
      pauseLabel={`Pause ${track.title}`}
      onPlay={() => void togglePlay()}
      onQueue={() => void queue()}
      queueLabel={`Add ${track.title} to queue`}
      onClick={() => void navigate({ to: '/t/$id', params: { id: soundId } })}
    />
  );
}

const renderTrack = ({ track, rank }: TrackRowItem) => (
  <TrackCard track={track} rank={rank} />
);

const loadSelects = () => fetchTahtiSelects();
const loadTrending = () =>
  fetchTopTracks('week', 'desc', { genres: [], contentTypes: [] });
const loadReleases = () => fetchLatestReleases(12);

/** Curated Tahti Selects picks, with their artwork. */
export function TahtiSelectsRow() {
  const selects = useSection(loadSelects);
  const items: TrackRowItem[] = selects.data.map((track) => ({
    id: track.id,
    title: track.title,
    track,
  }));
  return (
    <ListenSection
      data-testid="listen-tahti-selects"
      title="Tahti Selects"
      badge="Curated"
      badgeColor="orange"
      status={selects.status}
      empty={items.length === 0}
      emptyTitle="No Selects picks yet"
      onRetry={selects.retry}
    >
      <CardsRow
        data-testid="listen-tahti-selects"
        title="Tahti Selects"
        badge="Curated"
        badgeColor="orange"
        items={items}
        labels={ROW_LABELS}
        renderItem={renderTrack}
      />
    </ListenSection>
  );
}

/** The most played tracks of the past week, ranked. */
export function TrendingRow() {
  const trending = useSection(loadTrending);
  const items: TrackRowItem[] = trending.data
    .slice(0, 12)
    .map((track, index) => ({
      id: track.id,
      title: track.title,
      track,
      rank: index + 1,
    }));
  return (
    <ListenSection
      data-testid="listen-trending"
      title="Trending this week"
      badge="Top plays"
      badgeColor="purple"
      status={trending.status}
      empty={items.length === 0}
      emptyTitle="Nothing has been played this week yet"
      onRetry={trending.retry}
    >
      <CardsRow
        data-testid="listen-trending"
        title="Trending this week"
        badge="Top plays"
        badgeColor="purple"
        items={items}
        labels={ROW_LABELS}
        renderItem={renderTrack}
      />
    </ListenSection>
  );
}

function releaseTypeLabel(type: string): string {
  if (type.length <= 2) {
    return type.toUpperCase();
  }
  return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
}

type ReleaseRowItem = { id: string; title: string; release: LatestRelease };

function ReleaseCard({ release }: { release: LatestRelease }) {
  const navigate = useNavigate();
  const type = releaseTypeLabel(release.type);
  return (
    <Card
      surface="neutral"
      src={release.artworkUrl ?? placeholderArtworkUrl(release.id)}
      title={
        <Link
          to="/r/$slug"
          params={{ slug: release.smartLinkSlug }}
          className="hover:underline"
        >
          {release.title}
        </Link>
      }
      subtitle={
        release.artistUsername ? (
          <Link
            to="/u/$username"
            params={{ username: release.artistUsername }}
            className="hover:underline"
          >
            {`${type} · ${release.artistDisplayName}`}
          </Link>
        ) : (
          `${type} · ${release.artistDisplayName}`
        )
      }
      onClick={() =>
        void navigate({
          to: '/r/$slug',
          params: { slug: release.smartLinkSlug },
        })
      }
    />
  );
}

/** Newest published releases from Tahti artists. */
export function NewReleasesRow() {
  const releases = useSection(loadReleases);
  const items: ReleaseRowItem[] = releases.data
    .filter((release) => Boolean(release.smartLinkSlug))
    .map((release) => ({ id: release.id, title: release.title, release }));
  return (
    <ListenSection
      data-testid="listen-new-releases"
      title="New releases"
      badge="Releases"
      badgeColor="blue"
      status={releases.status}
      empty={items.length === 0}
      emptyTitle="No releases yet"
      onRetry={releases.retry}
    >
      <CardsRow
        data-testid="listen-new-releases"
        title="New releases"
        badge="Releases"
        badgeColor="blue"
        items={items}
        labels={ROW_LABELS}
        renderItem={({ release }: ReleaseRowItem) => (
          <ReleaseCard release={release} />
        )}
      />
    </ListenSection>
  );
}

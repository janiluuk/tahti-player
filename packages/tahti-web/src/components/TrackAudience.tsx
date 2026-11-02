import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { SoundAudience, type SoundAudiencePerson } from '@tahti-player/ui';

import {
  fetchSoundAudience,
  type SoundAudience as SoundAudienceData,
  type SoundAudiencePersonWire,
} from '../api/sound-audience';
import { storyDate } from '../lib/storyDate';
import { PageError, PageLoading } from './PageStates';

type Load =
  | { state: 'loading' }
  | { state: 'error'; reason: string }
  | { state: 'ready'; data: SoundAudienceData };

function toPerson(
  person: SoundAudiencePersonWire,
  meta: string,
): SoundAudiencePerson {
  return {
    id: person.username,
    name: person.displayName || person.username,
    username: person.username,
    avatarUrl: person.avatarUrl,
    href: `/u/${person.username}`,
    meta,
  };
}

function playsLabel(plays: number): string {
  return plays === 1 ? 'Played once' : `Played ${plays}×`;
}

/** The sound page's Collections / Liked / Reposted / Played by widget. */
export function TrackAudience({
  channelSlug,
  soundId,
}: {
  channelSlug: string;
  soundId: string;
}) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoad({ state: 'loading' });
    void fetchSoundAudience(channelSlug, soundId).then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      setLoad(
        meta.source === 'api' && meta.reason
          ? { state: 'error', reason: meta.reason }
          : { state: 'ready', data },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [channelSlug, soundId, attempt]);

  if (load.state === 'loading') {
    return <PageLoading label="Loading listeners…" />;
  }
  if (load.state === 'error') {
    return (
      <PageError
        title="Could not load who listened"
        description={load.reason}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const { collections, likes, reposts, plays } = load.data;
  return (
    <SoundAudience
      collections={collections.items.map((collection) => ({
        id: collection.slug,
        name: collection.name,
        coverUrl: collection.coverUrl,
        href: `/u/${collection.ownerUsername}/c/${collection.slug}`,
        meta: `by ${collection.ownerName} · ${collection.itemCount} ${collection.itemCount === 1 ? 'track' : 'tracks'}`,
      }))}
      likers={likes.items.map((p) => toPerson(p, storyDate(p.at)))}
      reposters={reposts.items.map((p) => toPerson(p, storyDate(p.at)))}
      listeners={plays.items.map((p) => toPerson(p, playsLabel(p.plays)))}
      counts={{
        collections: collections.total,
        likes: likes.total,
        reposts: reposts.total,
        plays: plays.total,
      }}
      renderLink={(href, children) => (
        <Link to={href} className="block no-underline">
          {children}
        </Link>
      )}
    />
  );
}

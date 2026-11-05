import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  SoundAudience,
  type SoundAudiencePerson,
  type TabsItem,
} from '@tahti-player/ui';

import {
  fetchSoundAudience,
  type SoundAudience as SoundAudienceData,
  type SoundAudiencePersonWire,
  type SoundAudienceTab,
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
  leadingTabs,
  iconOnlyTabs = false,
}: {
  channelSlug: string;
  soundId: string;
  /** Tabs before the audience ones, e.g. the track's Info. */
  leadingTabs?: TabsItem[];
  iconOnlyTabs?: boolean;
}) {
  const { t } = useTranslation('web');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState<SoundAudienceTab | null>(null);

  const showMore = (tab: SoundAudienceTab) => {
    if (load.state !== 'ready' || loadingMore) {
      return;
    }
    const offset = load.data[tab].items.length;
    setLoadingMore(tab);
    void fetchSoundAudience(channelSlug, soundId, { tab, offset }).then(
      ({ data, meta }) => {
        setLoadingMore(null);
        if (meta.source === 'api' && meta.reason) {
          return;
        }
        setLoad((current) =>
          current.state !== 'ready'
            ? current
            : {
                state: 'ready',
                data: {
                  ...current.data,
                  [tab]: {
                    total: current.data[tab].total,
                    items: [...current.data[tab].items, ...data[tab].items],
                  },
                },
              },
        );
      },
    );
  };

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
    return <PageLoading label={t('loading.loadingListeners')} />;
  }
  if (load.state === 'error') {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadWhoListened')}
        description={load.reason}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  const { collections, likes, reposts, plays } = load.data;
  return (
    <SoundAudience
      leadingTabs={leadingTabs}
      iconOnlyTabs={iconOnlyTabs}
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
      renderMore={(tab) => (
        <Button
          size="xs"
          variant="text"
          className="self-start"
          disabled={loadingMore === tab}
          onClick={() => showMore(tab)}
        >
          {loadingMore === tab ? 'Loading…' : 'Show more'}
        </Button>
      )}
      renderLink={(href, children) => (
        <Link to={href} className="block no-underline">
          {children}
        </Link>
      )}
    />
  );
}

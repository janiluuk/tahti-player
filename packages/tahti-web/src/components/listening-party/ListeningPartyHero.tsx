import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Badge, MediaArtwork } from '@tahti-player/ui';

import type { ListeningPartyDto } from '../../api/listening-parties';
import type { ListeningPartyClock } from '../../hooks/useListeningPartyTimeline';
import { safeCreditName } from '../../lib/displayName';
import { listeningPartyDurationSec } from '../../lib/listeningPartyTimeline';
import { dateLocaleTag } from '../../lib/locale';
import { Eyebrow } from '../tahti/Eyebrow';
import {
  formatCountdown,
  formatRunningTime,
  PARTY_START_FORMAT,
} from './format';

function stateLabel(t: TFunction<'web'>) {
  return {
    SCHEDULED: {
      text: t('listeningPartyHeroMore.listeningParty'),
      tone: 'primary',
    },
    LIVE: { text: t('listeningPartyHeroMore.liveNow'), tone: 'green' },
    ENDED: { text: t('listeningPartyHeroMore.ended'), tone: 'muted' },
    CANCELED: { text: t('listeningPartyHeroMore.canceled'), tone: 'red' },
  } as const;
}

function StateLine({
  party,
  clock,
}: {
  party: ListeningPartyDto;
  clock: ListeningPartyClock;
}) {
  const { t } = useTranslation('web');
  switch (clock.state) {
    case 'SCHEDULED':
      return (
        <p className="text-lg font-semibold tabular-nums" role="timer">
          <span className="text-foreground-secondary mr-2 text-sm font-normal">
            {t('listeningPartyHero.startsIn')}
          </span>
          {formatCountdown(clock.msUntilStart)}
        </p>
      );
    case 'LIVE': {
      const track = party.tracks.find(
        (row) => row.id === clock.nowPlaying?.trackId,
      );
      return (
        <p className="text-sm">
          <span className="text-foreground-secondary">
            {t('listeningPartyHero.playingNow')}{' '}
          </span>
          <span className="font-semibold tabular-nums">
            {clock.nowPlaying?.position}/{party.tracks.length}
          </span>
          {track ? (
            <span className="font-semibold"> · {track.title}</span>
          ) : null}
          <span className="text-foreground-secondary">
            {' '}
            · ends{' '}
            {clock.endAt.toLocaleTimeString(dateLocaleTag(), {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </p>
      );
    }
    case 'ENDED':
      return (
        <p className="text-foreground-secondary text-sm">
          This listening party has ended. Thanks for listening.
          {party.release.smartLinkSlug && !party.release.isPreRelease ? (
            <>
              {' '}
              <Link
                to="/r/$slug"
                params={{ slug: party.release.smartLinkSlug }}
                className="text-primary-strong hover:underline"
              >
                {t('listeningPartyHero.openTheRelease')}
              </Link>
            </>
          ) : null}
        </p>
      );
    case 'CANCELED':
      return (
        <p className="text-foreground-secondary text-sm">
          {t('listeningPartyHero.theArtistCanceledThisListening')}
        </p>
      );
  }
}

/** Artwork, title, host and start time, with a countdown before the party
 * and state-specific copy once it is live, over or canceled. `actions`
 * holds the Join control. */
export function ListeningPartyHero({
  party,
  clock,
  actions,
}: {
  party: ListeningPartyDto;
  clock: ListeningPartyClock;
  actions?: ReactNode;
}) {
  const { t } = useTranslation('web');
  const { release, host, channel } = party;
  const label = stateLabel(t)[clock.state];
  const runningTime = formatRunningTime(
    listeningPartyDurationSec(party.tracks),
  );
  return (
    <section
      aria-label={t('listeningPartyHero.listeningParty')}
      className="border-border bg-background-secondary flex flex-col gap-5 rounded-xl border p-4 sm:flex-row sm:p-6"
    >
      <MediaArtwork
        src={release.artworkUrl ?? undefined}
        alt={`${release.title} cover`}
        size="lg"
        className="rounded-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow tone={label.tone}>{label.text}</Eyebrow>
          {release.isPreRelease ? (
            <Badge variant="pill" color="purple">
              {t('listeningPartyHero.preRelease')}
            </Badge>
          ) : null}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold break-words">{release.title}</h2>
          <p className="text-foreground-secondary text-sm">
            {release.type.toLowerCase()} · hosted by{' '}
            <Link
              to="/u/$username"
              params={{ username: host.username }}
              className="text-foreground hover:underline"
            >
              {safeCreditName(host.displayName, host.username)}
            </Link>{' '}
            on{' '}
            <Link
              to="/channel/$slug"
              params={{ slug: channel.slug }}
              className="text-foreground hover:underline"
            >
              {channel.name}
            </Link>
          </p>
        </div>
        <p className="text-sm">
          <time dateTime={party.startAt}>
            {new Date(party.startAt).toLocaleString(
              undefined,
              PARTY_START_FORMAT,
            )}
          </time>
          <span className="text-foreground-secondary">
            {' '}
            · {party.tracks.length} tracks · {runningTime}
          </span>
        </p>
        <StateLine party={party} clock={clock} />
        {party.hostNote && clock.state !== 'CANCELED' ? (
          <blockquote className="border-primary/40 text-foreground-secondary border-l-2 pl-3 text-sm whitespace-pre-wrap">
            {party.hostNote}
          </blockquote>
        ) : null}
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

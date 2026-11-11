import { Link } from '@tanstack/react-router';
import { PartyPopperIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, MediaArtwork } from '@tahti-player/ui';

import type { ListeningPartySummaryDto } from '../../api/listening-parties';
import { Eyebrow } from '../tahti/Eyebrow';
import { PARTY_START_FORMAT } from './format';

export function ListeningPartyList({
  parties,
  'data-testid': testId = 'listening-party-list',
}: {
  parties: ListeningPartySummaryDto[];
  'data-testid'?: string;
}) {
  const { t } = useTranslation('web');
  return (
    <ul className="divide-border flex flex-col divide-y" data-testid={testId}>
      {parties.map((party) => {
        const live = party.state === 'LIVE';
        return (
          <li
            key={party.id}
            data-testid="listening-party-row"
            className="flex flex-wrap items-center gap-3 py-3"
          >
            <MediaArtwork
              src={party.release.artworkUrl ?? undefined}
              alt=""
              seed={party.release.id}
              size="thumb"
              className="rounded-md"
            />
            <div className="min-w-0 flex-1">
              <Eyebrow tone={live ? 'green' : 'primary'}>
                {live
                  ? t('channelListeningPartyBannerStates.listeningPartyLiveNow')
                  : t('channelListeningPartyBannerStates.listeningParty')}
              </Eyebrow>
              <p className="truncate font-medium">{party.release.title}</p>
              <p className="text-foreground-secondary flex flex-wrap gap-x-2 text-xs">
                <Link
                  to="/channel/$slug"
                  params={{ slug: party.channel.slug }}
                  className="hover:underline"
                >
                  {party.channel.name}
                </Link>
                {live ? null : (
                  <time dateTime={party.startAt}>
                    {new Date(party.startAt).toLocaleString(
                      undefined,
                      PARTY_START_FORMAT,
                    )}
                  </time>
                )}
              </p>
            </div>
            <ButtonLink
              to="/party/$id"
              params={{ id: party.id }}
              size="sm"
              variant={live ? 'default' : 'secondary'}
              aria-label={t('discoverParties.openNamed', {
                title: party.release.title,
              })}
            >
              <PartyPopperIcon size={14} aria-hidden className="mr-1.5" />
              {live
                ? t('channelListeningPartyBannerStates.joinNow')
                : t('channelListeningPartyBannerStates.openParty')}
            </ButtonLink>
          </li>
        );
      })}
    </ul>
  );
}

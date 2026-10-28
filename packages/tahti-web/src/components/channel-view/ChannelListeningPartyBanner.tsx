import { PartyPopperIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ButtonLink, MediaArtwork } from '@tahti-player/ui';

import {
  fetchChannelListeningParties,
  type ListeningPartySummaryDto,
} from '../../api/listening-parties';
import { PARTY_START_FORMAT } from '../listening-party/format';
import { Eyebrow } from '../tahti/Eyebrow';

/** The channel's live listening party, or its next upcoming one, linking to
 * the party page. Renders nothing when there is none or the list fails. */
export function ChannelListeningPartyBanner({ slug }: { slug: string }) {
  const [party, setParty] = useState<ListeningPartySummaryDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    setParty(null);
    void fetchChannelListeningParties(slug).then(({ data }) => {
      if (!cancelled) {
        setParty(
          data.find((row) => row.state === 'LIVE') ??
            data.find((row) => row.state === 'SCHEDULED') ??
            null,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!party) {
    return null;
  }
  const live = party.state === 'LIVE';
  return (
    <section
      aria-label="Listening party"
      className="border-border bg-background-secondary flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
    >
      <MediaArtwork
        src={party.release.artworkUrl ?? undefined}
        alt=""
        size="thumb"
        className="rounded-md"
      />
      <div className="min-w-0 flex-1">
        <Eyebrow tone={live ? 'green' : 'primary'}>
          {live ? 'Listening party · live now' : 'Listening party'}
        </Eyebrow>
        <p className="truncate font-medium">{party.release.title}</p>
        {live ? null : (
          <time
            dateTime={party.startAt}
            className="text-foreground-secondary text-xs"
          >
            {new Date(party.startAt).toLocaleString(
              undefined,
              PARTY_START_FORMAT,
            )}
          </time>
        )}
      </div>
      <ButtonLink
        to="/party/$id"
        params={{ id: party.id }}
        size="sm"
        variant={live ? 'default' : 'secondary'}
      >
        <PartyPopperIcon size={14} aria-hidden className="mr-1.5" />
        {live ? 'Join now' : 'Open party'}
      </ButtonLink>
    </section>
  );
}

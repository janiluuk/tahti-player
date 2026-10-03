import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, LockIcon } from 'lucide-react';
import type { FC } from 'react';

import { ExternalLink } from '@tahti-player/ui';

import type { SmartLinkView } from '../../api/smart-link-types';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { TrackAccessGate } from '../track-detail/TrackAccessGate';
import {
  smartLinkLockedTracks,
  smartLinkTrackCredits,
  type SmartLinkCredit,
} from './smartLinkTracks';

function text(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

// Artists often type the symbol into the field themselves.
function rightsLine(value: string | null | undefined): string | null {
  return text(value?.replace(/^\s*(℗|©|\([pc]\))\s*/i, ''));
}

function CreditName({ credit }: { credit: SmartLinkCredit }) {
  return credit.artistUsername ? (
    <Link
      to="/u/$username"
      params={{ username: credit.artistUsername }}
      className="text-primary hover:underline"
    >
      {credit.name}
    </Link>
  ) : (
    <>{credit.name}</>
  );
}

export const SmartLinkLockedTracks: FC<{ data: SmartLinkView }> = ({
  data,
}) => {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const locked = smartLinkLockedTracks(data);
  const first = locked[0];
  if (!first) {
    return null;
  }
  return (
    <section
      className="flex flex-col gap-3"
      aria-label="Locked tracks"
      data-testid="smart-link-locked-tracks"
    >
      {/* TrackAccessGate is styled for the dark track hero, so it keeps a dark
          backdrop here whatever the page theme is. */}
      <div className="rounded-lg bg-black text-white">
        <TrackAccessGate
          gate={first.gate}
          artist={data.artist}
          signedIn={signedIn}
          onSignIn={() => useAuthModalStore.getState().open('login')}
        />
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {locked.map((track) => (
          <li key={track.key} className="flex items-center gap-2">
            <LockIcon
              size={14}
              aria-hidden
              className="text-foreground-secondary shrink-0"
            />
            {track.soundId ? (
              <Link
                to="/t/$id"
                params={{ id: track.soundId }}
                className="hover:underline"
              >
                {track.title}
              </Link>
            ) : (
              <span>{track.title}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export const SmartLinkReleaseCredits: FC<{ data: SmartLinkView }> = ({
  data,
}) => {
  const trackCredits = smartLinkTrackCredits(data);
  const pLine = rightsLine(data.release.pLine);
  const cLine = rightsLine(data.release.cLine);
  const musicbrainzUrl = text(data.release.musicbrainzUrl);
  const discogsUrl = text(data.release.discogsUrl);
  const catalogLinks = [
    musicbrainzUrl ? { label: 'MusicBrainz', href: musicbrainzUrl } : null,
    discogsUrl ? { label: 'Discogs', href: discogsUrl } : null,
  ].filter((link): link is { label: string; href: string } => link !== null);

  if (
    trackCredits.length === 0 &&
    !pLine &&
    !cLine &&
    catalogLinks.length === 0
  ) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 text-sm" aria-label="Credits">
      {trackCredits.length > 0 ? (
        <>
          <Eyebrow>Credits</Eyebrow>
          <ul className="flex flex-col gap-3">
            {trackCredits.map((track) => (
              <li key={track.key}>
                <p className="font-semibold">{track.title}</p>
                <ul className="flex flex-col gap-0.5">
                  {track.credits.map((credit, index) => (
                    <li key={`${credit.role}-${credit.name}-${index}`}>
                      <span className="text-foreground-secondary">
                        {credit.role}
                      </span>{' '}
                      <CreditName credit={credit} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {pLine || cLine ? (
        <div className="text-foreground-secondary flex flex-col gap-0.5 text-xs">
          {pLine ? <p>℗ {pLine}</p> : null}
          {cLine ? <p>© {cLine}</p> : null}
        </div>
      ) : null}
      {catalogLinks.length > 0 ? (
        <div className="flex flex-wrap gap-3 text-xs">
          {catalogLinks.map((link) => (
            <ExternalLink
              key={link.label}
              href={link.href}
              className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1"
            >
              {link.label}
              <ExternalLinkIcon size={12} aria-hidden />
            </ExternalLink>
          ))}
        </div>
      ) : null}
    </section>
  );
};

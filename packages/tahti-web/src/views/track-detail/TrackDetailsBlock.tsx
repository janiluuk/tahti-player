import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import type { PublicTrackDetail } from '../../api/types';
import { hasTrackDetailFacts, trackDetailFacts } from './trackDetails';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-foreground-secondary text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

export function TrackDetailsBlock({
  detail,
  className,
}: {
  detail: PublicTrackDetail | null | undefined;
  className?: string;
}) {
  if (!detail) {
    return null;
  }
  const facts = trackDetailFacts(detail);
  if (!hasTrackDetailFacts(facts)) {
    return null;
  }
  const { genres, bpm, musicalKey, license, credits, commentary, venue } =
    facts;

  return (
    <div className={className} data-testid="track-details">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
        Details
      </h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-6 gap-y-2 text-sm">
        {genres.length > 0 ? (
          <Row label={genres.length > 1 ? 'Genres' : 'Genre'}>
            {genres.join(' · ')}
          </Row>
        ) : null}
        {bpm !== null ? (
          <Row label="BPM">
            <span className="tabular-nums">{bpm}</span>
          </Row>
        ) : null}
        {musicalKey ? <Row label="Key">{musicalKey}</Row> : null}
        {license ? <Row label="Licence">{license}</Row> : null}
        {credits.length > 0 ? (
          <Row label="Credits">
            <ul className="flex flex-col gap-1">
              {credits.map((credit, index) => (
                <li key={`${credit.role}-${credit.name}-${index}`}>
                  <span className="text-foreground-secondary">
                    {credit.role}
                  </span>{' '}
                  {credit.artistUsername ? (
                    <Link
                      to="/u/$username"
                      params={{ username: credit.artistUsername }}
                      className="text-primary hover:underline"
                    >
                      {credit.name}
                    </Link>
                  ) : (
                    credit.name
                  )}
                </li>
              ))}
            </ul>
          </Row>
        ) : null}
        {venue ? (
          <Row label="Recorded at">
            <Link
              to="/v/$slug"
              params={{ slug: venue.slug }}
              className="text-primary hover:underline"
            >
              {venue.name}
            </Link>
          </Row>
        ) : null}
      </dl>
      {commentary ? (
        <div className="mt-6">
          <h3 className="text-foreground-secondary mb-2 text-xs tracking-wide uppercase">
            Artist commentary
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {commentary}
          </p>
        </div>
      ) : null}
    </div>
  );
}

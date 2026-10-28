import { Link } from '@tanstack/react-router';

import type {
  ListeningPartyCredit,
  ListeningPartyDto,
} from '../../api/listening-parties';
import { safeCreditName } from '../../lib/displayName';
import { Eyebrow } from '../tahti/Eyebrow';

function CreditList({
  credits,
  label,
}: {
  credits: ListeningPartyCredit[];
  label: string;
}) {
  const rows = credits.flatMap((credit) => {
    const name = safeCreditName(credit.name, credit.artistUsername ?? null);
    return name ? [{ ...credit, name }] : [];
  });
  if (rows.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-label={label}>
      {rows.map((credit, index) => (
        <li key={`${credit.role}-${credit.name}-${index}`}>
          <span className="text-foreground-secondary">{credit.role}</span>{' '}
          {credit.artistUsername ? (
            <Link
              to="/u/$username"
              params={{ username: credit.artistUsername }}
              className="text-primary-strong hover:underline"
            >
              {credit.name}
            </Link>
          ) : (
            credit.name
          )}
        </li>
      ))}
    </ul>
  );
}

/** The release's liner notes (its commentary) and the release and
 * per-track credits, rendered as plain text like the rest of the app's
 * artist-written Markdown. */
export function ListeningPartyLinerNotes({
  party,
}: {
  party: ListeningPartyDto;
}) {
  const { release } = party;
  const creditedTracks = [...party.tracks]
    .sort((a, b) => a.position - b.position)
    .filter((track) => track.credits.length > 0);
  const notices = [release.pLine, release.cLine, release.labelImprint].filter(
    (line): line is string => Boolean(line?.trim()),
  );
  const hasCredits = release.credits.length > 0 || creditedTracks.length > 0;
  if (!release.commentary && !hasCredits && notices.length === 0) {
    return null;
  }
  return (
    <section aria-label="Liner notes" className="flex flex-col gap-4">
      <Eyebrow>Liner notes</Eyebrow>
      {release.commentary ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {release.commentary}
        </p>
      ) : null}
      {hasCredits ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-foreground-secondary text-xs tracking-wide uppercase">
            Credits
          </h3>
          <CreditList credits={release.credits} label="Release credits" />
          {creditedTracks.map((track) => (
            <div key={track.id} className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">
                {track.position}. {track.title}
              </h4>
              <CreditList
                credits={track.credits}
                label={`Credits for ${track.title}`}
              />
            </div>
          ))}
        </div>
      ) : null}
      {notices.length > 0 ? (
        <p className="text-foreground-secondary text-xs">
          {notices.join(' · ')}
        </p>
      ) : null}
    </section>
  );
}

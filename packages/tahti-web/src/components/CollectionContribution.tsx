import { Link } from '@tanstack/react-router';

import type { ContributionLine } from '../api/collection-contribution';

export function CollectionContribution({ line }: { line: ContributionLine }) {
  const { addedByUsername, note } = line;
  const fullText = [
    addedByUsername ? `Added by @${addedByUsername}` : null,
    note ? `“${note}”` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span title={fullText} data-testid="collection-contribution">
      {addedByUsername ? (
        <>
          Added by{' '}
          <Link
            to="/u/$username"
            params={{ username: addedByUsername }}
            className="underline-offset-2 hover:underline"
          >
            @{addedByUsername}
          </Link>
        </>
      ) : null}
      {addedByUsername && note ? ' · ' : null}
      {note ? <span className="italic">“{note}”</span> : null}
    </span>
  );
}

import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';

import type { ContributionLine } from '../api/collection-contribution';

export function CollectionContribution({ line }: { line: ContributionLine }) {
  const { t } = useTranslation('web');
  const { addedByUsername, note } = line;
  const fullText = [
    addedByUsername
      ? t('collectionContributionBatch35.addedByUser', {
          username: addedByUsername,
        })
      : null,
    note ? `“${note}”` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span title={fullText} data-testid="collection-contribution">
      {addedByUsername ? (
        <>
          {t('collectionContributionBatch35.addedBy')}{' '}
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

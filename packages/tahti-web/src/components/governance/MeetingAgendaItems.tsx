import { Link } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';

import { InlineLoader } from '@tahti-player/ui';

import {
  fetchMeetingAgenda,
  type MemberAgendaItem,
} from '../../api/governance-meeting-agenda';
import { PageError } from '../PageStates';

const RESOLUTION_OUTCOME: Record<
  MemberAgendaItem['resolutions'][number]['outcome'],
  string
> = { PASSED: 'passed', FAILED: 'failed', DEFERRED: 'deferred' };

function AgendaRecords({ item }: { item: MemberAgendaItem }) {
  if (
    item.motions.length === 0 &&
    item.resolutions.length === 0 &&
    item.documents.length === 0
  ) {
    return null;
  }
  return (
    <ul
      aria-label={`Records under ${item.title}`}
      className="mt-1 flex flex-col gap-0.5 text-xs"
    >
      {item.motions.map((motion) => (
        <li key={`m-${motion.id}`}>
          Motion:{' '}
          <Link
            to="/governance/motions/$id"
            params={{ id: motion.id }}
            className="underline-offset-2 hover:underline"
          >
            {motion.title}
          </Link>{' '}
          <span className="text-foreground-secondary">
            ({motion.state === 'OPEN' ? 'voting open' : 'closed'})
          </span>
        </li>
      ))}
      {item.resolutions.map((resolution) => (
        <li key={`r-${resolution.id}`}>
          Resolution: {resolution.title}{' '}
          <span className="text-foreground-secondary">
            ({RESOLUTION_OUTCOME[resolution.outcome]})
          </span>
        </li>
      ))}
      {item.documents.map((document) => (
        <li key={`d-${document.id}`}>Document: {document.title}</li>
      ))}
    </ul>
  );
}

/** The meeting's numbered agenda from the board's agenda items, with what
 * was decided and the records filed under each. Shows `fallback` (the
 * free-text agenda) when the board has not entered any items. */
export function MeetingAgendaItems({
  meetingId,
  fallback,
}: {
  meetingId: string;
  fallback: ReactNode;
}) {
  const [items, setItems] = useState<MemberAgendaItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchMeetingAgenda(meetingId).then((result) => {
      if (!cancelled) {
        const reason =
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
        setLoadError(reason && !reason.includes('404') ? reason : null);
        setItems(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, reloadKey]);

  if (loadError) {
    return (
      <PageError
        title="Could not load the agenda"
        description={loadError}
        onRetry={() => {
          setItems(null);
          setLoadError(null);
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }
  if (items === null) {
    return <InlineLoader label="Loading the agenda…" />;
  }
  if (items.length === 0) {
    return <>{fallback}</>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <p className="text-sm font-semibold">
            {item.position}. {item.title}
          </p>
          {item.description ? (
            <p className="text-foreground-secondary mt-1 text-sm">
              {item.description}
            </p>
          ) : null}
          {item.outcome ? (
            <p className="mt-1 text-sm">Decided: {item.outcome}</p>
          ) : null}
          <AgendaRecords item={item} />
        </li>
      ))}
    </ol>
  );
}

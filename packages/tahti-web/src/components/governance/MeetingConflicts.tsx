import { ScaleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge } from '@tahti-player/ui';

import {
  fetchMeetingConflicts,
  type MemberConflictDeclaration,
} from '../../api/governance-meeting-conflicts';
import { PageErrorBanner } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

/** Conflicts of interest declared at the meeting, as the published minutes
 * record them. Hidden until there is something to show; a failed load is
 * shown, since hiding it would read as "no conflicts declared". */
export function MeetingConflicts({ meetingId }: { meetingId: string }) {
  const { t } = useTranslation('web');
  const [records, setRecords] = useState<MemberConflictDeclaration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchMeetingConflicts(meetingId).then((result) => {
      if (!cancelled) {
        setRecords(result.data);
        setError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, attempt]);

  if (error) {
    return (
      <GovernancePanel
        title={t('meetingConflictsText.conflictsOfInterest')}
        icon={ScaleIcon}
      >
        <PageErrorBanner
          title={t('loadErrors.couldnTLoadDeclaredConflicts')}
          description={error}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </GovernancePanel>
    );
  }

  if (records.length === 0) {
    return null;
  }

  return (
    <GovernancePanel
      title={t('meetingConflictsText.conflictsOfInterest')}
      icon={ScaleIcon}
    >
      <ul className="divide-border divide-y">
        {records.map((record) => (
          <li key={record.id} className="py-2 text-sm first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{record.displayName}</span>
              <Badge
                variant="pill"
                color={record.recused ? 'yellow' : 'secondary'}
              >
                {record.recused ? 'Stepped out of the decision' : 'Took part'}
              </Badge>
            </div>
            <p className="text-foreground-secondary mt-0.5 text-xs">
              {record.matter}
            </p>
          </li>
        ))}
      </ul>
    </GovernancePanel>
  );
}

import { ScaleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import {
  fetchMeetingConflicts,
  type MemberConflictDeclaration,
} from '../../api/governance-meeting-conflicts';
import { GovernancePanel } from './GovernancePanel';

/** Conflicts of interest declared at the meeting, as the published minutes
 * record them. Hidden until there is something to show. */
export function MeetingConflicts({ meetingId }: { meetingId: string }) {
  const [records, setRecords] = useState<MemberConflictDeclaration[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchMeetingConflicts(meetingId).then((result) => {
      if (!cancelled) {
        setRecords(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  if (records.length === 0) {
    return null;
  }

  return (
    <GovernancePanel title="Conflicts of interest" icon={ScaleIcon}>
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

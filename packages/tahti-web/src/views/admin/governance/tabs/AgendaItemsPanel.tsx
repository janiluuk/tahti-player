import { useCallback, useEffect, useState } from 'react';

import {
  fetchAdminAgendaItems,
  type GovernanceAgendaItem,
} from '../../../../api/admin/admin-governance-agenda';
import { CollapsibleRecord } from './MeetingRecordPanels';

/** A meeting's agenda as numbered items the minutes can record an outcome
 * for (GET /api/admin/governance/meetings/:id/agenda-items). */
export function AgendaItemsPanel({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GovernanceAgendaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminAgendaItems(meetingId);
    if (!result.ok) {
      setError(result.error);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }, [meetingId]);

  useEffect(() => {
    if (open) {
      setItems(null);
      void load();
    }
  }, [open, load]);

  return (
    <CollapsibleRecord
      label={`Agenda items${items ? ` (${items.length})` : ''}`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {items === null ? (
        <p className="text-foreground-secondary text-xs">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          No agenda items yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5">
              <span className="font-medium">
                {item.position}. {item.title}
              </span>
              {item.description ? (
                <span className="text-foreground-secondary text-xs">
                  {item.description}
                </span>
              ) : null}
              {item.outcome ? (
                <span className="text-xs">Decided: {item.outcome}</span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {error ? (
        <p className="text-accent-red-strong mt-2 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </CollapsibleRecord>
  );
}

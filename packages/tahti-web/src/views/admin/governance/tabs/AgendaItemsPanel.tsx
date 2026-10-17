import { useCallback, useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  createAdminAgendaItem,
  fetchAdminAgendaItems,
  type GovernanceAgendaItem,
} from '../../../../api/admin/admin-governance-agenda';
import { AgendaItemRow } from './AgendaItemRow';
import { CollapsibleRecord } from './MeetingRecordPanels';

/** A meeting's agenda as numbered items the minutes can record an outcome
 * for (GET /api/admin/governance/meetings/:id/agenda-items). */
export function AgendaItemsPanel({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GovernanceAgendaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

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
            <AgendaItemRow
              key={item.id}
              item={item}
              onChanged={() => void load()}
            />
          ))}
        </ol>
      )}
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          void createAdminAgendaItem(meetingId, { title, description }).then(
            (result) => {
              setSaving(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setTitle('');
              setDescription('');
              void load();
            },
          );
        }}
      >
        <Input
          label="New item"
          value={title}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Description (optional)"
          value={description}
          maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <Button type="submit" size="sm" disabled={saving || !title.trim()}>
            {saving ? 'Adding…' : 'Add to the agenda'}
          </Button>
        </div>
      </form>
      {error ? (
        <p className="text-accent-red-strong mt-2 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </CollapsibleRecord>
  );
}

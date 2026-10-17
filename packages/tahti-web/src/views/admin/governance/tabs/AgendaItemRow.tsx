import { useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  updateAdminAgendaItem,
  type GovernanceAgendaItem,
} from '../../../../api/admin/admin-governance-agenda';

/** One agenda item, with an editor for its title, description and the
 * outcome the minutes record. */
export function AgendaItemRow({
  item,
  onChanged,
}: {
  item: GovernanceAgendaItem;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [outcome, setOutcome] = useState(item.outcome ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <li>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            void updateAdminAgendaItem(item, {
              title: title.trim(),
              description: description.trim() || null,
              outcome: outcome.trim() || null,
            }).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setEditing(false);
              onChanged();
            });
          }}
        >
          <Input
            label="Title"
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Description"
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="What the meeting decided"
            value={outcome}
            maxLength={5000}
            onChange={(e) => setOutcome(e.target.value)}
          />
          {error ? (
            <p className="text-accent-red-strong text-xs" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              Save item
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5">
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
      </div>
      <Button
        size="sm"
        variant="secondary"
        aria-label={`Edit item ${item.position}: ${item.title}`}
        onClick={() => setEditing(true)}
      >
        Edit
      </Button>
    </li>
  );
}

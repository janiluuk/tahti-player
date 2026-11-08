import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, EditIconButton, InlineError, Input } from '@tahti-player/ui';

import {
  deleteAdminAgendaItem,
  updateAdminAgendaItem,
  type GovernanceAgendaItem,
} from '../../../../api/admin/admin-governance-agenda';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

/** One agenda item, with an editor for its title, description and the
 * outcome the minutes record. */
export function AgendaItemRow({
  item,
  onChanged,
  onMoveUp,
  onMoveDown,
}: {
  item: GovernanceAgendaItem;
  onChanged: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { t } = useTranslation('web');

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [outcome, setOutcome] = useState(item.outcome ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
            label={t('agendaItemRow.title')}
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label={t('agendaItemRow.description')}
            value={description}
            maxLength={5000}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label={t('agendaItemRow.whatTheMeetingDecided')}
            value={outcome}
            maxLength={5000}
            onChange={(e) => setOutcome(e.target.value)}
          />
          {error ? <InlineError textSize="xs">{error}</InlineError> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {t('agendaItemRow.saveItem')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              {t('agendaItemRow.cancel')}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-2">
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
      <div className="flex shrink-0 gap-1.5">
        {onMoveUp ? (
          <Button
            size="sm"
            variant="secondary"
            aria-label={`Move up: ${item.title}`}
            onClick={onMoveUp}
          >
            <ArrowUpIcon size={14} aria-hidden />
          </Button>
        ) : null}
        {onMoveDown ? (
          <Button
            size="sm"
            variant="secondary"
            aria-label={`Move down: ${item.title}`}
            onClick={onMoveDown}
          >
            <ArrowDownIcon size={14} aria-hidden />
          </Button>
        ) : null}
        <EditIconButton
          label={`Edit item ${item.position}: ${item.title}`}
          onClick={() => setEditing(true)}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          aria-label={`Remove item ${item.position}: ${item.title}`}
          onClick={() => setConfirmDelete(true)}
        >
          {t('agendaItemRow.remove')}
        </Button>
      </div>
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <ConfirmDialog
        destructive
        isOpen={confirmDelete}
        title={t('governanceConfirm.removeAgendaTitleNamed', {
          title: item.title,
        })}
        description={t('governanceConfirm.removeAgendaDescription')}
        confirmLabel={t('actions.remove')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          setBusy(true);
          setError(null);
          void deleteAdminAgendaItem(item).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onChanged();
          });
        }}
      />
    </li>
  );
}

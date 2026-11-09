import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  CopyButton,
  EditIconButton,
  Input,
  Tooltip,
} from '@tahti-player/ui';

import { StudioPanel } from '../../../../components/StudioPanel';

export const DEFAULT_AGENDA = [
  'Call to order',
  'Quorum check',
  'Adoption of agenda',
  'Review of previous minutes',
  'Board report',
  'Financial report',
  'Motions',
  'Election of board (if applicable)',
  'Any other business',
  'Close',
];

type Item = { id: number; text: string };

/** A scratch agenda the board copies into the meeting notice. Lines read as
 * text; one line at a time opens for editing. Nothing is saved. */
export function AgendaBuilder({
  initial = DEFAULT_AGENDA,
}: {
  initial?: string[];
}) {
  const { t } = useTranslation('web');
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((text, id) => ({ id, text })),
  );
  const [nextId, setNextId] = useState(initial.length);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [draftIsNew, setDraftIsNew] = useState(false);

  const agendaText = items
    .filter((item) => item.text.trim())
    .map((item, i) => `${i + 1}. ${item.text}`)
    .join('\n');

  const startEdit = (item: Item, isNew = false) => {
    setEditingId(item.id);
    setDraft(item.text);
    setDraftIsNew(isNew);
  };

  const cancelEdit = () => {
    if (draftIsNew) {
      setItems((prev) => prev.filter((item) => item.id !== editingId));
    }
    setEditingId(null);
  };

  const saveEdit = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, text } : item)),
    );
    setEditingId(null);
  };

  const move = (index: number, by: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by]!, next[index]!];
      return next;
    });

  const add = () => {
    const item = { id: nextId, text: '' };
    setNextId((n) => n + 1);
    setItems((prev) => [...prev, item]);
    startEdit(item, true);
  };

  return (
    <StudioPanel
      title={t('agmTab.agendaBuilder')}
      action={
        <CopyButton
          text={agendaText}
          size="sm"
          variant="secondary"
          aria-label={t('agmTab.copyAgenda')}
        />
      }
    >
      <ol className="divide-border divide-y">
        {items.map((item, i) => {
          const position = i + 1;
          if (item.id === editingId) {
            return (
              <li key={item.id} className="py-2">
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveEdit();
                  }}
                >
                  <div className="min-w-0 flex-1 basis-60">
                    <Input
                      autoFocus
                      size="sm"
                      label={t('agmTabLabels.agendaItemField', { position })}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.stopPropagation();
                          cancelEdit();
                        }
                      }}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={!draft.trim()}>
                    {t('actions.save')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={cancelEdit}
                  >
                    {t('actions.cancel')}
                  </Button>
                </form>
              </li>
            );
          }
          const itemLabel = item.text;
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 py-1.5 text-sm first:pt-0 last:pb-0"
            >
              <span className="text-foreground-secondary w-6 shrink-0 text-right text-xs tabular-nums">
                {position}.
              </span>
              <span className="min-w-0 flex-1">{item.text}</span>
              <div className="flex shrink-0 gap-0.5">
                <Tooltip
                  content={t('agmTabLabels.moveUpItemlabel', { itemLabel })}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('agmTabLabels.moveUpItemlabel', {
                      itemLabel,
                    })}
                    disabled={i === 0 || editingId !== null}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUpIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip
                  content={t('agmTabLabels.moveDownItemlabel', { itemLabel })}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('agmTabLabels.moveDownItemlabel', {
                      itemLabel,
                    })}
                    disabled={i === items.length - 1 || editingId !== null}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDownIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
                <EditIconButton
                  variant="text"
                  label={t('agmTabLabels.editAgendaItem', {
                    position,
                    itemLabel,
                  })}
                  disabled={editingId !== null}
                  onClick={() => startEdit(item)}
                />
                <Tooltip
                  content={t('agmTabLabels.removeAgendaItem', {
                    position,
                    itemLabel,
                  })}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('agmTabLabels.removeAgendaItem', {
                      position,
                      itemLabel,
                    })}
                    disabled={editingId !== null}
                    onClick={() =>
                      setItems((prev) =>
                        prev.filter((other) => other.id !== item.id),
                      )
                    }
                  >
                    <XIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            </li>
          );
        })}
      </ol>
      <Button
        size="sm"
        variant="secondary"
        className="mt-3"
        disabled={editingId !== null}
        onClick={add}
      >
        <PlusIcon size={16} aria-hidden />
        {t('agmTab.addAgendaItem')}
      </Button>
    </StudioPanel>
  );
}

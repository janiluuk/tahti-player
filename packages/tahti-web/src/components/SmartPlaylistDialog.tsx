import { LoaderCircleIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, FilterChips, Input, Select } from '@tahti-player/ui';

import type {
  NativeSmartDefinition,
  NativeSmartRule,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import {
  EMPTY_SMART,
  fieldKind,
  needsSecondValue,
  needsValue,
  newRule,
  opsFor,
  RULE_FIELDS,
  SMART_SORTS,
  withField,
} from './smartPlaylistRules';

type Props = {
  library: TahtiNativeLibrary;
  /** `null` closed; `{ id: null }` a new list; otherwise edit that one. */
  editing: { id: string | null; definition: NativeSmartDefinition } | null;
  onClose: () => void;
  onSaved: () => void;
};

/** Rule editor for a smart playlist, with a live count of what matches now. */
export function SmartPlaylistDialog({
  library,
  editing,
  onClose,
  onSaved,
}: Props) {
  const [draft, setDraft] = useState<NativeSmartDefinition>(EMPTY_SMART);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(editing.definition);
    }
  }, [editing]);

  // Live preview: evaluate the draft (debounced) so the count follows edits.
  useEffect(() => {
    if (!editing) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      library.analysis.smart
        .evaluate(null, draft, 0)
        .then((page) => {
          if (!cancelled) {
            setMatches(page.total);
            setProblem(null);
          }
        })
        .catch((failure: unknown) => {
          if (!cancelled) {
            setMatches(null);
            setProblem(
              failure instanceof Error ? failure.message : 'Invalid rule.',
            );
          }
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [library, draft, editing]);

  const setRule = (index: number, rule: NativeSmartRule) =>
    setDraft((current) => ({
      ...current,
      rules: current.rules.map((item, i) => (i === index ? rule : item)),
    }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await library.analysis.smart.save(
        editing?.id ?? null,
        draft,
      );
      toast.success(`Saved “${saved.name}”.`);
      onSaved();
      onClose();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not save the smart playlist.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root isOpen={editing !== null} onClose={onClose}>
      <Dialog.Title>
        {editing?.id ? 'Edit smart playlist' : 'New smart playlist'}
      </Dialog.Title>
      <Dialog.Description>
        A smart playlist follows your rules: it updates by itself as ratings,
        plays, tags and analysis change.
      </Dialog.Description>
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto py-2">
        <Input
          label="Name"
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Include tracks that match</span>
          <FilterChips
            items={[
              { id: 'all', label: 'All of the rules' },
              { id: 'any', label: 'Any of the rules' },
            ]}
            selected={draft.matchAll ? 'all' : 'any'}
            onChange={(id) =>
              setDraft((current) => ({ ...current, matchAll: id === 'all' }))
            }
          />
        </div>
        <ul className="flex flex-col gap-2" aria-label="Rules">
          {draft.rules.map((rule, index) => (
            <li
              key={index}
              className="border-border flex flex-wrap items-end gap-2 rounded-md border p-2"
            >
              <Select
                label="Field"
                value={rule.field}
                onValueChange={(field) =>
                  setRule(index, withField(rule, field as typeof rule.field))
                }
                options={RULE_FIELDS.map((f) => ({ id: f.id, label: f.label }))}
              />
              <Select
                label="Condition"
                value={rule.op}
                onValueChange={(op) =>
                  setRule(index, { ...rule, op: op as typeof rule.op })
                }
                options={opsFor(rule.field)}
              />
              {needsValue(rule.op) ? (
                <Input
                  label={fieldKind(rule.field) === 'days' ? 'Days' : 'Value'}
                  type={
                    fieldKind(rule.field) === 'number' ||
                    fieldKind(rule.field) === 'days'
                      ? 'number'
                      : 'text'
                  }
                  value={rule.value ?? ''}
                  onChange={(event) =>
                    setRule(index, { ...rule, value: event.target.value })
                  }
                />
              ) : null}
              {needsSecondValue(rule.op) ? (
                <Input
                  label="and"
                  type="number"
                  value={rule.value2 ?? ''}
                  onChange={(event) =>
                    setRule(index, { ...rule, value2: event.target.value })
                  }
                />
              ) : null}
              <Button
                size="icon-sm"
                variant="text"
                intent="danger"
                aria-label={`Remove rule ${index + 1}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    rules: current.rules.filter((_, i) => i !== index),
                  }))
                }
              >
                <TrashIcon size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div>
          <Button
            size="sm"
            variant="text"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                rules: [...current.rules, newRule()],
              }))
            }
          >
            <PlusIcon size={14} aria-hidden />
            Add rule
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Sort by"
            value={draft.sort}
            onValueChange={(sort) =>
              setDraft((current) => ({
                ...current,
                sort: sort as typeof current.sort,
              }))
            }
            options={SMART_SORTS}
          />
          <Select
            label="Order"
            value={draft.descending ? 'desc' : 'asc'}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                descending: value === 'desc',
              }))
            }
            options={[
              { id: 'asc', label: 'Ascending' },
              { id: 'desc', label: 'Descending' },
            ]}
          />
          <Input
            type="number"
            label="Limit to first … tracks (optional)"
            value={draft.limit === null ? '' : String(draft.limit)}
            onChange={(event) => {
              const value = event.target.value.trim();
              setDraft((current) => ({
                ...current,
                limit:
                  value === '' ? null : Math.max(1, Math.floor(Number(value))),
              }));
            }}
          />
        </div>
        <p className="text-sm" role="status" data-testid="smart-preview">
          {problem ? (
            <span className="text-destructive">{problem}</span>
          ) : matches === null ? (
            'Checking…'
          ) : (
            `${matches.toLocaleString('en-US')} ${matches === 1 ? 'track matches' : 'tracks match'} right now`
          )}
        </p>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={saving || problem !== null || draft.name.trim() === ''}
          onClick={() => void save()}
        >
          {saving ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Save
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

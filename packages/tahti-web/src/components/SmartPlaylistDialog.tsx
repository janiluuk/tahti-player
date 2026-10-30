import { PlusIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilterChips,
  Input,
  Loader,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import type {
  NativeSmartDefinition,
  NativeSmartRule,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import {
  EMPTY_SMART,
  needsSecondValue,
  needsValue,
  newRule,
  opsFor,
  RULE_FIELDS,
  SMART_SORTS,
  withField,
} from './smartPlaylistRules';
import { SmartRuleValueInput } from './SmartRuleValueInput';
import { useLibraryChangeTick } from './useLibraryChangeTick';

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

  const changeTick = useLibraryChangeTick(library);

  // Live preview: evaluate the draft (debounced) so the count follows edits
  // and changes to the library.
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
  }, [library, draft, editing, changeTick]);

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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto py-2">
          <Input
            autoComplete="off"
            label="Name"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium" aria-hidden>
              Include tracks that match
            </span>
            <FilterChips
              aria-label="Include tracks that match"
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
                  options={RULE_FIELDS.map((f) => ({
                    id: f.id,
                    label: f.label,
                  }))}
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
                  <SmartRuleValueInput
                    rule={rule}
                    which="value"
                    label="Value"
                    onChange={(value) => setRule(index, { ...rule, value })}
                  />
                ) : null}
                {needsSecondValue(rule.op) ? (
                  <SmartRuleValueInput
                    rule={rule}
                    which="value2"
                    label="and"
                    onChange={(value2) => setRule(index, { ...rule, value2 })}
                  />
                ) : null}
                <Tooltip content={`Remove rule ${index + 1}`} side="top">
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
                </Tooltip>
              </li>
            ))}
          </ul>
          <div>
            <Button
              className="gap-1.5"
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
              inputMode="numeric"
              enterKeyHint="done"
              label="Limit to first … tracks (optional)"
              value={draft.limit === null ? '' : String(draft.limit)}
              onChange={(event) => {
                const value = event.target.value.trim();
                setDraft((current) => ({
                  ...current,
                  limit:
                    value === ''
                      ? null
                      : Math.max(1, Math.floor(Number(value))),
                }));
              }}
            />
          </div>
          <p className="text-sm" role="status" data-testid="smart-preview">
            {problem ? (
              <span className="text-accent-red-strong">{problem}</span>
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
            className="gap-1.5"
            disabled={saving || problem !== null || draft.name.trim() === ''}
            type="submit"
          >
            {saving ? <Loader size="inline" shape="circle" /> : null}
            Save
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}

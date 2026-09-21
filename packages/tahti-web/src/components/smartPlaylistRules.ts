import type {
  NativeRuleField,
  NativeRuleOp,
  NativeSmartDefinition,
  NativeSmartRule,
  NativeSortColumn,
} from '../lib/nativeLibrary';

type FieldKind = 'text' | 'number' | 'days' | 'tag' | 'key' | 'flag';

export const RULE_FIELDS: Array<{
  id: NativeRuleField;
  label: string;
  kind: FieldKind;
  unit?: string;
}> = [
  { id: 'genre', label: 'Genre', kind: 'text' },
  { id: 'artist', label: 'Artist', kind: 'text' },
  { id: 'album', label: 'Album', kind: 'text' },
  { id: 'title', label: 'Title', kind: 'text' },
  { id: 'format', label: 'Format', kind: 'text' },
  { id: 'tag', label: 'Tag', kind: 'tag' },
  { id: 'rating', label: 'Rating (stars)', kind: 'number' },
  { id: 'playCount', label: 'Play count', kind: 'number' },
  { id: 'lastPlayed', label: 'Last played', kind: 'days' },
  { id: 'added', label: 'Date added', kind: 'days' },
  { id: 'year', label: 'Year', kind: 'number' },
  { id: 'duration', label: 'Length (seconds)', kind: 'number' },
  { id: 'bpm', label: 'BPM', kind: 'number' },
  { id: 'key', label: 'Key', kind: 'key' },
  { id: 'loudness', label: 'Loudness (LUFS)', kind: 'number' },
  { id: 'analyzed', label: 'Analysis', kind: 'flag' },
];

const OP_LABELS: Record<NativeRuleOp, string> = {
  is: 'is',
  isNot: 'is not',
  contains: 'contains',
  notContains: 'does not contain',
  atLeast: 'is at least',
  atMost: 'is at most',
  between: 'is between',
  inLastDays: 'is within the last … days',
  notInLastDays: 'is not within the last … days',
  isSet: 'has a value',
  isNotSet: 'has no value',
};

const OPS_BY_KIND: Record<FieldKind, NativeRuleOp[]> = {
  text: ['is', 'isNot', 'contains', 'notContains', 'isSet', 'isNotSet'],
  number: ['is', 'isNot', 'atLeast', 'atMost', 'between', 'isSet', 'isNotSet'],
  days: ['inLastDays', 'notInLastDays', 'isSet', 'isNotSet'],
  tag: ['is', 'isNot', 'isSet', 'isNotSet'],
  key: ['is', 'isNot', 'isSet', 'isNotSet'],
  flag: ['isSet', 'isNotSet'],
};

const fieldOf = (field: NativeRuleField) =>
  RULE_FIELDS.find((item) => item.id === field) ?? RULE_FIELDS[0]!;

export function opsFor(field: NativeRuleField) {
  return OPS_BY_KIND[fieldOf(field).kind].map((id) => ({
    id,
    // "has a value" reads oddly for the analysis flag.
    label:
      field === 'analyzed'
        ? id === 'isSet'
          ? 'has been analyzed'
          : 'has not been analyzed'
        : OP_LABELS[id],
  }));
}

export function needsValue(op: NativeRuleOp): boolean {
  return op !== 'isSet' && op !== 'isNotSet';
}

export function needsSecondValue(op: NativeRuleOp): boolean {
  return op === 'between';
}

export function fieldKind(field: NativeRuleField): FieldKind {
  return fieldOf(field).kind;
}

/** A rule with sensible defaults for `field`. */
export function newRule(field: NativeRuleField = 'genre'): NativeSmartRule {
  return { field, op: opsFor(field)[0]!.id, value: '', value2: '' };
}

/** Keeps a rule valid when its field changes (operators differ per field). */
export function withField(
  rule: NativeSmartRule,
  field: NativeRuleField,
): NativeSmartRule {
  const allowed = opsFor(field).map((op) => op.id);
  return {
    ...rule,
    field,
    op: allowed.includes(rule.op) ? rule.op : allowed[0]!,
  };
}

export const SMART_SORTS: Array<{ id: NativeSortColumn; label: string }> = [
  { id: 'title', label: 'Title' },
  { id: 'artist', label: 'Artist' },
  { id: 'album', label: 'Album' },
  { id: 'bpm', label: 'BPM' },
  { id: 'key', label: 'Key' },
  { id: 'rating', label: 'Rating' },
  { id: 'plays', label: 'Play count' },
  { id: 'lastPlayed', label: 'Last played' },
  { id: 'added', label: 'Date added' },
  { id: 'year', label: 'Year' },
  { id: 'duration', label: 'Length' },
  { id: 'loudness', label: 'Loudness' },
];

export const EMPTY_SMART: NativeSmartDefinition = {
  name: '',
  matchAll: true,
  rules: [newRule()],
  sort: 'title',
  descending: false,
  limit: null,
};

/** One-line description of a rule set, for the list. */
export function describeRules(definition: NativeSmartDefinition): string {
  if (definition.rules.length === 0) {
    return 'Every track';
  }
  const joiner = definition.matchAll ? ' and ' : ' or ';
  return definition.rules
    .map((rule) => {
      const label = fieldOf(rule.field).label.replace(/ \(.*\)$/, '');
      const op =
        opsFor(rule.field).find((item) => item.id === rule.op)?.label ??
        rule.op;
      if (!needsValue(rule.op)) {
        return `${label} ${op}`;
      }
      const value = needsSecondValue(rule.op)
        ? `${rule.value ?? ''} and ${rule.value2 ?? ''}`
        : (rule.value ?? '');
      return `${label} ${op.replace('…', String(rule.value ?? ''))}${rule.op.includes('LastDays') ? '' : ` ${value}`}`;
    })
    .join(joiner);
}

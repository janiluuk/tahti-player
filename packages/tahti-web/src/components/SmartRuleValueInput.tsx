import { Input, Select } from '@tahti-player/ui';

import {
  camelotNumber,
  formatKey,
  parseKey,
  type KeyNotation,
} from '../lib/musicalKey';
import type { NativeSmartRule } from '../lib/nativeLibrary';
import { useDjPrefsStore } from '../stores/djPrefsStore';
import { fieldKind } from './smartPlaylistRules';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEY_OPTIONS = NOTES.flatMap((note) => [
  { id: note, label: `${note} major` },
  { id: `${note}m`, label: `${note} minor` },
]);

export function keyOptions(notation: KeyNotation) {
  if (notation === 'musical') {
    return KEY_OPTIONS;
  }
  return KEY_OPTIONS.map((option) => {
    const key = parseKey(option.id)!;
    return {
      option,
      number: camelotNumber(key),
      minor: key.minor,
      code: formatKey(option.id, notation)!,
    };
  })
    .sort((a, b) => a.number - b.number || Number(b.minor) - Number(a.minor))
    .map(({ option, code }) => ({
      id: option.id,
      label: `${code} · ${option.label}`,
    }));
}

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5].map((stars) => ({
  id: String(stars),
  label: stars === 1 ? '1 star' : `${stars} stars`,
}));

/** `m:ss` (or plain seconds) → seconds as a string; unparseable text passes through for the API to reject. */
export function durationToSeconds(text: string): string {
  const match = /^\s*(\d+):([0-5]?\d)\s*$/.exec(text);
  return match ? String(Number(match[1]) * 60 + Number(match[2])) : text;
}

/** Seconds → `m:ss` for display. */
export function secondsToDuration(value: string): string {
  const seconds = Number(value);
  if (value.trim() === '' || !Number.isFinite(seconds) || seconds < 0) {
    return value;
  }
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

type Props = {
  rule: NativeSmartRule;
  which: 'value' | 'value2';
  label: string;
  onChange: (value: string) => void;
};

/** The value box for one side of a rule, typed to its field and condition. */
export function SmartRuleValueInput({ rule, which, label, onChange }: Props) {
  const value = rule[which] ?? '';
  const kind = fieldKind(rule.field);
  const notation = useDjPrefsStore((state) => state.keyNotation);

  if (kind === 'days') {
    const relative = rule.op === 'inLastDays' || rule.op === 'notInLastDays';
    return (
      <Input
        label={relative ? 'Days' : label === 'and' ? 'and' : 'Date'}
        type={relative ? 'number' : 'date'}
        min={relative ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (rule.field === 'rating') {
    return (
      <Select
        label={label}
        value={value || '0'}
        onValueChange={onChange}
        options={RATING_OPTIONS}
      />
    );
  }
  if (rule.field === 'key') {
    return (
      <Select
        label={label}
        value={value || 'C'}
        onValueChange={onChange}
        options={keyOptions(notation)}
      />
    );
  }
  if (rule.field === 'duration') {
    return (
      <Input
        label={label === 'and' ? 'and (m:ss)' : 'Length (m:ss)'}
        placeholder="3:30"
        value={secondsToDuration(value)}
        onChange={(event) => onChange(durationToSeconds(event.target.value))}
      />
    );
  }
  if (kind === 'number') {
    return (
      <Input
        label={label}
        type="number"
        step={rule.field === 'loudness' ? 0.5 : 1}
        min={rule.field === 'loudness' ? undefined : 0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <Input
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

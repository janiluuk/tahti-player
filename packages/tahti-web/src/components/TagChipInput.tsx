import { XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, CreatableCombobox, Tooltip } from '@tahti-player/ui';

type Props = {
  label: string;
  addLabel: string;
  placeholder: string;
  /** Match the backend's limits for the field (SoundMetadataFieldsSchema). */
  maxCount: number;
  maxLength: number;
  value: string[];
  onChange: (next: string[]) => void;
  /** Known values to offer while typing - freehand text is accepted too. */
  suggestions?: string[];
};

/** `value` with `raw` appended, trimmed and cut to `maxLength` - or null
 * when it is blank, already present (any case), or the list is full. */
export function withAddedTag(
  value: string[],
  raw: string,
  { maxCount, maxLength }: { maxCount: number; maxLength: number },
): string[] | null {
  const tag = raw.trim().slice(0, maxLength);
  if (!tag || value.length >= maxCount) {
    return null;
  }
  if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    return null;
  }
  return [...value, tag];
}

/** Free-text chip input - pick a suggestion or type a new value and press
 * Tab or Enter to commit it as a chip. Duplicates are ignored case-insensitively. */
export function TagChipInput({
  label,
  addLabel,
  placeholder,
  maxCount,
  maxLength,
  value,
  onChange,
  suggestions = [],
}: Props) {
  const [draftKey, setDraftKey] = useState(0);
  const atLimit = value.length >= maxCount;

  const add = (raw: string) => {
    const next = withAddedTag(value, raw, { maxCount, maxLength });
    if (next) {
      onChange(next);
      setDraftKey((key) => key + 1);
    }
  };

  const remove = (tag: string) =>
    onChange(value.filter((entry) => entry !== tag));

  const options = suggestions.filter(
    (suggestion) =>
      !value.some(
        (existing) => existing.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-foreground text-sm font-semibold">{label}</div>
      {value.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="bg-background-secondary text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            >
              {tag}
              <Tooltip content={`Remove ${tag}`} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  <XIcon size={12} aria-hidden />
                </Button>
              </Tooltip>
            </span>
          ))}
        </div>
      ) : null}
      {!atLimit ? (
        <CreatableCombobox
          key={draftKey}
          label={addLabel}
          placeholder={placeholder}
          options={options}
          value=""
          onValueChange={add}
          normalize={(raw) => raw.trim().slice(0, maxLength)}
          className="max-w-sm"
        />
      ) : null}
      <p className="text-foreground-secondary text-xs">
        {value.length} / {maxCount}
      </p>
    </div>
  );
}

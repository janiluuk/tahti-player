import { PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
  /** Optional helper under the label (when not wrapped in a panel). */
  description?: string;
  /** Quick-add pills shown under the input as "Used before". */
  usedBefore?: string[];
  /** Hide the field label when a parent panel already shows the title. */
  hideLabel?: boolean;
  /** Hide the `n / max` counter (panels often omit it). */
  hideCount?: boolean;
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
  description,
  usedBefore = [],
  hideLabel = false,
  hideCount = false,
}: Props) {
  const { t } = useTranslation('web');
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

  const quickAdds = usedBefore.filter(
    (suggestion) =>
      !value.some(
        (existing) => existing.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  return (
    <div className="flex flex-col gap-2">
      {!hideLabel ? (
        <div className="text-foreground text-sm font-semibold">{label}</div>
      ) : null}
      {description && !hideLabel ? (
        <p className="text-foreground-secondary -mt-1 text-xs">{description}</p>
      ) : null}
      {value.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="border-border bg-background-secondary text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            >
              {tag}
              <Tooltip
                content={t('tagChipInputLabels.removeTag', { tag })}
                side="top"
              >
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  onClick={() => remove(tag)}
                  aria-label={t('tagChipInputLabels.removeTag', { tag })}
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
          className="w-full"
          inputProps={{
            type: 'search',
            enterKeyHint: 'done',
            autoCorrect: 'off',
            spellCheck: false,
          }}
        />
      ) : null}
      {!atLimit && quickAdds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-foreground-secondary text-xs">
            Used before:
          </span>
          {quickAdds.map((tag) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant="text"
              className="border-border text-foreground hover:border-primary h-auto gap-1 rounded-full border px-2.5 py-1 text-xs font-normal"
              onClick={() => add(tag)}
              aria-label={t('tagChipInputLabels.addTag', { tag })}
            >
              <PlusIcon size={12} aria-hidden />
              {tag}
            </Button>
          ))}
        </div>
      ) : null}
      {!hideCount ? (
        <p className="text-foreground-secondary text-xs">
          {value.length} / {maxCount}
        </p>
      ) : null}
    </div>
  );
}

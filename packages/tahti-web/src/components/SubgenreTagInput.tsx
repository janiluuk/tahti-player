import { XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, CreatableCombobox, Tooltip } from '@tahti-player/ui';

const MAX_SUBGENRES = 12;
const MAX_SUBGENRE_LENGTH = 40;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Known subgenres to offer while typing — freehand text is accepted too. */
  suggestions?: string[];
};

/** Free-text tag input for track subgenres — pick a suggestion or type a
 * new one, matching the archive item's `subGenres` field (up to 12 entries,
 * 40 chars each — same limits the backend enforces). */
export function SubgenreTagInput({ value, onChange, suggestions = [] }: Props) {
  const [draftKey, setDraftKey] = useState(0);
  const atLimit = value.length >= MAX_SUBGENRES;

  const add = (raw: string) => {
    const tag = raw.trim().slice(0, MAX_SUBGENRE_LENGTH);
    if (!tag || atLimit) {
      return;
    }
    if (
      value.some((existing) => existing.toLowerCase() === tag.toLowerCase())
    ) {
      return;
    }
    onChange([...value, tag]);
    setDraftKey((key) => key + 1);
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
      <div className="text-foreground text-sm font-semibold">Subgenres</div>
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
          label="Add a subgenre"
          placeholder="Search or type to add a subgenre…"
          options={options}
          value=""
          onValueChange={add}
          normalize={(raw) => raw.trim().slice(0, MAX_SUBGENRE_LENGTH)}
          className="max-w-sm"
        />
      ) : null}
      <p className="text-foreground-secondary text-xs">
        {value.length} / {MAX_SUBGENRES}
      </p>
    </div>
  );
}

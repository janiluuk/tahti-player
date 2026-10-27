import { CreatableCombobox, FilterChips } from '@tahti-player/ui';

import { capitalizeGenre, MAX_GENRES, PRESET_GENRES } from '../lib/genres';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

/** Chip picker capped at MAX_GENRES — selecting a 6th genre is a no-op
 * until one is removed, rather than silently dropping the oldest pick.
 * Chips cover the presets plus any custom genres already selected (so a
 * previously-typed one still has a clickable, removable chip); the
 * combobox below is only for adding a genre that isn't a chip yet,
 * either an unpicked preset or a freshly-typed one. */
export function GenrePicker({ value, onChange }: Props) {
  const atLimit = value.length >= MAX_GENRES;
  const canAddCustomGenre = value.includes('Other') && !atLimit;
  const extras = value.filter(
    (genre) => !PRESET_GENRES.includes(genre as (typeof PRESET_GENRES)[number]),
  );
  const allGenres: string[] = [...PRESET_GENRES, ...extras];
  const addableOptions = allGenres.filter((genre) => !value.includes(genre));

  const addCustom = (typed: string) => {
    const genre = capitalizeGenre(typed);
    if (!genre || atLimit) {
      return;
    }
    if (
      value.some((existing) => existing.toLowerCase() === genre.toLowerCase())
    ) {
      return;
    }
    onChange([...value, genre]);
  };

  return (
    <div className="flex flex-col gap-3">
      <FilterChips
        multiple
        aria-label="Genres"
        items={allGenres.map((genre) => ({ id: genre, label: genre }))}
        selected={value}
        onChange={(ids) => {
          if (ids.length > MAX_GENRES) {
            return;
          }
          onChange(ids);
        }}
      />
      {canAddCustomGenre && (
        <CreatableCombobox
          label="Add a genre"
          placeholder="Search or type to add a genre…"
          options={addableOptions}
          value=""
          onValueChange={addCustom}
          normalize={capitalizeGenre}
          className="max-w-xs"
          inputProps={{
            type: 'search',
            enterKeyHint: 'done',
            autoCorrect: 'off',
            spellCheck: false,
          }}
        />
      )}
      <p className="text-foreground-secondary text-xs">
        {value.length} / {MAX_GENRES} selected
      </p>
    </div>
  );
}

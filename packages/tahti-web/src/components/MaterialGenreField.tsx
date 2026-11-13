import { Music2Icon } from 'lucide-react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Select } from '@tahti-player/ui';

import { capitalizeGenre, PRESET_GENRES } from '../lib/genres';
import { MaterialMetaPanel } from './MaterialMetaPanel';
import { TagChipInput } from './TagChipInput';

type Props = {
  genre: string;
  onGenreChange: (genre: string) => void;
  subGenres: string[];
  onSubGenresChange: (next: string[]) => void;
  /** Optional hint under the main genre select. */
  genreHint?: string;
  /** Known sub-genre values to offer while typing / as quick-adds. */
  subGenreSuggestions?: string[];
};

const GENRE_OPTIONS = PRESET_GENRES.map((genre) => ({
  id: genre,
  label: genre,
}));

/** Genre card for material edit — main genre select plus sub-genre chips. */
export function MaterialGenreField({
  genre,
  onGenreChange,
  subGenres,
  onSubGenresChange,
  genreHint = i18n.t('web:batch51.pickClosestMatch'),
  subGenreSuggestions,
}: Props) {
  const { t } = useTranslation('web');
  const selected =
    PRESET_GENRES.find(
      (preset) => preset.toLowerCase() === genre.toLowerCase(),
    ) ?? (genre ? capitalizeGenre(genre) : '');

  const options =
    selected &&
    !PRESET_GENRES.includes(selected as (typeof PRESET_GENRES)[number])
      ? [...GENRE_OPTIONS, { id: selected, label: selected }]
      : GENRE_OPTIONS;

  return (
    <MaterialMetaPanel
      icon={<Music2Icon size={14} strokeWidth={2.5} />}
      title={t('materialGenreField.genre')}
    >
      <div className="flex flex-col gap-4">
        <Select
          label={t('materialGenreField.mainGenre')}
          value={selected}
          onValueChange={onGenreChange}
          options={options}
          placeholder={t('materialGenreField.selectAGenre')}
          description={genreHint}
        />
        <TagChipInput
          label={t('materialGenreField.subGenres')}
          addLabel={i18n.t('web:batch51.addSubGenre')}
          placeholder="# Add a sub-genre"
          maxCount={12}
          maxLength={40}
          value={subGenres}
          onChange={onSubGenresChange}
          suggestions={subGenreSuggestions}
          usedBefore={subGenreSuggestions}
          hideCount
        />
      </div>
    </MaterialMetaPanel>
  );
}

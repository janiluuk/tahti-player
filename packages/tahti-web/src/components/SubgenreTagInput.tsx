import { i18n, useTranslation } from '@tahti-player/i18n';

import { TagChipInput } from './TagChipInput';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
};

/** Chips for a sound's `subGenres` - up to 12 entries, 40 chars each, the
 * limits SoundMetadataFieldsSchema enforces. Prefer `MaterialGenreField`
 * when editing main genre + subgenres together. */
export function SubgenreTagInput({ value, onChange, suggestions }: Props) {
  const { t } = useTranslation('web');
  return (
    <TagChipInput
      label={t('subgenreTagInputText.subGenres')}
      addLabel={i18n.t('web:batch51.addSubGenre')}
      placeholder="# Add a sub-genre"
      maxCount={12}
      maxLength={40}
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      usedBefore={suggestions}
    />
  );
}

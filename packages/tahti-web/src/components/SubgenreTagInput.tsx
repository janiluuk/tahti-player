import { TagChipInput } from './TagChipInput';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
};

/** Chips for a sound's `subGenres` - up to 12 entries, 40 chars each, the
 * limits SoundMetadataFieldsSchema enforces. */
export function SubgenreTagInput({ value, onChange, suggestions }: Props) {
  return (
    <TagChipInput
      label="Subgenres"
      addLabel="Add a subgenre"
      placeholder="Search or type to add a subgenre…"
      maxCount={12}
      maxLength={40}
      value={value}
      onChange={onChange}
      suggestions={suggestions}
    />
  );
}

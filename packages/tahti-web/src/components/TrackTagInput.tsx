import { TagChipInput } from './TagChipInput';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

/** Chips for a sound's free-form `tags` - up to 20 entries, 40 chars each,
 * the limits SoundMetadataFieldsSchema enforces. */
export function TrackTagInput({ value, onChange }: Props) {
  return (
    <TagChipInput
      label="Tags"
      addLabel="Add a tag"
      placeholder="Mood, series, place… press Enter to add"
      maxCount={20}
      maxLength={40}
      value={value}
      onChange={onChange}
    />
  );
}

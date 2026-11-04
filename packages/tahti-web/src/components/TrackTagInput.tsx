import { MaterialTagsField } from './MaterialTagsField';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  usedBefore?: string[];
};

/** Chips for a sound's free-form `tags` - up to 20 entries, 40 chars each,
 * the limits SoundMetadataFieldsSchema enforces. */
export function TrackTagInput({ value, onChange, usedBefore }: Props) {
  return (
    <MaterialTagsField
      value={value}
      onChange={onChange}
      usedBefore={usedBefore}
    />
  );
}

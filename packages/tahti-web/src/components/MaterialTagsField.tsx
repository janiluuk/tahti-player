import { HashIcon } from 'lucide-react';

import { MaterialMetaPanel } from './MaterialMetaPanel';
import { TagChipInput } from './TagChipInput';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Artist's previously used tags for the "Used before" row. */
  usedBefore?: string[];
};

/** Tags card for material edit — chips, add field, and quick-adds from
 * tags the artist has used on other tracks. */
export function MaterialTagsField({ value, onChange, usedBefore }: Props) {
  return (
    <MaterialMetaPanel
      icon={<HashIcon size={14} strokeWidth={2.5} />}
      title="Tags"
      description="Help listeners find it — genres, moods, instruments. Separate several tags with commas."
    >
      <TagChipInput
        label="Tags"
        hideLabel
        hideCount
        addLabel="Add a tag"
        placeholder="# Add a tag"
        maxCount={20}
        maxLength={40}
        value={value}
        onChange={onChange}
        suggestions={usedBefore}
        usedBefore={usedBefore}
      />
    </MaterialMetaPanel>
  );
}

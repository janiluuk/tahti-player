import { Select } from '@tahti-player/ui';

import {
  isLibrarySort,
  LIBRARY_SORT_OPTIONS,
  type LibrarySort,
} from '../../lib/librarySort';

export function LibrarySortSelect({
  value,
  onChange,
  label = 'Sort',
}: {
  value: LibrarySort;
  onChange: (value: LibrarySort) => void;
  label?: string;
}) {
  return (
    <Select
      className="w-44"
      aria-label={label}
      options={LIBRARY_SORT_OPTIONS}
      value={value}
      onValueChange={(next) => {
        if (isLibrarySort(next)) {
          onChange(next);
        }
      }}
    />
  );
}

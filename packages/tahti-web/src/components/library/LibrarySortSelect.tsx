import { SortMenuButton } from '@tahti-player/ui';

import { LIBRARY_SORT_OPTIONS, type LibrarySort } from '../../lib/librarySort';

/** Library lists' sort control (see `SortMenuButton`). */
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
    <SortMenuButton
      options={LIBRARY_SORT_OPTIONS}
      value={value}
      onChange={onChange}
      label={label}
      defaultValue="newest"
    />
  );
}

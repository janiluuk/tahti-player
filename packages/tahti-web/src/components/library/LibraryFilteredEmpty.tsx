import { Button } from '@tahti-player/ui';

import { PageEmpty } from '../PageStates';

export function LibraryFilteredEmpty({
  noun,
  query,
  filtered,
  onClear,
}: {
  noun: string;
  query: string;
  filtered: boolean;
  onClear: () => void;
}) {
  const needle = query.trim();
  const clearLabel = filtered
    ? needle
      ? 'Clear filters'
      : 'Clear filter'
    : 'Clear search';
  return (
    <PageEmpty
      title={
        needle ? `No ${noun} match “${needle}”` : `No ${noun} match this filter`
      }
      action={
        <Button size="sm" variant="secondary" onClick={onClear}>
          {clearLabel}
        </Button>
      }
    />
  );
}

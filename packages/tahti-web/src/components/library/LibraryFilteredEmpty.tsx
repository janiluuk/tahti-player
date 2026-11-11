import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  const needle = query.trim();
  const clearLabel = filtered
    ? needle
      ? t('libraryFilteredEmpty.clearFilters')
      : t('libraryFilteredEmpty.clearFilter')
    : t('libraryFilteredEmpty.clearSearch');
  return (
    <PageEmpty
      title={
        needle
          ? t('libraryFilteredEmpty.noMatchQuery', { noun, query: needle })
          : t('libraryFilteredEmpty.noMatchFilter', { noun })
      }
      action={
        <Button size="sm" variant="secondary" onClick={onClear}>
          {clearLabel}
        </Button>
      }
    />
  );
}

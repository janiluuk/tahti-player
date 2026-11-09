import { Puzzle } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { PageEmpty } from './PageStates';

/** What the Listen add-ons panel shows under a tab with nothing in it. */
export function ListenAddonsTabEmpty({
  tab,
  installedCount,
  availableCount,
  onBrowse,
}: {
  tab: 'installed' | 'available';
  installedCount: number;
  availableCount: number;
  onBrowse: () => void;
}) {
  const { t } = useTranslation('web');
  if (tab === 'installed' && installedCount === 0) {
    return (
      <PageEmpty
        title={t('empties.nothingInstalled')}
        action={
          availableCount > 0 ? (
            <Button size="sm" variant="secondary" onClick={onBrowse}>
              <Puzzle size={16} aria-hidden />
              {t('emptyActions.browseAddons')}
            </Button>
          ) : undefined
        }
      />
    );
  }
  if (tab === 'available' && availableCount === 0) {
    return (
      <p className="text-foreground-secondary text-sm">
        {t('listenAddonsTabEmptyText.everythingHereIsInstalled')}
      </p>
    );
  }
  return null;
}

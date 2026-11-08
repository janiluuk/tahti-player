import { useTranslation } from '@tahti-player/i18n';
import { Dialog, ExternalLink } from '@tahti-player/ui';

import { flagEmoji } from '../../../lib/countries';
import type { SavedBrowserStation } from '../../../stores/listenerWidgetsStore';

export function StationDetailsDialog({
  station,
  onClose,
}: {
  station: SavedBrowserStation | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root
      isOpen={station !== null}
      onClose={onClose}
      className="max-w-md"
    >
      {station && (
        <>
          <Dialog.Title>
            {flagEmoji(station.countryCode)} {station.name}
          </Dialog.Title>
          <Dialog.Description>
            {station.country ?? 'Internet radio'}
          </Dialog.Description>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {station.description && (
              <p className="text-foreground-secondary">{station.description}</p>
            )}
            {station.homepage ? (
              <ExternalLink
                href={station.homepage}
                className="text-accent-blue-strong"
              >
                {t('stationDetails.visitWebsite')}
              </ExternalLink>
            ) : (
              <span className="text-foreground-secondary text-xs">
                {t('stationDetails.noWebsiteOnFileFor')}
              </span>
            )}
            {station.programmingUrl ? (
              <ExternalLink
                href={station.programmingUrl}
                className="text-accent-blue-strong"
              >
                {t('stationDetails.viewCurrentProgramme')}
              </ExternalLink>
            ) : (
              <span className="text-foreground-secondary text-xs">
                {t('stationDetails.noProgrammingLinkConfiguredFor')}
              </span>
            )}
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('stationDetails.close')}</Dialog.Close>
          </Dialog.Actions>
        </>
      )}
    </Dialog.Root>
  );
}

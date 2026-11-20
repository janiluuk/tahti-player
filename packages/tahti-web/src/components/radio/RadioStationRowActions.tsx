import { CompassIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Tooltip } from '@tahti-player/ui';

import type { MyRadioStation } from '../../api/my-radio-stations';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { useRadioBrowserStore } from '../../stores/radioBrowserStore';
import { MyRadioStations } from '../../views/settings/MyRadioStations';
import { RadioBrowserDirectoryCard } from '../plugin-store/radio-category/RadioBrowserDirectoryCard';
import { ConfigureDialogHost } from '../plugin-store/shared';

/** Radio page station row toolbar: add your own station by URL, or open the
 * Radio Browser add-on's configure dialog to browse the directory. */
export function RadioStationRowActions({
  onOwnStationsChange,
}: {
  onOwnStationsChange?: (stations: MyRadioStation[]) => void;
}) {
  const { t } = useTranslation('web');
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const openAuth = useAuthModalStore((s) => s.open);
  const [ownOpen, setOwnOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const openBrowse = () => {
    // The configure dialog has no add-on toggle when hosted on its own, so
    // asking to browse turns the directory on.
    const browser = useRadioBrowserStore.getState();
    if (!browser.enabled) {
      browser.setEnabled(true);
    }
    setBrowseOpen(true);
  };

  return (
    <div className="flex items-center gap-2" data-testid="radio-row-actions">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => (signedIn ? setOwnOpen(true) : openAuth('login'))}
      >
        <PlusIcon size={14} aria-hidden />
        <span className="ml-1.5">{t('addStations.addNew')}</span>
      </Button>
      <Tooltip content={t('addStations.browseStations')} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={t('addStations.browseStations')}
          onClick={openBrowse}
        >
          <CompassIcon size={15} aria-hidden />
        </Button>
      </Tooltip>
      <Dialog.Root
        isOpen={ownOpen}
        onClose={() => setOwnOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>{t('addStations.yourStations')}</Dialog.Title>
        <Dialog.Description>
          {t('addStations.addAStationByIts')}
        </Dialog.Description>
        <div className="mt-4">
          <MyRadioStations onChange={onOwnStationsChange} />
        </div>
      </Dialog.Root>
      {browseOpen ? (
        <ConfigureDialogHost.Provider
          value={{ onClose: () => setBrowseOpen(false) }}
        >
          <RadioBrowserDirectoryCard />
        </ConfigureDialogHost.Provider>
      ) : null}
    </div>
  );
}

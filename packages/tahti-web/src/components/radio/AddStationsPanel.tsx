import { CompassIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, Dialog } from '@tahti-player/ui';

import type { MyRadioStation } from '../../api/my-radio-stations';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { MyRadioStations } from '../../views/settings/MyRadioStations';

export function AddStationsPanel({
  onOwnStationsChange,
}: {
  onOwnStationsChange?: (stations: MyRadioStation[]) => void;
}) {
  const { t } = useTranslation('web');
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const openSettings = useSettingsModalStore((s) => s.open);
  const openAuth = useAuthModalStore((s) => s.open);
  const [ownOpen, setOwnOpen] = useState(false);

  return (
    <Box
      variant="tertiary"
      shadow="none"
      className="flex-col items-start gap-3 border-dashed"
      data-testid="radio-add-stations"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-lg font-bold tracking-tight">
          {t('addStations.addStations')}
        </h2>
        <p className="text-foreground-secondary text-sm">
          {t('addStations.pickStationsFromTheRadio')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openSettings('plugin-store', 'radio')}>
          <CompassIcon size={14} aria-hidden />
          <span className="ml-1.5">{t('addStations.browseStations')}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (signedIn ? setOwnOpen(true) : openAuth('login'))}
        >
          <PlusIcon size={14} aria-hidden />
          <span className="ml-1.5">{t('addStations.addYourOwn')}</span>
        </Button>
      </div>
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
    </Box>
  );
}

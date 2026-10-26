import { CompassIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

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
          Add stations
        </h2>
        <p className="text-foreground-secondary text-sm">
          Pick stations from the radio directory, or add any station by its
          stream URL.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openSettings('plugin-store', 'radio')}>
          <CompassIcon size={14} aria-hidden />
          <span className="ml-1.5">Browse stations</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (signedIn ? setOwnOpen(true) : openAuth('login'))}
        >
          <PlusIcon size={14} aria-hidden />
          <span className="ml-1.5">Add your own</span>
        </Button>
      </div>
      <Dialog.Root
        isOpen={ownOpen}
        onClose={() => setOwnOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Your stations</Dialog.Title>
        <Dialog.Description>
          Add a station by its stream URL. It plays straight from the station.
        </Dialog.Description>
        <div className="mt-4">
          <MyRadioStations onChange={onOwnStationsChange} />
        </div>
      </Dialog.Root>
    </Box>
  );
}

import { PlusIcon, RadioTowerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, MediaArtwork } from '@tahti-player/ui';

import { fetchRadioStation } from '../../api/client';
import { StudioPanel } from '../../components/StudioPanel';
import { RADIO_STATIONS, type RadioStation } from '../../content/radioStations';
import { StationHealthCell } from './StationHealthCell';

export function StreamUrlText({ url }: { url: string | null }) {
  const { t } = useTranslation('web');
  return url ? (
    <code
      className="text-foreground-secondary block truncate text-xs"
      title={url}
    >
      {url}
    </code>
  ) : (
    <span className="text-foreground-secondary text-xs">
      {t('adminStationSections.noStreamUrlWonT')}
    </span>
  );
}

/** Tahti Radio's own stream: read-only here, since the rotation encoder on
 * the stream host writes it. */
export function TahtiRadioStationPanel() {
  const { t } = useTranslation('web');
  const [hlsUrl, setHlsUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchRadioStation().then(({ data }) => {
      if (!cancelled) {
        setHlsUrl(data.hlsUrl ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudioPanel
      title={t('adminStationSections.tahtiRadio')}
      description={t('adminStationSections.theAlwaysOnStationIts')}
    >
      <div
        className="flex flex-wrap items-center gap-3"
        data-testid="tahti-radio-station"
      >
        <div className="bg-background-secondary text-foreground-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <RadioTowerIcon size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 basis-56">
          <div className="font-medium">
            {t('adminStationSections.tahtiRadio')}
          </div>
          {hlsUrl === undefined ? (
            <span className="text-foreground-secondary text-xs">
              {t('adminStationSections.loading')}
            </span>
          ) : (
            <StreamUrlText url={hlsUrl} />
          )}
        </div>
        <StationHealthCell streamUrl={hlsUrl ?? null} name="Tahti Radio" />
      </div>
    </StudioPanel>
  );
}

/** Stations built into the app that are not presets yet. */
export function CatalogStationsPanel({
  presetNames,
  onAdd,
}: {
  presetNames: ReadonlySet<string>;
  onAdd: (station: RadioStation) => void;
}) {
  const { t } = useTranslation('web');
  const stations = RADIO_STATIONS.filter(
    (station) => !presetNames.has(station.name),
  );
  if (stations.length === 0) {
    return null;
  }
  return (
    <StudioPanel
      title={t('adminStationSectionsLabels.builtInCatalogLength', {
        length: stations.length,
      })}
      description={t('adminStationSections.stationsListenersCanAddFrom')}
    >
      <ul className="divide-border divide-y">
        {stations.map((station) => (
          <li
            key={station.id}
            className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            data-testid="catalog-station"
          >
            <MediaArtwork
              size="sm"
              src={station.logoUrl}
              alt=""
              className="rounded-lg"
            />
            <div className="min-w-0 flex-1 basis-56">
              <div className="truncate font-medium">{station.name}</div>
              <StreamUrlText url={station.streamUrl} />
            </div>
            <StationHealthCell
              streamUrl={station.streamUrl}
              name={station.name}
            />
            <Button
              className="gap-1.5"
              size="sm"
              variant="secondary"
              onClick={() => onAdd(station)}
            >
              <PlusIcon size={14} aria-hidden />
              {t('adminStationSections.addAsPreset')}
            </Button>
          </li>
        ))}
      </ul>
    </StudioPanel>
  );
}

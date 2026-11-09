import { useTranslation } from '@tahti-player/i18n';
import {
  FilterChips,
  Input,
  Select,
  Textarea,
  type SelectOption,
} from '@tahti-player/ui';

import type { CollectionTrackSortMode } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { COLLECTION_STYLES } from '../../../content/collectionStyles';
import type { CollectionEditState } from './useCollectionEditState';

const TRACK_ORDER_OPTIONS: SelectOption[] = [
  { id: 'MANUAL', label: 'Manual (tracklist order)' },
  { id: 'TIME', label: 'Oldest first' },
  { id: 'NAME', label: 'Title (A-Z)' },
];

export function DetailsPanel({ state }: { state: CollectionEditState }) {
  const { t } = useTranslation('web');
  const {
    name,
    setName,
    releaseDate,
    setReleaseDate,
    genres,
    setGenres,
    trackSortMode,
    setTrackSortMode,
    style,
    setStyle,
    description,
    setDescription,
    visibility,
    setVisibility,
  } = state;

  return (
    <StudioPanel title={t('collectionDetails.details')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('collectionDetails.title')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t('collectionDetails.releaseDate')}
          type="date"
          value={releaseDate}
          onChange={(event) => setReleaseDate(event.target.value)}
        />
        <Input
          label={t('collectionDetails.genres')}
          value={genres}
          placeholder={t('collectionDetails.electronicAmbient')}
          onChange={(event) => setGenres(event.target.value)}
        />
        <div className="flex flex-col gap-1 text-sm">
          <span
            className="text-foreground-secondary text-xs uppercase"
            aria-hidden
          >
            {t('collectionDetails.style')}
          </span>
          <FilterChips
            aria-label={t('collectionDetails.style')}
            items={COLLECTION_STYLES}
            selected={style}
            onChange={setStyle}
          />
        </div>
        <Select
          label={t('collectionDetails.trackOrder')}
          description={t('collectionDetails.howTracksAreOrderedOn')}
          value={trackSortMode}
          onValueChange={(value) =>
            setTrackSortMode(value as CollectionTrackSortMode)
          }
          options={TRACK_ORDER_OPTIONS}
        />
        <Textarea
          label={t('collectionDetails.description')}
          fieldClassName="sm:col-span-2"
          tone="secondary"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <section className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-lg border p-3 sm:col-span-2">
          <Select
            label={t('collectionDetails.visibility')}
            description={t('collectionDetails.chooseWhoCanFindThis')}
            value={visibility}
            onValueChange={(value) => setVisibility(value as typeof visibility)}
            options={[
              { id: 'PUBLIC', label: t('detailsPanel.public') },
              {
                id: 'UNLISTED',
                label: t('detailsPanel.unlistedDirectLinkOnly'),
              },
              { id: 'PRIVATE', label: t('detailsPanel.privateOnlyYou') },
            ]}
          />
        </section>
      </div>
    </StudioPanel>
  );
}

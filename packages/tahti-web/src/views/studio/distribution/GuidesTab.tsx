import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ExternalLink, SelectableTiles } from '@tahti-player/ui';

import {
  collectingSocietyPointers,
  DISCOGS_GUIDE_STEPS,
  DISCOGS_SUBMIT_URL,
  guideTiles,
  MUSICBRAINZ_GUIDE_STEPS,
  MUSICBRAINZ_SUBMIT_URL,
  POST_RELEASE_CLAIM_LINKS,
} from './distribution-content';
import { GuideDetail } from './GuideDetail';

export function GuidesTab() {
  const { t } = useTranslation('web');
  const [selectedGuide, setSelectedGuide] = useState('musicbrainz');
  return (
    <div className="flex flex-col gap-4 text-xs">
      <SelectableTiles
        aria-label={t('distributionGuides.distributionGuides')}
        items={guideTiles(t)}
        selected={selectedGuide}
        onChange={setSelectedGuide}
        layout="centered"
        className="sm:grid-cols-2 lg:grid-cols-4"
      />
      {selectedGuide === 'musicbrainz' && (
        <GuideDetail
          title="MusicBrainz"
          steps={MUSICBRAINZ_GUIDE_STEPS}
          href={MUSICBRAINZ_SUBMIT_URL}
          linkLabel={t('guidesTabBatch30.openMusicBrainzEditor')}
        />
      )}
      {selectedGuide === 'discogs' && (
        <GuideDetail
          title="Discogs"
          steps={DISCOGS_GUIDE_STEPS}
          href={DISCOGS_SUBMIT_URL}
          linkLabel={t('guidesTabBatch30.searchDiscogs')}
        />
      )}
      {selectedGuide === 'upc' && (
        <GuideDetail
          title="UPC / EAN"
          steps={[
            t('guidesTabBatch30.upcStepBarcode'),
            t('guidesTabBatch30.upcStepSave'),
            t('guidesTabBatch30.upcStepIsrc'),
          ]}
        />
      )}
      {selectedGuide === 'automation' && (
        <GuideDetail
          title={t('distributionGuides.automation')}
          steps={[
            t('guidesTabBatch30.automationStepExport'),
            t('guidesTabBatch30.automationStepPrefill'),
            t('guidesTabBatch30.automationStepDelivery'),
          ]}
        />
      )}
      <div>
        <p className="mb-1 font-medium">
          {t('distributionGuides.postReleaseClaimLinks')}
        </p>
        <ul className="list-inside list-disc">
          {POST_RELEASE_CLAIM_LINKS.map((link) => (
            <li key={link.id}>
              <ExternalLink href={link.url}>{link.label}</ExternalLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-medium">
          {t('distributionGuides.collectingSocieties')}
        </p>
        <ul className="list-inside list-disc">
          {collectingSocietyPointers(t).map((society) => (
            <li key={society.id}>
              <ExternalLink href={society.url}>{society.label}</ExternalLink>
              <span className="text-foreground-secondary">
                {' '}
                ({society.region}) — {society.hint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

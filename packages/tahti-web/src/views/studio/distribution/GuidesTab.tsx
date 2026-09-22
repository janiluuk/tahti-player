import { useState } from 'react';

import { ExternalLink, SelectableTiles } from '@tahti-player/ui';

import {
  COLLECTING_SOCIETY_POINTERS,
  DISCOGS_GUIDE_STEPS,
  DISCOGS_SUBMIT_URL,
  GUIDE_TILES,
  MUSICBRAINZ_GUIDE_STEPS,
  MUSICBRAINZ_SUBMIT_URL,
  POST_RELEASE_CLAIM_LINKS,
} from './distribution-content';
import { GuideDetail } from './GuideDetail';

export function GuidesTab() {
  const [selectedGuide, setSelectedGuide] = useState('musicbrainz');
  return (
    <div className="flex flex-col gap-4 text-xs">
      <SelectableTiles
        items={GUIDE_TILES}
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
          linkLabel="Open MusicBrainz release editor"
        />
      )}
      {selectedGuide === 'discogs' && (
        <GuideDetail
          title="Discogs"
          steps={DISCOGS_GUIDE_STEPS}
          href={DISCOGS_SUBMIT_URL}
          linkLabel="Search Discogs"
        />
      )}
      {selectedGuide === 'upc' && (
        <GuideDetail
          title="UPC / EAN"
          steps={[
            'Use the barcode assigned to this exact release, not an artist or catalog number.',
            'Save it under Catalog & credits; it is included in the export JSON and distribution checklist.',
            'If the release has no UPC/EAN, add ISRC values to every track before delivery.',
          ]}
        />
      )}
      {selectedGuide === 'automation' && (
        <GuideDetail
          title="Automation"
          steps={[
            'Export JSON creates a portable metadata package for MusicBrainz, Discogs, and future delivery tools.',
            'Copy prefill prepares the relevant form with the release title, barcode, credits, and tracklist.',
            'Delivery & royalties can submit eligible releases to Revelator and show status and royalty reports here.',
          ]}
        />
      )}
      <div>
        <p className="mb-1 font-medium">Post-release claim links</p>
        <ul className="list-inside list-disc">
          {POST_RELEASE_CLAIM_LINKS.map((link) => (
            <li key={link.id}>
              <ExternalLink href={link.url}>{link.label}</ExternalLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-medium">Collecting societies</p>
        <ul className="list-inside list-disc">
          {COLLECTING_SOCIETY_POINTERS.map((society) => (
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

import {
  BarcodeIcon,
  BookOpenIcon,
  Disc3Icon,
  LinkIcon,
  Music2Icon,
} from 'lucide-react';

import type { TFunction } from '@tahti-player/i18n';
import { type SelectableTile } from '@tahti-player/ui';

export const MUSICBRAINZ_SUBMIT_URL = 'https://musicbrainz.org/release/add';
export const DISCOGS_SUBMIT_URL = 'https://www.discogs.com/search/';

export function musicbrainzGuideSteps(t: TFunction<'web'>) {
  return [
    t('distributionContentBatch31.musicbrainzStepExport'),
    t('distributionContentBatch31.musicbrainzStepOpen'),
    t('distributionContentBatch31.musicbrainzStepDetails'),
    t('distributionContentBatch31.musicbrainzStepTracklist'),
    t('distributionContentBatch31.musicbrainzStepLabel'),
    t('distributionContentBatch31.musicbrainzStepSave'),
  ];
}

export function discogsGuideSteps(t: TFunction<'web'>) {
  return [
    t('distributionContentBatch31.discogsStepExport'),
    t('distributionContentBatch31.discogsStepSearch'),
    t('distributionContentBatch31.discogsStepSubmit'),
    t('distributionContentBatch31.discogsStepTracklist'),
    t('distributionContentBatch31.discogsStepBarcode'),
    t('distributionContentBatch31.discogsStepCopy'),
  ];
}

export function catalogMethods(t: TFunction<'web'>) {
  return [
    {
      id: 'upc',
      label: 'UPC / EAN',
      description: t(
        'distributionDistributionContent.identifyTheReleaseWithIts',
      ),
      icon: BarcodeIcon,
    },
    {
      id: 'musicbrainz',
      label: 'MusicBrainz',
      description: t(
        'distributionDistributionContent.linkTheOpenCatalogRelease',
      ),
      icon: Music2Icon,
    },
    {
      id: 'discogs',
      label: 'Discogs',
      description: t(
        'distributionDistributionContent.linkTheCommunityCatalogRelease',
      ),
      icon: Disc3Icon,
    },
    {
      id: 'rights',
      label: t('distributionDistributionContent.rightsLabel'),
      description: t('distributionDistributionContent.storePLineCLine'),
      icon: BookOpenIcon,
    },
  ] as const;
}

export function catalogMethodTiles(t: TFunction<'web'>): SelectableTile[] {
  return catalogMethods(t).map((method) => ({
    id: method.id,
    label: method.label,
    description: method.description,
    icon: <method.icon size={18} aria-hidden />,
  }));
}

export function guideTiles(t: TFunction<'web'>): SelectableTile[] {
  return [
    {
      id: 'musicbrainz',
      label: 'MusicBrainz',
      icon: <Music2Icon size={28} aria-hidden />,
    },
    {
      id: 'discogs',
      label: 'Discogs',
      icon: <Disc3Icon size={28} aria-hidden />,
    },
    {
      id: 'upc',
      label: 'UPC / EAN',
      icon: <BarcodeIcon size={28} aria-hidden />,
    },
    {
      id: 'automation',
      label: t('distributionDistributionContent.automation'),
      icon: <LinkIcon size={28} aria-hidden />,
    },
  ];
}

export const POST_RELEASE_CLAIM_LINKS = [
  {
    id: 'spotify',
    label: 'Spotify for Artists',
    url: 'https://artists.spotify.com/',
  },
  {
    id: 'apple',
    label: 'Apple Music for Artists',
    url: 'https://artists.apple.com/',
  },
  {
    id: 'youtube',
    label: 'YouTube Official Artist Channel',
    url: 'https://www.youtube.com/artist',
  },
] as const;

export function collectingSocietyPointers(t: TFunction<'web'>) {
  return [
    {
      id: 'teosto',
      region: 'Finland',
      label: 'Teosto',
      url: 'https://www.teosto.fi/en/',
      hint: t('distributionDistributionContent.worksAndPerformersForPublic'),
    },
    {
      id: 'gramex',
      region: 'Finland',
      label: 'Gramex',
      url: 'https://www.gramex.fi/en/',
      hint: t(
        'distributionDistributionContent.neighbouringRightsForRecordings',
      ),
    },
    {
      id: 'prs',
      region: 'UK',
      label: 'PRS for Music',
      url: 'https://www.prsformusic.com/',
      hint: t('distributionDistributionContent.ukCompositionPerformanceRights'),
    },
    {
      id: 'ascap',
      region: 'USA',
      label: 'ASCAP',
      url: 'https://www.ascap.com/',
      hint: t('distributionDistributionContent.usProForSongwritersAnd'),
    },
  ] as const;
}

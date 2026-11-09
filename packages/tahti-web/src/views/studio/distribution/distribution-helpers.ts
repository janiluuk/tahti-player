import type { TFunction } from '@tahti-player/i18n';

import type { ReleaseCatalog } from '../../../api/studio-types';

export function euros(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function statusColor(
  status: string | null,
): 'green' | 'yellow' | 'red' | 'secondary' {
  if (status === 'delivered' || status === 'live' || status === 'submitted') {
    return 'green';
  }
  if (status === 'pending') {
    return 'yellow';
  }
  if (status === 'failed') {
    return 'red';
  }
  return 'secondary';
}

const REVELATOR_STATUS_KEYS = {
  pending: 'releaseOpsPanel.statusPending',
  submitted: 'releaseOpsPanel.statusSubmitted',
  delivered: 'releaseOpsPanel.statusDelivered',
  live: 'releaseOpsPanel.statusLive',
  failed: 'releaseOpsPanel.statusFailed',
} as const;

/** The Revelator delivery status in the current language; no status reads
 * "Not submitted". */
export function revelatorStatusLabel(
  status: string | null,
  t: TFunction<'web'>,
): string {
  const key =
    status &&
    REVELATOR_STATUS_KEYS[status as keyof typeof REVELATOR_STATUS_KEYS];
  if (key) {
    return t(key);
  }
  return status ? status : t('releaseOpsPanel.statusNotSubmitted');
}

export type CatalogForm = {
  upc: string;
  musicbrainzReleaseId: string;
  musicbrainzArtistId: string;
  discogsReleaseId: string;
  pLine: string;
  cLine: string;
  labelImprint: string;
};

export function catalogToForm(catalog: ReleaseCatalog): CatalogForm {
  return {
    upc: catalog.upc ?? '',
    musicbrainzReleaseId: catalog.musicbrainzReleaseId ?? '',
    musicbrainzArtistId: catalog.musicbrainzArtistId ?? '',
    discogsReleaseId: catalog.discogsReleaseId ?? '',
    pLine: catalog.pLine ?? '',
    cLine: catalog.cLine ?? '',
    labelImprint: catalog.labelImprint ?? '',
  };
}

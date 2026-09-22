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

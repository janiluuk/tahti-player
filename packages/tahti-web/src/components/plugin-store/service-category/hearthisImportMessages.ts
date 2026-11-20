import type { TFunction } from '@tahti-player/i18n';

import type { HearthisImportResult } from '../../../plugins/import-sources/types';

type ImportCounts = Pick<
  HearthisImportResult,
  'imported' | 'failed' | 'artworkFailed'
>;

export function playlistImportMessage(
  t: TFunction<'web'>,
  result: ImportCounts,
): string {
  const items = t('hearthisCardBatch34.itemCount', { count: result.imported });
  if (result.failed > 0) {
    return t('hearthisCardBatch34.importedWithFailures', {
      imported: result.imported,
      failed: result.failed,
    });
  }
  if (result.artworkFailed > 0) {
    return t('hearthisCardBatch34.importedCoversFailed', {
      items,
      covers: t('hearthisCardBatch34.coverCount', {
        count: result.artworkFailed,
      }),
    });
  }
  return t('hearthisCardBatch34.importCompleted', { items });
}

export function collectionImportMessage(
  t: TFunction<'web'>,
  name: string,
  result: ImportCounts,
): string {
  if (result.failed > 0) {
    return t('hearthisCardBatch34.createdWithFailures', {
      name,
      imported: result.imported,
      failed: result.failed,
    });
  }
  if (result.artworkFailed > 0) {
    return t('hearthisCardBatch34.createdCoversFailed', {
      name,
      imported: result.imported,
      covers: t('hearthisCardBatch34.coverCount', {
        count: result.artworkFailed,
      }),
    });
  }
  return t('hearthisCardBatch34.createdCompleted', {
    name,
    items: t('hearthisCardBatch34.itemCount', { count: result.imported }),
  });
}

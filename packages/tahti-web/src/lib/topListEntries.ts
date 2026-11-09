import { i18n } from '@tahti-player/i18n';

import { dateLocaleTag } from './locale';

export function formatListenCount(value: number): string {
  return `${value.toLocaleString(dateLocaleTag())} ${value === 1 ? 'listen' : 'listens'}`;
}

export function formatPlayCount(value: number): string {
  return i18n.t('web:library.plays', {
    count: value,
    n: value.toLocaleString(dateLocaleTag()),
  });
}

export function rankingBucketTitle(bucket: string): string {
  return bucket.toLowerCase().replaceAll('_', ' ');
}

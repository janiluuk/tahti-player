import { i18n, type TFunction } from '@tahti-player/i18n';

export function webT(): TFunction<'web'> {
  return i18n.getFixedT(null, 'web');
}

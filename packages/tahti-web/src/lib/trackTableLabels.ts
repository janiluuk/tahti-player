import { i18n } from '@tahti-player/i18n';
import type { TrackTableLabels } from '@tahti-player/ui';

export const trackTableLabels: TrackTableLabels = {
  headers: {
    artist: 'Artist',
    title: 'Title',
    album: 'Source',
    duration: 'Duration',
    releaseDate: 'Released',
  },
  get favorite() {
    return i18n.t('web:actions.addToFavorites');
  },
  get unfavorite() {
    return i18n.t('web:actions.removeFromFavorites');
  },
  get play() {
    return i18n.t('web:actions.play');
  },
  get pause() {
    return i18n.t('web:actions.pause');
  },
  playAll: 'Play all',
  addAllToQueue: 'Add all to queue',
  addToQueue: 'Add to queue',
  inQueue: 'In queue',
  trackOptions: 'Track options',
  remove: 'Remove from list',
  filterPlaceholder: 'Filter tracks',
};

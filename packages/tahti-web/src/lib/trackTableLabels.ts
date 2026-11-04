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
  get playAll() {
    return i18n.t('web:actions.playAll');
  },
  get addAllToQueue() {
    return i18n.t('web:actions.addAllToQueue');
  },
  get addToQueue() {
    return i18n.t('web:actions.addToQueue');
  },
  get inQueue() {
    return i18n.t('web:actions.inQueue');
  },
  trackOptions: 'Track options',
  remove: 'Remove from list',
  get filterPlaceholder() {
    return i18n.t('web:library.filterTracks');
  },
};

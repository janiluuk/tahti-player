import type { PublicCollection, TahtiPlayable } from '../api/types';
import type { AmbientTrackStats } from '../components/AmbientTrackRow';
import { soundIdFromPlayableId } from './soundId';

/** Genre, public totals and the download flag for each collection row,
 * looked up from the collection's items by sound id. */
export function collectionTrackMeta(col: PublicCollection) {
  const byId = new Map(
    col.items.flatMap((item) =>
      item.sound ? [[item.sound.id, item.sound]] : [],
    ) as Array<
      [string, NonNullable<PublicCollection['items'][number]['sound']>]
    >,
  );
  const numbers = new Map(
    col.items.flatMap((item) =>
      item.sound && item.trackNumber != null
        ? [[item.sound.id, item.trackNumber] as const]
        : [],
    ),
  );
  return (
    playable: TahtiPlayable,
  ):
    | {
        genre?: string | null;
        stats?: AmbientTrackStats;
        downloadable?: boolean;
        trackNumber?: number;
      }
    | undefined => {
    const soundId = soundIdFromPlayableId(playable.id);
    const sound = soundId ? byId.get(soundId) : undefined;
    const trackNumber = soundId ? numbers.get(soundId) : undefined;
    if (!sound) {
      return undefined;
    }
    return {
      genre: sound.genre ?? null,
      trackNumber,
      downloadable: sound.downloadsEnabled === true && Boolean(sound.audioUrl),
      stats: {
        releaseDate: sound.createdAt ?? null,
        likes: sound.likeCount,
        plays: sound.playCount,
        downloads: sound.downloadCount,
        comments: sound.commentCount,
      },
    };
  };
}

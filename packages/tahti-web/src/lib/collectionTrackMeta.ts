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
  return (
    playable: TahtiPlayable,
  ):
    | {
        genre?: string | null;
        stats?: AmbientTrackStats;
        downloadable?: boolean;
      }
    | undefined => {
    const soundId = soundIdFromPlayableId(playable.id);
    const sound = soundId ? byId.get(soundId) : undefined;
    if (!sound) {
      return undefined;
    }
    return {
      genre: sound.genre ?? null,
      downloadable: sound.downloadsEnabled === true && Boolean(sound.audioUrl),
      stats: {
        releaseDate: sound.createdAt ?? null,
        likes: sound.likeCount,
        plays: sound.playCount,
        downloads: sound.downloadCount,
      },
    };
  };
}

import type { ChannelSoundItem, TahtiPlayable } from '../../api/types';
import { soundIdFromPlayableId } from '../../lib/soundId';
import type { AmbientTrackStats } from '../AmbientTrackRow';

export type ChannelTrackMeta = (item: TahtiPlayable) =>
  | {
      genre?: string | null;
      stats?: AmbientTrackStats;
      downloadable?: boolean;
    }
  | undefined;

/** Genre and public totals for each channel track row, looked up from the
 * channel's items by sound id. */
export function channelTrackMeta(sounds: ChannelSoundItem[]): ChannelTrackMeta {
  const byId = new Map(sounds.map((item) => [item.id, item]));
  return (playable) => {
    const soundId = soundIdFromPlayableId(playable.id);
    const item = soundId ? byId.get(soundId) : undefined;
    if (!item) {
      return undefined;
    }
    return {
      genre: item.genre ?? null,
      downloadable: item.downloadsEnabled === true,
      stats: {
        releaseDate: item.createdAt ?? null,
        likes: item.likeCount,
        plays: item.playCount,
        downloads: item.downloadCount,
      },
    };
  };
}

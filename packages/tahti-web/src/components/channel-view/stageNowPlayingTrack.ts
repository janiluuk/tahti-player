import type { ChannelNowPlaying } from '../../api/channel-now-playing-types';
import type { TahtiPlayable } from '../../api/types';

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

/** The channel's own track behind the rotation's now-playing entry, matched
 * by title (the now-playing payload carries no track id), so the stage can
 * draw its real peaks or show its embed widget. When the title repeats,
 * the copy with peaks or an embed wins over a bare one. */
export function stageNowPlayingTrack(
  nowPlaying: Pick<ChannelNowPlaying, 'title'> | null,
  playables: readonly TahtiPlayable[] | undefined,
): TahtiPlayable | null {
  if (!nowPlaying || !playables?.length) {
    return null;
  }
  const title = normalizeTitle(nowPlaying.title);
  const matches = playables.filter(
    (item) => normalizeTitle(item.title) === title,
  );
  return (
    matches.find((item) => item.peaks?.length) ??
    matches.find((item) => item.embed) ??
    matches[0] ??
    null
  );
}

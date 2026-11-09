import { webT } from './webT';

export type EntityStatKey =
  | 'followers'
  | 'following'
  | 'tracks'
  | 'plays'
  | 'likes'
  | 'downloads'
  | 'playlists';

/** The word after a header stat's number ("1 playlist", "412 followers"),
 * in the current language and plural form. */
export function entityStatLabel(key: EntityStatKey, count: number): string {
  return webT()(`entityStats.${key}`, { count });
}

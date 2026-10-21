import {
  fetchHearthisCollectionTracks,
  fetchHearthisLibrary,
  fetchSoundcloudPlaylists,
  fetchSoundcloudPlaylistTracks,
  isSoundcloudLink,
  parseHearthisSetPermalink,
  resolveSoundcloudPlaylist,
} from '../../api/sources';
import type { NativeImportProvider } from '../../lib/nativeLibrary';

/** A set entry as the import dialog needs it, whatever the provider. */
export type SetImportTrack = {
  id: string;
  title: string;
  username: string;
  durationSec: number;
  /** Set only when the provider offers the file for download. */
  download?: {
    url: string;
    fileName?: string | null;
    /** When the link stops working; the set is loaded again before that. */
    expiresAt?: string | null;
  } | null;
};

export type SetImportSummary = {
  /** What `tracks` takes: a permalink or a provider id. */
  id: string;
  title: string;
  trackCount: number;
};

/** One provider's way of finding a set and listing its tracks. */
export type SetImportSource = {
  provider: NativeImportProvider;
  label: string;
  linkPlaceholder: string;
  /** Shown when a pasted link is not a set link of this provider. */
  badLinkMessage: string;
  yourSets: () => Promise<SetImportSummary[]>;
  /** `null` when `link` is not a set link of this provider. */
  resolveLink: (link: string) => Promise<SetImportSummary | null>;
  tracks: (setId: string) => Promise<SetImportTrack[]>;
};

export const hearthisSetSource: SetImportSource = {
  provider: 'hearthis',
  label: 'hearthis.at',
  linkPlaceholder: 'https://hearthis.at/set/…',
  badLinkMessage: 'Paste a hearthis.at set link, like hearthis.at/set/…',
  yourSets: async () =>
    (await fetchHearthisLibrary()).data.collections.map((set) => ({
      id: set.permalink,
      title: set.title,
      trackCount: set.trackCount,
    })),
  resolveLink: async (link) => {
    const permalink = parseHearthisSetPermalink(link);
    return permalink
      ? { id: permalink, title: `hearthis.at set ${permalink}`, trackCount: 0 }
      : null;
  },
  tracks: fetchHearthisCollectionTracks,
};

export const soundcloudSetSource: SetImportSource = {
  provider: 'soundcloud',
  label: 'SoundCloud',
  linkPlaceholder: 'https://soundcloud.com/…/sets/…',
  badLinkMessage: 'Paste a SoundCloud set link, like soundcloud.com/…/sets/…',
  yourSets: async () => fetchSoundcloudPlaylists(),
  resolveLink: async (link) =>
    isSoundcloudLink(link) ? resolveSoundcloudPlaylist(link) : null,
  tracks: fetchSoundcloudPlaylistTracks,
};

export const SET_IMPORT_SOURCES: Record<NativeImportProvider, SetImportSource> =
  {
    hearthis: hearthisSetSource,
    soundcloud: soundcloudSetSource,
  };

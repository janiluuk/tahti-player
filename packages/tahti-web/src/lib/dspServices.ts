/** Mirrors `SMART_LINK_SERVICES` in tahti-org `@tahti/shared`; the API
 * rejects any other key in `smartLinkTargets`. */
export type DspServiceKey =
  | 'spotify'
  | 'apple'
  | 'tidal'
  | 'bandcamp'
  | 'soundcloud'
  | 'youtube'
  | 'deezer'
  | 'amazon'
  | 'mixcloud';

export type DspService = {
  key: DspServiceKey;
  label: string;
  /** Used only when no embed/import/export plugin URL is configured. */
  fallbackPrefix?: string;
};

export const DSP_SERVICES: DspService[] = [
  { key: 'spotify', label: 'Spotify' },
  {
    key: 'apple',
    label: 'Apple Music',
    fallbackPrefix: 'https://music.apple.com/album/',
  },
  {
    key: 'bandcamp',
    label: 'Bandcamp',
    fallbackPrefix: 'https://bandcamp.com/',
  },
  { key: 'soundcloud', label: 'SoundCloud' },
  {
    key: 'youtube',
    label: 'YouTube Music',
    fallbackPrefix: 'https://music.youtube.com/browse/',
  },
  {
    key: 'tidal',
    label: 'Tidal',
    fallbackPrefix: 'https://listen.tidal.com/album/',
  },
  {
    key: 'deezer',
    label: 'Deezer',
    fallbackPrefix: 'https://www.deezer.com/album/',
  },
  {
    key: 'amazon',
    label: 'Amazon Music',
    fallbackPrefix: 'https://music.amazon.com/albums/',
  },
  // A Mixcloud URL is /<user>/<show>/, so a release path alone can't build one.
  { key: 'mixcloud', label: 'Mixcloud' },
];

export function dspServiceLabel(key: string): string {
  const normalized = key.toLowerCase();
  return (
    DSP_SERVICES.find((service) => service.key === normalized)?.label ??
    key.charAt(0).toUpperCase() + key.slice(1)
  );
}

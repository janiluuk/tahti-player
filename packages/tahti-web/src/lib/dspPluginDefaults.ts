import { fetchSpotifyArtistProfile } from '../api/distribution';
import { fetchMeProfile } from '../api/studio-extras';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { DSP_SERVICES, type DspServiceKey } from './dspServices';

export {
  DSP_SERVICES,
  type DspService,
  type DspServiceKey,
} from './dspServices';

const PLUGIN_STREAM_KEYS = new Set<DspServiceKey>(['spotify', 'soundcloud']);

export function isPluginStreamService(key: string): boolean {
  return PLUGIN_STREAM_KEYS.has(key as DspServiceKey);
}

export function spotifyArtistPageUrl(artistId: string): string {
  return `https://open.spotify.com/artist/${encodeURIComponent(artistId)}`;
}

export function composeDspUrl(
  prefix: string,
  fragment: string,
  options?: { appendSlug?: boolean },
): string {
  const trimmedFragment = fragment.trim();
  const trimmedPrefix = prefix.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmedFragment)) {
    return trimmedFragment;
  }
  if (!trimmedFragment || options?.appendSlug === false) {
    return trimmedPrefix;
  }
  if (!trimmedPrefix) {
    return trimmedFragment;
  }
  return `${trimmedPrefix}/${trimmedFragment.replace(/^\/+/, '')}`;
}

export function fillAllDspUrls(
  prefixes: Record<string, string>,
  fragment: string,
): Record<string, string> {
  const filled: Record<string, string> = {};
  for (const [key, prefix] of Object.entries(prefixes)) {
    const url = composeDspUrl(prefix, fragment, {
      appendSlug: !isPluginStreamService(key),
    });
    if (url) {
      filled[key] = url;
    }
  }
  return filled;
}

export function dspPrefixesFromPluginConfig(input: {
  spotifyArtistId?: string | null;
  spotifyProfileUrl?: string | null;
  soundcloudProfileUrl?: string | null;
  widgetUrls?: Partial<Record<string, string>>;
}): Record<string, string> {
  const prefixes: Record<string, string> = {};
  const spotifyUrl =
    input.widgetUrls?.spotify?.trim() ||
    (input.spotifyArtistId
      ? spotifyArtistPageUrl(input.spotifyArtistId)
      : '') ||
    input.spotifyProfileUrl?.trim() ||
    '';
  const soundcloudUrl =
    input.widgetUrls?.soundcloud?.trim() ||
    input.soundcloudProfileUrl?.trim() ||
    '';
  if (spotifyUrl) {
    prefixes.spotify = spotifyUrl;
  }
  if (soundcloudUrl) {
    prefixes.soundcloud = soundcloudUrl;
  }
  return prefixes;
}

export function prefixesForServices(
  pluginPrefixes: Record<string, string>,
): Record<string, string> {
  const prefixes: Record<string, string> = {};
  for (const service of DSP_SERVICES) {
    const fromPlugin = pluginPrefixes[service.key]?.trim();
    if (fromPlugin) {
      prefixes[service.key] = fromPlugin;
      continue;
    }
    if (!isPluginStreamService(service.key) && service.fallbackPrefix) {
      prefixes[service.key] = service.fallbackPrefix;
    }
  }
  return prefixes;
}

export async function loadDspPluginPrefixes(): Promise<Record<string, string>> {
  const [spotify, profile] = await Promise.all([
    fetchSpotifyArtistProfile(),
    fetchMeProfile(),
  ]);
  const widgetUrls: Partial<Record<string, string>> = {};
  for (const instance of useListenerWidgetsStore.getState().instances) {
    if (!widgetUrls[instance.typeId] && instance.input.trim()) {
      widgetUrls[instance.typeId] = instance.input.trim();
    }
  }
  return dspPrefixesFromPluginConfig({
    spotifyArtistId: spotify.data.profile?.artistId,
    spotifyProfileUrl: profile.data.socialLinks?.spotify,
    soundcloudProfileUrl: profile.data.socialLinks?.soundcloud,
    widgetUrls,
  });
}

export function displayDspPrefix(prefix: string): string {
  try {
    const url = new URL(prefix);
    const host = url.hostname.replace(/^www\./, '');
    const path = url.pathname.replace(/\/+$/, '');
    return `${host}${path}/`;
  } catch {
    return prefix.replace(/\/+$/, '') + '/';
  }
}

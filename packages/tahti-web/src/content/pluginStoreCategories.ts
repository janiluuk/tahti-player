import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CastIcon,
  CompassIcon,
  FingerprintIcon,
  HeadphonesIcon,
  ListMusicIcon,
  PaletteIcon,
  RadioIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TvIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react';

/** Categories unified under one app-store-style browser (Settings →
 * Add-ons). Each one is a real, independent subsystem today (see
 * PLUGIN-STORE-PLAN.md for exactly where each lives and what moving it
 * behind a real plugin interface would take) — this registry is the
 * store's navigation layer, not a new plugin runtime.
 *
 * `radio`/`listen`/`discovery`/`channel` are per-page listener/artist
 * widgets (internet radio, SoundCloud/Spotify/YouTube/hearthis.at listener
 * widgets, and sandboxed disco-widgets for the Listen page and for
 * channel/artist pages) — each main page's customizable widgets get
 * configured here rather than in a separate settings section, same as
 * every other add-on. */
export type PluginCategoryId =
  | 'themes'
  | 'visualizers'
  | 'export'
  | 'import'
  | 'multicast'
  | 'fingerprinting'
  | 'scrobbling'
  | 'audio-plugins'
  | 'tools'
  | 'radio'
  | 'listen'
  | 'discovery'
  | 'channel';

export type PluginCategory = {
  id: PluginCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  {
    id: 'themes',
    label: 'Themes',
    description: 'App appearance — built-in palettes plus your own imports.',
    icon: PaletteIcon,
  },
  {
    id: 'visualizers',
    label: 'Visualizers',
    description:
      "Live visual presets for your channel page while you're on air.",
    icon: SparklesIcon,
  },
  {
    id: 'export',
    label: 'Export',
    description: 'DSPs your releases can be delivered to.',
    icon: ArrowUpFromLineIcon,
  },
  {
    id: 'import',
    label: 'Import',
    description: 'Services you can pull tracks and albums in from.',
    icon: ArrowDownToLineIcon,
  },
  {
    id: 'multicast',
    label: 'Multicast',
    description: 'Extra RTMP destinations your live stream mirrors to.',
    icon: CastIcon,
  },
  {
    id: 'fingerprinting',
    label: 'Fingerprinting',
    description: 'Audio fingerprint matching for catalog metadata.',
    icon: FingerprintIcon,
  },
  {
    id: 'scrobbling',
    label: 'Scrobbling',
    description:
      'Send eligible Tahti listens to your ListenBrainz and Last.fm profiles.',
    icon: ListMusicIcon,
  },
  {
    id: 'audio-plugins',
    label: 'Audio tools',
    description: 'DSP chain available in the Pro Editor.',
    icon: SlidersHorizontalIcon,
  },
  {
    id: 'tools',
    label: 'Tools',
    description:
      'Platform utilities — board-only ops tools and other non-DSP helpers.',
    icon: WrenchIcon,
  },
  {
    id: 'radio',
    label: 'Radio',
    description:
      'Personal stream, Radio Browser directory, and Finnish stations under Radio Browser → Stations.',
    icon: RadioIcon,
  },
  {
    id: 'listen',
    label: 'Listen',
    description:
      'SoundCloud, Spotify, YouTube, hearthis.at, Bandcamp, and News listener widgets on your Listen page.',
    icon: HeadphonesIcon,
  },
  {
    id: 'discovery',
    label: 'Discovery',
    description:
      'Sandboxed add-ons on the Listen page — only you see what you enable here.',
    icon: CompassIcon,
  },
  {
    id: 'channel',
    label: 'Channel',
    description:
      'Widgets on your public channel and artist page. Listeners see these when they visit you.',
    icon: TvIcon,
  },
];

export function pluginCategory(id: string): PluginCategory | undefined {
  return PLUGIN_CATEGORIES.find((c) => c.id === id);
}

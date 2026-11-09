export type HelpTone =
  'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red' | 'yellow';

export type HelpGroupId =
  | 'start-here'
  | 'listen-and-share'
  | 'artist-tools'
  | 'broadcasting'
  | 'releasing'
  | 'account-support'
  | 'admin'
  | 'add-ons'
  | 'build-with-tahti';

export const HELP_GROUPS: Array<{
  id: HelpGroupId;
  tone: HelpTone;
  slugs: string[];
}> = [
  {
    id: 'start-here',
    tone: 'blue',
    slugs: ['getting-around', 'for-listeners', 'player', 'for-artists'],
  },
  {
    id: 'listen-and-share',
    tone: 'cyan',
    slugs: [
      'favorites-playlists',
      'comments-and-timeline',
      'shared-jam',
      'notifications',
      'embed-and-share',
    ],
  },
  {
    id: 'artist-tools',
    tone: 'purple',
    slugs: ['channel-design', 'uploads-and-processing', 'earnings'],
  },
  { id: 'broadcasting', tone: 'red', slugs: ['broadcast', 'multistream'] },
  { id: 'releasing', tone: 'orange', slugs: ['releasing'] },
  {
    id: 'account-support',
    tone: 'green',
    slugs: [
      'tier-limits',
      'governance',
      'account-security',
      'studio-notices',
      'keyboard-shortcuts',
      'support',
    ],
  },
  { id: 'admin', tone: 'yellow', slugs: ['admin-guide'] },
  {
    id: 'add-ons',
    tone: 'cyan',
    slugs: ['add-ons', 'desktop-mcp', 'desktop-library'],
  },
  { id: 'build-with-tahti', tone: 'purple', slugs: ['disco-widgets'] },
];

export type QuickStartId = 'listen' | 'broadcast' | 'keyboard' | 'support';

export const QUICK_STARTS: Array<{
  id: QuickStartId;
  slug: string;
  tone: HelpTone;
}> = [
  { id: 'listen', slug: 'for-listeners', tone: 'blue' },
  { id: 'broadcast', slug: 'for-artists', tone: 'red' },
  { id: 'keyboard', slug: 'keyboard-shortcuts', tone: 'purple' },
  { id: 'support', slug: 'support', tone: 'green' },
];

export const TONE_CLASSES: Record<
  HelpTone,
  { solid: string; soft: string; text: string; border: string }
> = {
  blue: {
    solid: 'bg-accent-blue text-white',
    soft: 'bg-accent-blue/12',
    text: 'text-accent-blue-strong',
    border: 'border-accent-blue',
  },
  purple: {
    solid: 'bg-accent-purple text-white',
    soft: 'bg-accent-purple/12',
    text: 'text-accent-purple-strong',
    border: 'border-accent-purple',
  },
  green: {
    solid: 'bg-accent-green text-white',
    soft: 'bg-accent-green/12',
    text: 'text-accent-green-strong',
    border: 'border-accent-green',
  },
  orange: {
    solid: 'bg-accent-orange text-white',
    soft: 'bg-accent-orange/12',
    text: 'text-accent-orange-strong',
    border: 'border-accent-orange',
  },
  cyan: {
    solid: 'bg-accent-cyan text-white',
    soft: 'bg-accent-cyan/12',
    text: 'text-accent-cyan-strong',
    border: 'border-accent-cyan',
  },
  red: {
    solid: 'bg-accent-red text-white',
    soft: 'bg-accent-red/12',
    text: 'text-accent-red-strong',
    border: 'border-accent-red',
  },
  yellow: {
    solid: 'bg-accent-yellow text-black',
    soft: 'bg-accent-yellow/15',
    text: 'text-accent-yellow-strong',
    border: 'border-accent-yellow',
  },
};

export function helpGroupOf(slug: string) {
  return HELP_GROUPS.find((group) => group.slugs.includes(slug));
}

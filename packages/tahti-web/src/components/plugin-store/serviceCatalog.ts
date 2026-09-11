import type { IntegrationId } from '../../api/sources';
import type { PluginCategoryId } from '../../content/pluginStoreCategories';
import { EXPORT_TARGETS } from '../../plugins/export';
import {
  importSourcePlugins,
  type ImportSourcePlugin,
} from '../../plugins/import-sources';

export type ServiceAction =
  | { kind: 'deep-link'; to: string; label?: string }
  | {
      kind: 'oauth';
      integrationId: IntegrationId;
      oauthPath: string;
      instructionsHref?: string;
      instructionsLabel?: string;
    }
  | { kind: 'info' };

export type ServicePlugin = {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: PluginCategoryId[];
  action: ServiceAction;
};

const NON_IMPORT_TOOL_IDS = new Set<IntegrationId>(['url', 'radio']);

const OAUTH_SOURCE_INSTRUCTIONS: Partial<
  Record<IntegrationId, { instructionsHref: string; instructionsLabel: string }>
> = {
  bandcamp: {
    instructionsHref: 'https://bandcamp.com/login',
    instructionsLabel: 'Log into Bandcamp',
  },
  soundcloud: {
    instructionsHref: 'https://soundcloud.com',
    instructionsLabel: 'Log into SoundCloud',
  },
  mixcloud: {
    instructionsHref: 'https://www.mixcloud.com',
    instructionsLabel: 'Log into Mixcloud',
  },
};

const importPlugins = importSourcePlugins as ImportSourcePlugin[];

const IMPORT_SERVICE_PLUGINS: ServicePlugin[] = importPlugins
  .filter(
    (source) =>
      ['oauth', 'search', 'tool'].includes(source.kind) &&
      source.id !== 'hearthis' &&
      !NON_IMPORT_TOOL_IDS.has(source.id),
  )
  .map((source) => ({
    id: source.id,
    name: source.name,
    author: source.kind === 'oauth' ? 'Connect' : 'Tool',
    description: source.description,
    tags: ['import'],
    action:
      source.kind === 'oauth'
        ? {
            kind: 'oauth' as const,
            integrationId: source.id,
            oauthPath: source.oauthStartPath ?? '',
            ...OAUTH_SOURCE_INSTRUCTIONS[source.id],
          }
        : {
            kind: 'deep-link' as const,
            to: source.studioDeepLink ?? `/sources/${source.id}`,
          },
  }));

const EXPORT_SERVICE_PLUGINS: ServicePlugin[] = EXPORT_TARGETS.filter(
  (target) =>
    !['hearthis', 'bandcamp', 'soundcloud', 'mixcloud'].includes(target.id),
).map((target) => ({
  id: `export-${target.id}`,
  name: target.label,
  author: 'Tahti distribution',
  description: target.note,
  tags: ['export'],
  action: { kind: 'deep-link', to: target.to },
}));

const SERVICE_PLUGINS: ServicePlugin[] = [
  ...IMPORT_SERVICE_PLUGINS,
  ...EXPORT_SERVICE_PLUGINS,
  {
    id: 'hearthis',
    name: 'hearthis.at',
    author: 'Import',
    description:
      "Search hearthis.at's public catalogue to import tracks and sets.",
    tags: ['import'],
    action: { kind: 'info' },
  },
  {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    author: 'Connect',
    description:
      'Connect your MusicBrainz editor account so releases can be cross-referenced and registered under your identity.',
    tags: ['fingerprinting'],
    action: {
      kind: 'oauth',
      integrationId: 'musicbrainz',
      oauthPath: '/api/me/musicbrainz/oauth/start',
      instructionsHref: 'https://musicbrainz.org/register',
      instructionsLabel: 'Create a free MusicBrainz account',
    },
  },
  {
    id: 'acoustid',
    name: 'AcoustID',
    author: 'Built-in',
    description:
      'Matches uploaded tracks against AcoustID for catalog metadata — always on, no configuration needed.',
    tags: ['fingerprinting'],
    action: { kind: 'info' },
  },
];

export function servicePluginsForCategory(categoryId: PluginCategoryId) {
  return SERVICE_PLUGINS.filter((plugin) => plugin.tags.includes(categoryId));
}

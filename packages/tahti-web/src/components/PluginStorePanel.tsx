import { Cast, InfoIcon, SettingsIcon, XIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  EmptyState,
  PluginStoreItem,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  deleteRtmpTarget,
  fetchRtmpTargets,
  type RtmpTarget,
} from '../api/broadcast';
import {
  PLUGIN_CATEGORIES,
  type PluginCategoryId,
} from '../content/pluginStoreCategories';
import { getAccountRole, hasAccountRole } from '../lib/accountRoles';
import {
  ALL_PLUGIN_IDS,
  AUDIO_FX_PLUGINS,
  useAudioFxStore,
} from '../plugins/audio-fx';
import { DiscordBotAddonCard } from '../plugins/discord-bot/DiscordBotAddonCard';
import { useMasteringFeatureStore } from '../plugins/mastering/store';
import { multicastProviders } from '../plugins/multicast';
import { LastFmAddonCard } from '../plugins/scrobble/LastFmAddonCard';
import { ListenBrainzAddonCard } from '../plugins/scrobble/ListenBrainzAddonCard';
import { SoulseekAddonCard } from '../plugins/soulseek/SoulseekAddonCard';
import { useAuthStore } from '../stores/authStore';
import {
  ALL_WIDGET_IDS,
  useDiscoverStore,
  type DiscoverWidgetId,
} from '../stores/discoverStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { DiscoWidgetManagerPanel } from './disco-widgets/DiscoWidgetManagerPanel';
import { ListenAddonsPanel } from './ListenAddonsPanel';
import {
  MulticastConfigureDialog,
  type MulticastConfiguring,
} from './MulticastConfigureDialog';
import { PageLoading } from './PageStates';
import { RadioCategory } from './plugin-store/RadioCategory';
import {
  DspUrlPasteCard,
  ServiceCategory,
} from './plugin-store/ServiceCategory';
import { AudioPluginToggleRow } from './plugin-store/shared';
import {
  ThemesCategory,
  VisualizersCategory,
} from './plugin-store/ThemesCategory';

/** Unified browser across the app's plugin-shaped subsystems — see
 * PLUGIN-STORE-PLAN.md for what actually turning each one into a real,
 * removable plugin would take. This view is the navigation/config layer
 * over the *existing* implementations, not a new plugin runtime: every
 * plugin configures inline, in its own gear-toggled dialog (real API
 * calls, not stubs) — nothing here navigates away to configure itself.
 *
 * Import/Export/Fingerprinting share one tagged registry (`SERVICE_PLUGINS`
 * below) so shared services can stay a single entry without duplicating
 * their configuration UI. */
export function PluginStorePanel() {
  const isOpen = useSettingsModalStore((s) => s.isOpen);
  const pluginCategory = useSettingsModalStore((s) => s.pluginCategory);
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const isArtistOrAbove = Boolean(user && getAccountRole(user) !== 'LISTENER');
  const categories = useMemo(
    () =>
      PLUGIN_CATEGORIES.filter((c) =>
        c.id === 'tools'
          ? isBoard
          : c.id === 'audio-plugins'
            ? isArtistOrAbove
            : true,
      ),
    [isBoard, isArtistOrAbove],
  );
  const [category, setCategory] = useState<PluginCategoryId>('themes');

  // The modal (and this panel) stays mounted across close/open cycles, so
  // sync on every open in case the caller requested a specific sub-tab
  // (e.g. an OAuth callback redirect landing on Import — see
  // AddToMusicActions, router.tsx's sourcesRoute redirect).
  useEffect(() => {
    if (isOpen && pluginCategory) {
      setCategory(pluginCategory);
    }
  }, [isOpen, pluginCategory]);

  useEffect(() => {
    if (!categories.some((c) => c.id === category)) {
      setCategory(categories[0]?.id ?? 'themes');
    }
  }, [categories, category]);

  const selectedIndex = Math.max(
    0,
    categories.findIndex((c) => c.id === category),
  );

  return (
    <Tabs
      vertical
      className="flex min-w-0 flex-col gap-4 sm:flex-row"
      listClassName="flex min-w-0 w-full flex-wrap gap-1 sm:w-48 sm:flex-nowrap sm:flex-col shrink-0"
      panelClassName="min-w-0 flex-1"
      selectedIndex={selectedIndex}
      onChange={(index) => setCategory(categories[index]!.id)}
      items={categories.map((c) => ({
        id: c.id,
        label: (
          <span className="flex min-w-0 items-center gap-2">
            <c.icon size={14} aria-hidden className="shrink-0" />
            <span className="truncate">{c.label}</span>
          </span>
        ),
        content: <CategoryBody categoryId={c.id} />,
      }))}
    />
  );
}

function CategoryBody({ categoryId }: { categoryId: PluginCategoryId }) {
  const category = PLUGIN_CATEGORIES.find((c) => c.id === categoryId)!;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Tooltip content={`About ${category.label}`} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`About ${category.label}`}
            aria-expanded={showInfo}
            onClick={() => setShowInfo((value) => !value)}
          >
            <InfoIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {showInfo ? (
        <Box
          variant="tertiary"
          role="note"
          className="border-primary/40 bg-primary/10 flex-row items-start gap-2 py-3"
        >
          <InfoIcon
            className="text-primary mt-0.5 shrink-0"
            size={16}
            aria-hidden
          />
          <p className="text-foreground text-sm">
            <span className="font-semibold">{category.label}</span>{' '}
            {category.description}
          </p>
        </Box>
      ) : null}
      {categoryId === 'themes' && <ThemesCategory />}
      {categoryId === 'visualizers' && <VisualizersCategory />}
      {categoryId === 'export' && <DspUrlPasteCard />}
      {(categoryId === 'export' ||
        categoryId === 'import' ||
        categoryId === 'fingerprinting') && (
        <ServiceCategory categoryId={categoryId} />
      )}
      {categoryId === 'import' && <SoulseekAddonCard />}
      {categoryId === 'scrobbling' && (
        <>
          <ListenBrainzAddonCard />
          <LastFmAddonCard />
        </>
      )}
      {categoryId === 'multicast' && <MulticastCategory />}
      {categoryId === 'audio-plugins' && <AudioPluginsCategory />}
      {categoryId === 'tools' && <ToolsCategory />}
      {categoryId === 'radio' && <RadioCategory />}
      {categoryId === 'listen' && <ListenAddonsPanel />}
      {categoryId === 'discovery' && <DiscoveryCategory />}
      {categoryId === 'channel' && <ChannelCategory />}
    </div>
  );
}

// ── Multicast / Audio plugins ───────────────────────────────────────────────

function MulticastCategory() {
  const [targets, setTargets] = useState<RtmpTarget[] | null>(null);
  const [configuring, setConfiguring] = useState<MulticastConfiguring | null>(
    null,
  );

  const reload = () => {
    void fetchRtmpTargets().then((r) => setTargets(r.data));
  };

  useEffect(() => {
    void fetchRtmpTargets().then((r) => setTargets(r.data));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        Stream destinations
      </h3>
      {targets == null ? (
        <PageLoading label="Loading multistream destinations…" />
      ) : (
        <ul className="flex flex-col gap-2">
          {multicastProviders.map((destination) => {
            const target = targets.find((t) => t.provider === destination.id);
            const configured = Boolean(target);
            return (
              <PluginStoreItem
                key={destination.id}
                icon={<Cast size={22} aria-hidden />}
                name={destination.label}
                author="Multicast"
                description={
                  target
                    ? `${target.rtmpUrl}${target.keyLast4 ? ` · key ···${target.keyLast4}` : ''}`
                    : destination.rtmpUrlHint
                      ? `Mirror your live stream via ${destination.rtmpUrlHint}.`
                      : 'Mirror your live stream to a custom RTMP server.'
                }
                categories={[
                  target
                    ? target.enabled
                      ? 'Enabled'
                      : 'Disabled'
                    : 'Not configured',
                ]}
                isInstalled={configured}
                onInstall={() =>
                  setConfiguring({
                    provider: destination.id,
                    existing: target ?? null,
                  })
                }
                labels={{
                  install: 'Configure',
                  installed: 'Configured',
                }}
                accessory={
                  <div className="flex items-center gap-1">
                    <Tooltip content="Configure" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={`Configure ${destination.label}`}
                        onClick={() =>
                          setConfiguring({
                            provider: destination.id,
                            existing: target ?? null,
                          })
                        }
                      >
                        <SettingsIcon size={15} aria-hidden />
                      </Button>
                    </Tooltip>
                    {target ? (
                      <Tooltip content="Remove" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          intent="danger"
                          aria-label={`Remove ${destination.label}`}
                          onClick={() =>
                            void deleteRtmpTarget(target.id).then(reload)
                          }
                        >
                          <XIcon size={15} aria-hidden />
                        </Button>
                      </Tooltip>
                    ) : null}
                  </div>
                }
              />
            );
          })}
        </ul>
      )}
      {configuring ? (
        <MulticastConfigureDialog
          configuring={configuring}
          onClose={() => setConfiguring(null)}
          onSaved={() => {
            setConfiguring(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function AudioPluginsCategory() {
  const enabledPluginIds = useAudioFxStore((state) => state.enabledPluginIds);
  const togglePlugin = useAudioFxStore((state) => state.togglePlugin);
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const setMasteringEnabled = useMasteringFeatureStore(
    (state) => state.setEnabled,
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Not the same "Mastering" as the Pro Editor's own EQ/Comp/Limiter/
       * Filter chain panel below (also confusingly labeled "Mastering"
       * there) — this is the client-side reference-track matching tool,
       * see plugins/mastering/README.md. */}
      <AudioPluginToggleRow
        name="Reference Match"
        author="Pro Editor"
        description="Match a track's loudness and tonal balance toward a reference track — the 'Master' / 'Match to a reference track' entry points on Sounds and the track editor."
        enabled={masteringEnabled}
        onToggle={() => setMasteringEnabled(!masteringEnabled)}
      />
      <p className="text-foreground-secondary text-xs">
        Enabled by default. Turning this off hides the mastering entry points;
        it doesn't touch any saved mastering output.
      </p>
      <div className="border-border my-1 border-t" />
      {ALL_PLUGIN_IDS.map((id) => {
        const meta = AUDIO_FX_PLUGINS[id];
        const enabled = enabledPluginIds.includes(id);
        return (
          <AudioPluginToggleRow
            key={id}
            name={meta.label}
            author="Pro Editor"
            description={meta.description}
            enabled={enabled}
            onToggle={() => togglePlugin(id)}
          />
        );
      })}
      <p className="text-foreground-secondary text-xs">
        Only activated audio plugins are available to add in the Pro Editor.
      </p>
    </div>
  );
}

/** Board-only platform utilities (not DSP, not per-page widgets). */
function ToolsCategory() {
  return (
    <div className="flex flex-col gap-3">
      <DiscordBotAddonCard />
    </div>
  );
}

// ── Radio / Embed / Discovery / Channel: per-page listener & artist
// widgets, each configured here rather than in a separate settings
// section — see the file-level doc comment on PluginCategoryId. ───────────

function DiscoveryCategory() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <EmptyState
        size="sm"
        title="Sign in to install Discover add-ons"
        description="Add-ons on your Listen and Discover pages need an account."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DiscoverWidgetPlugins />
      <DiscoWidgetManagerPanel scope="LISTENER" />
    </div>
  );
}

const DISCOVER_WIDGET_DETAILS: Record<DiscoverWidgetId, string> = {
  'this-week-most-played':
    'See the tracks getting the most attention across Tahti this week.',
  'this-week-least-played':
    'Find overlooked tracks from this week and give them a listen.',
  'new-to-you':
    'Get recommendations from artists and tracks you have not heard yet.',
  'latest-tracks': 'Browse the newest tracks published by Tahti artists.',
  'most-played':
    'Explore the most-played tracks across the full Tahti catalog.',
  loved: 'Discover tracks that the Tahti community is saving and enjoying.',
  'artist-of-the-week': 'Meet a featured artist that changes each week.',
  'random-artist':
    'Get a fresh artist pick on a schedule you choose on Discover.',
  'public-playlists':
    'Find public playlists to follow, play, and embed from the Discover page.',
};

const DISCOVER_WIDGET_LABELS: Record<DiscoverWidgetId, string> = {
  'this-week-most-played': 'This week: most played',
  'this-week-least-played': 'This week: least played',
  'new-to-you': 'New to you',
  'latest-tracks': 'Latest tracks',
  'most-played': 'Most played',
  loved: 'Loved by the community',
  'artist-of-the-week': 'Artist of the week',
  'random-artist': 'Random artist',
  'public-playlists': 'Public playlists',
};

function DiscoverWidgetPlugins() {
  const enabledWidgets = useDiscoverStore((state) => state.enabledWidgets);
  const addWidget = useDiscoverStore((state) => state.addWidget);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-wide uppercase">
          Discover page widgets
        </h3>
        <Tooltip content="About Discover page widgets" side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="About Discover page widgets"
            aria-expanded={showInfo}
            onClick={() => setShowInfo((value) => !value)}
          >
            <InfoIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {showInfo ? (
        <Box
          variant="tertiary"
          role="note"
          className="border-primary/40 bg-primary/10 flex-row items-start gap-2 py-3"
        >
          <InfoIcon
            className="text-primary mt-0.5 shrink-0"
            size={16}
            aria-hidden
          />
          <p className="text-foreground text-sm">
            Add these built-in discovery panels to your Discover page. Arrange
            them and tune their filters from Discover.
          </p>
        </Box>
      ) : null}
      <div className="flex flex-col gap-3">
        {ALL_WIDGET_IDS.map((id) => (
          <PluginStoreItem
            key={id}
            name={DISCOVER_WIDGET_LABELS[id]}
            author="Tahti"
            description={DISCOVER_WIDGET_DETAILS[id]}
            category="Discover"
            isInstalled={enabledWidgets.includes(id)}
            onInstall={() => addWidget(id)}
            labels={{ installed: 'Added' }}
          />
        ))}
      </div>
    </section>
  );
}

function ChannelCategory() {
  const user = useAuthStore((s) => s.user);

  if (!user?.channel) {
    return (
      <EmptyState
        size="sm"
        title="Set up a channel first"
        description="Go live or finish channel setup to install add-ons on your public page."
      />
    );
  }

  return <DiscoWidgetManagerPanel scope="ARTIST" />;
}

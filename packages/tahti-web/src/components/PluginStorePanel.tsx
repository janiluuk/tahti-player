import { Link, useNavigate } from '@tanstack/react-router';
import {
  Cast,
  CheckSquareIcon,
  CircleHelpIcon,
  DownloadIcon,
  Eye,
  FolderDownIcon,
  InfoIcon,
  Link2Icon,
  ListPlus,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  Radio as RadioIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Box,
  Button,
  Dialog,
  EmptyState,
  FavoriteButton,
  FilterChips,
  ImageReveal,
  Input,
  MediaArtwork,
  PluginStoreItem,
  SaveButton,
  Select,
  Slider,
  TabLabel,
  Tabs,
  ThemeController,
  ThemeStoreItem,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  deleteRtmpTarget,
  fetchRtmpTargets,
  type RtmpTarget,
} from '../api/broadcast';
import {
  DEFAULT_VISUAL_PRESET_SETTINGS,
  fetchChannelVisual,
  parseVisualSettingsMap,
  patchChannelVisual,
  resolveVisualPresetSettings,
  VISUAL_PRESETS,
  type VisualPresetSettings,
  type VisualSettingsMap,
} from '../api/channel-design';
import {
  fetchSpotifyArtistProfile,
  linkSpotifyArtistProfile,
  unlinkSpotifyArtistProfile,
} from '../api/distribution';
import {
  COMMON_STATIONS,
  fetchCountryList,
  fetchStationCount,
  fetchTagList,
  lookupStationByUrl,
  playableFromRadioStation,
  readIcyStreamTitle,
  resolveStreamUrl,
  searchStations,
  searchStationsByName,
  testRadioStream,
  type RadioStation as PublicRadioStation,
  type RadioBrowserCountry,
  type RadioBrowserTag,
  type RadioStreamTestResult,
} from '../api/radio-sources';
import {
  playableFromHearthis,
  type BandcampAlbum,
  type HearthisLibrary,
  type HearthisTrack,
  type IntegrationId,
  type SoundcloudTrack,
  type SpotifySearchTrack,
} from '../api/sources';
import {
  createStudioCollection,
  fetchStudioCollections,
  patchStudioCollection,
} from '../api/studio';
import { fetchMeProfile, patchMeProfile } from '../api/studio-extras';
import type {
  SpotifyArtistProfile,
  StudioCollection,
} from '../api/studio-types';
import {
  PLUGIN_CATEGORIES,
  type PluginCategoryId,
} from '../content/pluginStoreCategories';
import {
  RADIO_STATIONS,
  radioStationPlayable,
  type RadioStation,
} from '../content/radioStations';
import { getAccountRole, hasAccountRole } from '../lib/accountRoles';
import { flagEmoji } from '../lib/countries';
import {
  ALL_PLUGIN_IDS,
  AUDIO_FX_PLUGINS,
  useAudioFxStore,
} from '../plugins/audio-fx';
import { DiscordBotAddonCard } from '../plugins/discord-bot/DiscordBotAddonCard';
import { EXPORT_TARGETS } from '../plugins/export';
import {
  hearthisSourceAdapter,
  importSourcePlugins,
  oauthAdapterFor,
  spotifySourceAdapter,
  toolSourceAdapter,
} from '../plugins/import-sources';
import { useMasteringFeatureStore } from '../plugins/mastering/store';
import { multicastProviders } from '../plugins/multicast';
import { LastFmAddonCard } from '../plugins/scrobble/LastFmAddonCard';
import { ListenBrainzAddonCard } from '../plugins/scrobble/ListenBrainzAddonCard';
import { SoulseekAddonCard } from '../plugins/soulseek/SoulseekAddonCard';
import { useThemeStore } from '../plugins/themes';
import {
  visualizerMetadata,
  visualizerSupportsAudioReactive,
} from '../plugins/visualizers';
import { useAuthStore } from '../stores/authStore';
import {
  ALL_WIDGET_IDS,
  useDiscoverStore,
  type DiscoverWidgetId,
} from '../stores/discoverStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';
import { usePluginInstallStore } from '../stores/pluginInstallStore';
import { useRadioBrowserStore } from '../stores/radioBrowserStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { ChannelVisualizer } from './ChannelVisualizer';
import { DiscoWidgetManagerPanel } from './disco-widgets/DiscoWidgetManagerPanel';
import { ListenAddonsPanel } from './ListenAddonsPanel';
import {
  MulticastConfigureDialog,
  type MulticastConfiguring,
} from './MulticastConfigureDialog';
import { PageLoading } from './PageStates';
import { RadioStationCover } from './RadioStationCover';
import { SourceServiceIcon } from './SourceServiceIcon';
import { ThemeEditor } from './ThemeEditor';
import { ThemeVisualizationSettings } from './ThemeVisualizationSettings';

function visualizerDescription(id: string): string {
  return visualizerMetadata(id).description;
}

const IMPORT_SOURCE_KINDS = new Set(['oauth', 'search', 'tool']);

/** Fold-out shell shared by every configurable plugin card: a gear toggle
 * next to the card that reveals an inline settings form below it (tabs
 * inside `children` when there's enough to configure to warrant them —
 * see VisualizersCategory). Every plugin gets one — nothing in this store
 * navigates away to configure itself. `header` can be a render prop when
 * the card's own primary button should also open the same panel as the
 * gear (e.g. a "Configure" button rather than an unrelated action). */
function ConfigurableCard({
  header,
  children,
  title,
  defaultOpen = false,
  dialogClassName = 'max-w-lg',
}: {
  header: React.ReactNode | ((open: () => void) => React.ReactNode);
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  /** Override the Dialog's width for plugins with more to configure than a
   * small popup can comfortably hold (e.g. HearthisCard's library browser). */
  dialogClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {typeof header === 'function' ? header(() => setOpen(true)) : header}
        </div>
        <Tooltip content={open ? 'Hide configuration' : 'Configure'} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Hide configuration' : 'Configure'}
          >
            <SettingsIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className={dialogClassName}
      >
        <Dialog.Title>Configure {title}</Dialog.Title>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}

/** Splits a category's plugin list into "Installed" / "Available" tabs.
 * Install state comes from usePluginInstallStore, which each card writes
 * to once it knows its own real status (connected/configured/enabled) —
 * an id this store has never heard from defaults to "Available", same as
 * a plugin with no install concept at all (e.g. a plain distribution
 * deep-link). */
function InstalledAvailableTabs({
  ids,
  renderItem,
  emptyInstalled = 'Nothing installed yet — check Available below.',
  emptyAvailable = 'Everything here is installed.',
}: {
  ids: string[];
  renderItem: (id: string) => React.ReactNode;
  emptyInstalled?: string;
  emptyAvailable?: string;
}) {
  const installedMap = usePluginInstallStore((s) => s.installed);
  const [tab, setTab] = useState<'installed' | 'available'>('installed');
  const installedIds = ids.filter((id) => installedMap[id]);
  const availableIds = ids.filter((id) => !installedMap[id]);
  const visibleIds = tab === 'installed' ? installedIds : availableIds;

  return (
    <div className="flex flex-col gap-3">
      <Tabs.Root
        selectedIndex={tab === 'installed' ? 0 : 1}
        onChange={(index) => setTab(index === 0 ? 'installed' : 'available')}
      >
        <Tabs.List>
          <Tabs.Tab>
            <TabLabel count={installedIds.length}>Installed</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel count={availableIds.length}>Available</TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      {visibleIds.length === 0 ? (
        <EmptyState
          size="sm"
          title={tab === 'installed' ? 'Nothing installed' : 'All installed'}
          description={tab === 'installed' ? emptyInstalled : emptyAvailable}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {visibleIds.map((id) => renderItem(id))}
        </div>
      )}
    </div>
  );
}

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
      className="flex flex-col gap-4 sm:flex-row"
      listClassName="flex sm:flex-col gap-1 sm:w-48 shrink-0"
      panelClassName="min-w-0 flex-1"
      selectedIndex={selectedIndex}
      onChange={(index) => setCategory(categories[index]!.id)}
      items={categories.map((c) => ({
        id: c.id,
        label: (
          <span className="flex items-center gap-2">
            <c.icon size={14} aria-hidden />
            {c.label}
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

function asThemePalette(
  palette: readonly string[] | undefined,
): [string, string, string, string] {
  const fallback = ['#888888', '#666666', '#444444', '#222222'] as const;
  return [
    palette?.[0] ?? fallback[0],
    palette?.[1] ?? fallback[1],
    palette?.[2] ?? fallback[2],
    palette?.[3] ?? fallback[3],
  ];
}

function ThemesCategory() {
  const themes = useThemeStore((s) => s.themes);
  const customThemes = useThemeStore((s) => s.customThemes);
  const themeId = useThemeStore((s) => s.themeId);
  const dark = useThemeStore((s) => s.dark);
  const colorMode = useThemeStore((s) => s.colorMode);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setColorMode = useThemeStore((s) => s.setColorMode);
  const removeCustomTheme = useThemeStore((s) => s.removeCustomTheme);
  const dynamicEnabled = colorMode === 'dynamic';

  const all = [
    ...themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      author: 'Tahti',
      description: 'Built-in Nuclear theme',
      palette: theme.palette,
      tags: undefined as string[] | undefined,
      removable: false,
    })),
    ...Object.entries(customThemes).map(([id, theme]) => ({
      id,
      name: theme.name ?? 'Custom theme',
      author: theme.author ?? 'Imported',
      description: theme.description ?? 'Imported theme',
      palette: asThemePalette(theme.palette),
      tags: theme.tags,
      removable: true,
    })),
  ];

  const themeCard = (theme: (typeof all)[number]) => (
    <ThemeStoreItem
      key={theme.id}
      name={theme.name}
      description={theme.description}
      author={theme.author}
      palette={asThemePalette(theme.palette)}
      tags={theme.tags}
      isInstalled
      isActive={theme.id === themeId}
      onInstall={() => setTheme(theme.id)}
      onApply={() => setTheme(theme.id)}
      onUninstall={
        theme.removable
          ? () => {
              removeCustomTheme(theme.id);
              toast.success(`Removed ${theme.name}`);
            }
          : undefined
      }
      labels={{
        apply: 'Apply',
        active: 'Active',
        uninstall: 'Remove',
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <ThemeController
          isDark={dark}
          onThemeChange={(nextDark) =>
            setColorMode(nextDark ? 'dark' : 'light')
          }
        />
        <div className="flex items-center gap-2">
          <Toggle
            checked={dynamicEnabled}
            onChange={(enabled) => {
              if (enabled) {
                setColorMode('dynamic');
                return;
              }
              setColorMode(dark ? 'dark' : 'light');
            }}
            label="Dynamic theme"
          />
          <span className="text-sm font-medium">Dynamic</span>
          <Tooltip content="Dark from 7pm to 7am, light the rest of the day.">
            <CircleHelpIcon
              size={14}
              className="text-foreground-secondary"
              aria-label="What Dynamic does"
            />
          </Tooltip>
        </div>
      </div>
      {all.map((theme) =>
        theme.id === 'nuclear:tahti-dark' ? (
          <ConfigurableCard
            key={theme.id}
            title={theme.name}
            header={themeCard(theme)}
          >
            <ThemeVisualizationSettings themeId={theme.id} />
          </ConfigurableCard>
        ) : (
          themeCard(theme)
        ),
      )}
      <Box variant="tertiary" shadow="none" className="gap-2 py-3">
        <p className="text-sm font-medium">Custom theme editor</p>
        <p className="text-foreground-secondary text-xs">
          Click a color to expand its sliders. Appearance uses the row above.
        </p>
        <ThemeEditor />
      </Box>
    </div>
  );
}

function presetLabel(id: string): string {
  return id
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function VisualizersCategory() {
  const [preset, setPreset] = useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = useState<string>('AURORA');
  const [settingsMap, setSettingsMap] = useState<VisualSettingsMap>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [configurationPreset, setConfigurationPreset] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void fetchChannelVisual().then((r) => {
      setPreset(r.data.visualPreset);
      setPreviewPreset(r.data.visualPreset);
      setSettingsMap(parseVisualSettingsMap(r.data.visualSettingsJson));
    });
  }, []);

  const usePreset = (id: string) => {
    setSaving(id);
    void patchChannelVisual({ visualPreset: id }).then((r) => {
      setSaving(null);
      if (r.ok) {
        setPreset(id);
      }
    });
  };

  const saveTuning = (id: string, next: VisualPresetSettings) => {
    const nextMap = { ...settingsMap, [id]: next };
    setSettingsMap(nextMap);
    void patchChannelVisual({ visualSettings: nextMap });
  };

  const previewSettings = resolveVisualPresetSettings(
    settingsMap,
    previewPreset,
  );
  const configurationSettings = configurationPreset
    ? resolveVisualPresetSettings(settingsMap, configurationPreset)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Box variant="secondary" className="overflow-hidden p-0">
        <div className="relative h-64 min-h-52">
          {previewPreset === 'MINIMAL' ? (
            <div className="bg-background text-foreground-secondary flex h-full items-center justify-center text-sm">
              No animated background
            </div>
          ) : (
            <ChannelVisualizer
              preset={previewPreset}
              visualSettingsJson={JSON.stringify(settingsMap)}
              className="h-full w-full"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
            <div>
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                {presetLabel(previewPreset)}
                {visualizerSupportsAudioReactive(previewPreset) ? (
                  <Badge variant="pill" color="blue">
                    Audio reactive
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-white/75">
                {visualizerDescription(previewPreset)}
              </p>
            </div>
            <Eye size={18} aria-hidden />
          </div>
        </div>
        {visualizerSupportsAudioReactive(previewPreset) ? (
          <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-3">
            <span className="text-foreground-secondary text-xs">
              Audio reactivity
              <span className="text-foreground-tertiary ml-1">
                (let the visualizer respond to the playing track)
              </span>
            </span>
            <Toggle
              label="Audio reactivity"
              checked={previewSettings.audioReactive}
              onChange={(checked) =>
                saveTuning(previewPreset, {
                  ...previewSettings,
                  audioReactive: checked,
                })
              }
            />
          </div>
        ) : null}
      </Box>

      <div className="flex flex-col gap-2">
        {VISUAL_PRESETS.map((id) => {
          const active = preset === id;
          const selected = previewPreset === id;
          const metadata = visualizerMetadata(id);
          const Icon = metadata.Icon;
          return (
            <PluginStoreItem
              key={id}
              icon={<Icon size={22} aria-hidden />}
              name={presetLabel(id)}
              author="Tahti"
              description={metadata.description}
              categories={[
                ...(metadata.audioReactive ? ['Audio reactive'] : []),
                ...(selected ? ['Preview'] : []),
              ]}
              isInstalled={active}
              isInstalling={saving === id}
              onInstall={() => {
                setPreviewPreset(id);
                void usePreset(id);
              }}
              labels={{
                install: 'Use',
                installing: 'Applying…',
                installed: 'In use',
              }}
              className={
                selected
                  ? 'border-primary ring-primary/40 ring-2 ring-inset'
                  : undefined
              }
              onClick={() => setPreviewPreset(id)}
              accessory={
                id === 'MINIMAL' ? undefined : (
                  <Tooltip content={`Configure ${presetLabel(id)}`} side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      aria-label={`Configure ${presetLabel(id)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewPreset(id);
                        setConfigurationPreset(id);
                      }}
                    >
                      <SettingsIcon size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                )
              }
            />
          );
        })}
      </div>

      {configurationPreset && configurationSettings ? (
        <Dialog.Root
          isOpen
          onClose={() => setConfigurationPreset(null)}
          className="max-w-lg"
        >
          <Dialog.Title>
            Configure {presetLabel(configurationPreset)}
          </Dialog.Title>
          <Dialog.Description>
            Tune this visualizer while its live preview stays visible behind the
            dialog.
          </Dialog.Description>
          <div className="flex flex-col gap-4">
            <div>
              <Slider
                label="Speed"
                min={0.25}
                max={2}
                step={0.05}
                value={configurationSettings.speed}
                showValue
                onValueChange={(value) =>
                  saveTuning(configurationPreset, {
                    ...configurationSettings,
                    speed: value,
                  })
                }
              >
                <Slider.Surface>
                  <Slider.Track />
                  <Slider.RangeInput />
                </Slider.Surface>
              </Slider>
              <p className="text-foreground-secondary mt-1 text-xs">
                Controls how quickly the shapes, particles, and camera movement
                evolve.
              </p>
            </div>
            <div>
              <Slider
                label="Intensity"
                min={0.25}
                max={2}
                step={0.05}
                value={configurationSettings.intensity}
                showValue
                onValueChange={(value) =>
                  saveTuning(configurationPreset, {
                    ...configurationSettings,
                    intensity: value,
                  })
                }
              >
                <Slider.Surface>
                  <Slider.Track />
                  <Slider.RangeInput />
                </Slider.Surface>
              </Slider>
              <p className="text-foreground-secondary mt-1 text-xs">
                Controls how strongly the scene responds to audio levels.
              </p>
            </div>
            <div>
              <Slider
                label="Scale"
                min={0.5}
                max={2}
                step={0.05}
                value={configurationSettings.scale}
                showValue
                onValueChange={(value) =>
                  saveTuning(configurationPreset, {
                    ...configurationSettings,
                    scale: value,
                  })
                }
              >
                <Slider.Surface>
                  <Slider.Track />
                  <Slider.RangeInput />
                </Slider.Surface>
              </Slider>
              <p className="text-foreground-secondary mt-1 text-xs">
                Grows or shrinks the whole scene.
              </p>
            </div>
            {visualizerSupportsAudioReactive(configurationPreset) ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Audio reactivity
                  <span className="text-foreground-secondary ml-1 text-xs">
                    (respond to the playing track, instead of a gentle idle
                    animation)
                  </span>
                </span>
                <Toggle
                  label="Audio reactivity"
                  checked={configurationSettings.audioReactive}
                  onChange={(checked) =>
                    saveTuning(configurationPreset, {
                      ...configurationSettings,
                      audioReactive: checked,
                    })
                  }
                />
              </div>
            ) : null}
            <Button
              size="sm"
              variant="text"
              className="self-start"
              onClick={() =>
                saveTuning(configurationPreset, DEFAULT_VISUAL_PRESET_SETTINGS)
              }
            >
              Reset to default
            </Button>
          </div>
          <Dialog.Actions>
            <Dialog.Close>Done</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>
      ) : null}
      <p className="text-foreground-secondary text-xs">
        Header style, color scheme, and enable/disable live in{' '}
        <Link
          to="/studio/branding"
          search={{ tab: 'channel-designer' }}
          className="underline underline-offset-2"
          onClick={() => useSettingsModalStore.getState().close()}
        >
          Studio → Branding → Channel Designer
        </Link>
        .
      </p>
    </div>
  );
}

// ── Import / Export / Fingerprinting: one tagged registry ──────────────────

type ServiceAction =
  | { kind: 'deep-link'; to: string; label?: string }
  | {
      kind: 'oauth';
      integrationId: IntegrationId;
      oauthPath: string;
      instructionsHref?: string;
      instructionsLabel?: string;
    }
  | { kind: 'info' };

type ServicePlugin = {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: PluginCategoryId[];
  action: ServiceAction;
};

// 'url' and 'radio' are paste-a-link tools (capabilities.import: false —
// they seed a smart-link target / play a stream, not pull tracks into the
// archive), so they don't belong in this "services you can pull tracks and
// albums in from" list. They remain fully reachable from the Sources page.
const NON_IMPORT_TOOL_IDS = new Set<IntegrationId>(['url', 'radio']);

// Real "log in with the provider" links for the sources that have one —
// shown under the OAuth card's "Not connected yet" state. Google Drive
// omits one since almost every visitor already has a Google account.
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

const IMPORT_SERVICE_PLUGINS: ServicePlugin[] = importSourcePlugins
  .filter(
    (s) =>
      IMPORT_SOURCE_KINDS.has(s.kind) &&
      s.id !== 'hearthis' &&
      !NON_IMPORT_TOOL_IDS.has(s.id),
  )
  .map((s) => ({
    id: s.id,
    name: s.name,
    author: s.kind === 'oauth' ? 'Connect' : 'Tool',
    description: s.description,
    tags: ['import'],
    // Every oauth-kind source configures inline (connect status, and for
    // Bandcamp/SoundCloud a real album/track picker) via OAuthServiceCard —
    // never a deep-link to the old per-source Sources page.
    action:
      s.kind === 'oauth'
        ? {
            kind: 'oauth' as const,
            integrationId: s.id,
            oauthPath: s.oauthStartPath ?? '',
            ...OAUTH_SOURCE_INSTRUCTIONS[s.id],
          }
        : {
            kind: 'deep-link' as const,
            to: s.studioDeepLink ?? `/sources/${s.id}`,
          },
  }));

// Bandcamp/SoundCloud/Mixcloud's export entries were just a "manage the
// connection under Sources" pointer to the same account already fully
// configurable from the Import card above — drop the duplicate rather than
// re-point it at the retired Sources deep-link. (hearthis has never shown
// here — it has its own Import-tagged plugin below.)
const EXPORT_SERVICE_PLUGINS: ServicePlugin[] = EXPORT_TARGETS.filter(
  (target) =>
    !['hearthis', 'bandcamp', 'soundcloud', 'mixcloud'].includes(target.id),
).map((t) => ({
  id: `export-${t.id}`,
  name: t.label,
  author: 'Tahti distribution',
  description: t.note,
  tags: ['export'],
  action: { kind: 'deep-link', to: t.to },
}));

// hearthis.at is an import source (see the file-level doc comment).
const HEARTHIS_PLUGIN: ServicePlugin = {
  id: 'hearthis',
  name: 'hearthis.at',
  author: 'Import',
  description:
    "Search hearthis.at's public catalogue to import tracks and sets.",
  tags: ['import'],
  // HearthisCard configures inline (ConfigurableCard) and ignores this
  // action entirely — see ServiceCard's id === 'hearthis' branch.
  action: { kind: 'info' },
};

const MUSICBRAINZ_PLUGIN: ServicePlugin = {
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
};

const ACOUSTID_PLUGIN: ServicePlugin = {
  id: 'acoustid',
  name: 'AcoustID',
  author: 'Built-in',
  description:
    'Matches uploaded tracks against AcoustID for catalog metadata — always on, no configuration needed.',
  tags: ['fingerprinting'],
  action: { kind: 'info' },
};

const SERVICE_PLUGINS: ServicePlugin[] = [
  ...IMPORT_SERVICE_PLUGINS,
  ...EXPORT_SERVICE_PLUGINS,
  HEARTHIS_PLUGIN,
  MUSICBRAINZ_PLUGIN,
  ACOUSTID_PLUGIN,
];

/** Paste a DSP URL (Spotify/Bandcamp/etc.) to seed a smart-link target on a
 * release — not a track/album import, so it doesn't belong in the Import
 * list above. Ported from the retired Sources page's `url` tab; the
 * "Open releases editor" action closes Add-ons first since it's a real
 * navigation to a different page. */
function DspUrlPasteCard() {
  const [urlPaste, setUrlPaste] = useState('');
  const urlTool = toolSourceAdapter('url');

  return (
    <ConfigurableCard
      title={urlTool?.name ?? 'URL / DSP paste'}
      header={(open) => (
        <PluginStoreItem
          name={urlTool?.name ?? 'URL / DSP paste'}
          author="Tool"
          description={
            urlTool?.description ??
            'Paste Spotify/Bandcamp/etc. URLs to seed smart-link targets on a release.'
          }
          isInstalled={false}
          onInstall={open}
          labels={{ install: 'Configure' }}
        />
      )}
    >
      <p className="text-foreground-secondary text-sm">
        Paste a DSP URL to open Studio releases (smart-link targets).
      </p>
      <Input
        className="w-full"
        size="sm"
        value={urlPaste}
        onChange={(e) => setUrlPaste(e.target.value)}
        placeholder="https://open.spotify.com/track/…"
      />
      <Link
        to={(urlTool?.studioDeepLink ?? '/studio/releases') as never}
        onClick={() => useSettingsModalStore.getState().close()}
      >
        <Button size="sm">
          <Link2Icon size={16} aria-hidden className="mr-1.5" />
          Open releases editor
        </Button>
      </Link>
    </ConfigurableCard>
  );
}

function ServiceCategory({ categoryId }: { categoryId: PluginCategoryId }) {
  const plugins = SERVICE_PLUGINS.filter((p) => p.tags.includes(categoryId));
  return (
    <InstalledAvailableTabs
      ids={plugins.map((p) => p.id)}
      renderItem={(id) => {
        const plugin = plugins.find((p) => p.id === id)!;
        return <ServiceCard key={id} plugin={plugin} />;
      }}
    />
  );
}

function ServiceCard({ plugin }: { plugin: ServicePlugin }) {
  // hearthis/spotify/oauth each track their own real status and write it
  // to usePluginInstallStore themselves (see those cards) — only the
  // remaining kinds (deep-link, info) are decided here, once, up front so
  // this early-return-heavy component never calls the hook conditionally.
  useEffect(() => {
    if (
      plugin.id === 'hearthis' ||
      plugin.id === 'spotify' ||
      plugin.action.kind === 'oauth'
    ) {
      return;
    }
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, plugin.action.kind === 'info');
  }, [plugin.id, plugin.action.kind]);

  if (plugin.id === 'hearthis') {
    return <HearthisCard plugin={plugin} />;
  }
  if (plugin.id === 'spotify') {
    return <SpotifyCard plugin={plugin} />;
  }
  if (plugin.action.kind === 'oauth') {
    return <OAuthServiceCard plugin={plugin} action={plugin.action} />;
  }

  const header = (
    <PluginStoreItem
      name={plugin.name}
      author={plugin.author}
      description={plugin.description}
      isInstalled={plugin.action.kind === 'info'}
      onInstall={() => {}}
      labels={{
        install:
          plugin.action.kind === 'deep-link'
            ? (plugin.action.label ?? 'Open')
            : undefined,
        installed: 'Active',
      }}
    />
  );

  if (plugin.action.kind === 'deep-link') {
    return (
      <Link
        to={plugin.action.to}
        onClick={() => useSettingsModalStore.getState().close()}
      >
        {header}
      </Link>
    );
  }
  return header;
}

function SpotifyCard({ plugin }: { plugin: ServicePlugin }) {
  const [profile, setProfile] = useState<SpotifyArtistProfile | null>(null);
  const [configured, setConfigured] = useState(true);
  const [artistUrl, setArtistUrl] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifySearchTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchSpotifyArtistProfile().then((result) => {
      setConfigured(result.data.configured);
      setProfile(result.data.profile);
      if (result.data.profile?.name) {
        setQuery(result.data.profile.name);
      }
    });
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(profile));
  }, [plugin.id, profile]);

  const search = async () => {
    if (!query.trim()) {
      return;
    }
    setBusy(true);
    const result = await spotifySourceAdapter.search(query.trim());
    setTracks(result.data);
    setSelected(new Set());
    setBusy(false);
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const importSelected = async () => {
    const chosen = tracks.filter((track) => selected.has(track.id));
    if (chosen.length === 0) {
      return;
    }
    setBusy(true);
    const result = await spotifySourceAdapter.importTracks(
      chosen.map((track) => ({
        trackId: track.id,
        title: track.name,
        externalUrl: track.externalUrl,
      })),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(
      `Added ${result.count} Spotify item${result.count === 1 ? '' : 's'} as embeds.`,
    );
    setSelected(new Set());
    setImportOpen(false);
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      header={
        <PluginStoreItem
          name={plugin.name}
          author={plugin.author}
          description="Link your Spotify artist profile and choose tracks to embed in your Tahti library."
          isInstalled={Boolean(profile)}
          onInstall={() => setImportOpen(true)}
          labels={{
            install: profile ? 'Import' : 'Configure',
            installed: 'Configured',
          }}
        />
      }
    >
      {!configured ? (
        <p className="text-foreground-secondary text-sm">
          Spotify import is not available until the platform Spotify credentials
          are configured.
        </p>
      ) : profile ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Linked{profile.name ? `: ${profile.name}` : ''}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setImportOpen(true)}
            >
              <SearchIcon size={14} aria-hidden className="mr-1.5" /> Choose
              content
            </Button>
            <Button
              size="sm"
              variant="text"
              onClick={() => {
                void unlinkSpotifyArtistProfile().then((result) => {
                  if (result.ok) {
                    setProfile(null);
                  } else {
                    setMessage(result.error);
                  }
                });
              }}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" /> Unlink
            </Button>
          </div>
          {message && (
            <p className="text-foreground-secondary text-xs">{message}</p>
          )}
        </>
      ) : (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!artistUrl.trim()) {
              return;
            }
            setBusy(true);
            void linkSpotifyArtistProfile(artistUrl.trim()).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setMessage(result.error);
              } else {
                setProfile(result.data.profile);
                setQuery(result.data.profile?.name ?? '');
              }
            });
          }}
        >
          <Input
            label="Spotify artist URL"
            value={artistUrl}
            onChange={(event) => setArtistUrl(event.target.value)}
            placeholder="https://open.spotify.com/artist/…"
          />
          <Button size="sm" type="submit" disabled={busy || !artistUrl.trim()}>
            {busy ? 'Linking…' : 'Link profile'}
          </Button>
        </form>
      )}
      <Dialog.Root
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        className="max-w-xl"
      >
        <Dialog.Title>Choose Spotify content</Dialog.Title>
        <Dialog.Description>
          Search the linked artist or another Spotify query, select the items
          you want, and add them as provider embeds.
        </Dialog.Description>
        <div className="flex items-end gap-3 py-4">
          <Input
            className="min-w-0 flex-1"
            label="Search Spotify"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            size="sm"
            onClick={() => void search()}
            disabled={busy || !query.trim()}
          >
            <SearchIcon size={15} aria-hidden /> Search
          </Button>
        </div>
        <div className="border-border flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border p-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="border-border flex cursor-pointer items-center gap-2 rounded border p-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{track.name}</span>
              <span className="text-foreground-secondary truncate text-xs">
                {track.artists?.join(', ')}
              </span>
              <Toggle
                label={`Select ${track.name}`}
                checked={selected.has(track.id)}
                onChange={() => toggle(track.id)}
              />
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-foreground-secondary py-5 text-sm">
              Search to see Spotify content.
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            onClick={() => void importSelected()}
            disabled={busy || selected.size === 0}
          >
            Add selected ({selected.size})
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </ConfigurableCard>
  );
}

function OAuthServiceCard({
  plugin,
  action,
}: {
  plugin: ServicePlugin;
  action: Extract<ServiceAction, { kind: 'oauth' }>;
}) {
  const adapter = useMemo(
    () => oauthAdapterFor(action.integrationId, action.oauthPath),
    [action.integrationId, action.oauthPath],
  );
  const [status, setStatus] = useState<{
    connected: boolean;
    username?: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [profileDraft, setProfileDraft] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [bandcampAlbums, setBandcampAlbums] = useState<BandcampAlbum[]>([]);
  const [bandcampBusy, setBandcampBusy] = useState(false);
  const [bandcampMessage, setBandcampMessage] = useState<string | null>(null);
  const [scTracks, setScTracks] = useState<SoundcloudTrack[]>([]);
  const [scBusy, setScBusy] = useState(false);
  const [scMessage, setScMessage] = useState<string | null>(null);

  const reload = () =>
    void adapter.checkStatus().then((r) => setStatus(r.data));

  useEffect(reload, [adapter]);

  useEffect(() => {
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, Boolean(status?.connected));
  }, [plugin.id, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'bandcamp' || !status?.connected) {
      return;
    }
    setBandcampBusy(true);
    setBandcampMessage(null);
    void adapter.listAlbums().then((result) => {
      setBandcampAlbums(result.data);
      setBandcampMessage(result.message ?? null);
      setBandcampBusy(false);
    });
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud' || !status?.connected) {
      return;
    }
    void adapter.listTracks().then((r) => setScTracks(r.data));
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud') {
      return;
    }
    void fetchMeProfile().then((r) => {
      const value = r.data.socialLinks?.soundcloud ?? '';
      setProfileUrl(value);
      setProfileDraft(value);
    });
  }, [adapter]);

  const saveProfileUrl = () => {
    const value = profileDraft.trim();
    if (!value) {
      return;
    }
    setProfileMsg(null);
    void fetchMeProfile().then((profile) =>
      patchMeProfile({
        socialLinks: {
          ...(profile.data.socialLinks ?? {}),
          soundcloud: value,
        },
      }).then((r) => {
        if (!r.ok) {
          setProfileMsg(r.error);
          return;
        }
        setProfileUrl(value);
        setProfileDraft(value);
        setProfileMsg('Saved.');
      }),
    );
  };

  const disconnect = () => {
    setBusy(true);
    void adapter.disconnect().then(() => {
      setBusy(false);
      reload();
    });
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      header={
        <PluginStoreItem
          name={plugin.name}
          author={plugin.author}
          description={plugin.description}
          isInstalled={Boolean(status?.connected)}
          onInstall={() => {
            window.location.href = adapter.oauthUrl;
          }}
          labels={{ install: 'Connect', installed: 'Connected' }}
        />
      }
    >
      {status?.connected ? (
        <>
          <p className="text-sm">
            Connected{status.username ? ` as ${status.username}` : ''}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={busy}
            onClick={disconnect}
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </Button>
          {adapter.id === 'bandcamp' && (
            <div className="border-border flex flex-col gap-3 border-t pt-3">
              <p className="text-sm font-medium">Your Bandcamp discography</p>
              {bandcampBusy ? (
                <p className="text-foreground-secondary text-sm">
                  Loading your releases…
                </p>
              ) : bandcampAlbums.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  {bandcampMessage ?? 'No Bandcamp releases were found.'}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {bandcampAlbums.map((album) => (
                    <li
                      key={album.id}
                      className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <ImageReveal
                        src={album.coverUrl ?? undefined}
                        alt=""
                        className="bg-background-secondary size-10 shrink-0 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {album.title}
                        </div>
                        <div className="text-foreground-secondary text-xs">
                          {album.type ?? 'Release'}
                          {album.trackCount != null
                            ? ` · ${album.trackCount} tracks`
                            : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (adapter.id !== 'bandcamp') {
                            return;
                          }
                          setBandcampMessage(null);
                          void adapter.importAlbum(album).then((result) => {
                            setBandcampMessage(
                              result.ok
                                ? `Imported ${result.count} item${result.count === 1 ? '' : 's'}.`
                                : result.error,
                            );
                          });
                        }}
                      >
                        Import
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {bandcampMessage && bandcampAlbums.length > 0 ? (
                <p className="text-foreground-secondary text-xs" role="status">
                  {bandcampMessage}
                </p>
              ) : null}
            </div>
          )}
          {adapter.id === 'soundcloud' && (
            <div className="border-border flex flex-col gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">Your SoundCloud tracks</p>
                {scTracks.length > 0 && (
                  <Button
                    size="sm"
                    disabled={scBusy}
                    onClick={() => {
                      setScBusy(true);
                      void (
                        adapter.id === 'soundcloud'
                          ? adapter.importTracks(
                              scTracks.map((track) => ({
                                trackId: track.id,
                                title: track.title,
                              })),
                            )
                          : Promise.resolve({
                              ok: false as const,
                              error: 'Unavailable',
                            })
                      ).then((r) => {
                        setScBusy(false);
                        setScMessage(
                          r.ok
                            ? `Queued all ${r.count} SoundCloud tracks. Check Studio → Music.`
                            : r.error,
                        );
                      });
                    }}
                  >
                    {scBusy ? 'Importing…' : `Import all (${scTracks.length})`}
                  </Button>
                )}
              </div>
              {scTracks.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No tracks returned.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {scTracks.map((track) => (
                    <li
                      key={track.id}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {track.title}
                      </span>
                      <Button
                        size="sm"
                        disabled={scBusy}
                        onClick={() => {
                          setScBusy(true);
                          void (
                            adapter.id === 'soundcloud'
                              ? adapter.importTracks([
                                  { trackId: track.id, title: track.title },
                                ])
                              : Promise.resolve({
                                  ok: false as const,
                                  error: 'Unavailable',
                                })
                          ).then((r) => {
                            setScBusy(false);
                            setScMessage(
                              r.ok
                                ? `Queued import (${r.count}). Check Studio → Music.`
                                : r.error,
                            );
                          });
                        }}
                      >
                        Import
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {scMessage && (
                <p className="text-foreground-secondary text-xs" role="status">
                  {scMessage}
                </p>
              )}
              <Input
                label="SoundCloud profile URL"
                value={profileDraft}
                onChange={(e) => setProfileDraft(e.target.value)}
                placeholder="https://soundcloud.com/your-name"
              />
              <div className="flex items-center gap-2">
                <SaveButton
                  size="sm"
                  disabled={!profileDraft.trim() || profileDraft === profileUrl}
                  label="Save profile URL"
                  onClick={saveProfileUrl}
                />
                {profileMsg && (
                  <p className="text-foreground-secondary text-xs">
                    {profileMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-foreground-secondary text-sm">
            Not connected yet.
          </p>
          {action.instructionsHref && action.instructionsLabel && (
            <a
              href={action.instructionsHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-2"
            >
              {action.instructionsLabel} →
            </a>
          )}
        </>
      )}
    </ConfigurableCard>
  );
}

const HEARTHIS_IMPORTS_STORAGE_KEY = 'tahti-web-hearthis-imports';
const NEW_PLAYLIST_DESTINATION = '__new_playlist__';

function HearthisCard({ plugin }: { plugin: ServicePlugin }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const [handle, setHandle] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [library, setLibrary] = useState<HearthisLibrary | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [tab, setTab] = useState<'tracks' | 'sets' | 'collections' | 'search'>(
    'tracks',
  );
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<HearthisTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [destinationCollections, setDestinationCollections] = useState<
    StudioCollection[]
  >([]);
  const [destinationId, setDestinationId] = useState('');
  const [newDestinationName, setNewDestinationName] = useState('');

  useEffect(() => {
    void fetchMeProfile().then((r) => {
      setHandle(r.data.socialLinks?.hearthisAt ?? null);
    });
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(handle));
  }, [plugin.id, handle]);

  const loadLibrary = () => {
    if (!user) {
      return;
    }
    setLibraryBusy(true);
    void Promise.all([
      hearthisSourceAdapter.library(),
      fetchStudioCollections(),
    ]).then(([libraryResult, collectionResult]) => {
      setLibraryBusy(false);
      setLibrary(libraryResult.data);
      setDestinationCollections(collectionResult.data);
      setDestinationId(
        (current) =>
          current || (collectionResult.data.find((c) => c.id)?.id ?? ''),
      );
    });
  };

  useEffect(loadLibrary, [user]);

  useEffect(() => {
    if (!user || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem(`${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`) ??
          '[]',
      ) as unknown;
      setImportedIds(
        new Set(
          Array.isArray(stored)
            ? stored.filter((id): id is string => typeof id === 'string')
            : [],
        ),
      );
    } catch {
      setImportedIds(new Set());
    }
  }, [user]);

  const save = () => {
    const value = draft.trim().replace(/^@/, '');
    if (!value) {
      return;
    }
    setSaving(true);
    setMsg(null);
    void fetchMeProfile().then((profile) =>
      patchMeProfile({
        socialLinks: { ...(profile.data.socialLinks ?? {}), hearthisAt: value },
      }).then((r) => {
        setSaving(false);
        if (!r.ok) {
          setMsg(r.error);
          return;
        }
        setHandle(value);
        setDraft('');
        setMsg('Saved.');
        loadLibrary();
      }),
    );
  };

  const visibleTracks =
    tab === 'tracks'
      ? (library?.tracks ?? [])
      : tab === 'sets'
        ? (library?.sets ?? [])
        : tab === 'search'
          ? hits
          : [];
  const playlistDestinations = destinationCollections.filter(
    (c) => !c.style || c.style === 'PLAYLIST',
  );

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resolveDestinationId = async (): Promise<string | null> => {
    if (destinationId !== NEW_PLAYLIST_DESTINATION) {
      return destinationId || null;
    }
    const name = newDestinationName.trim();
    if (!name) {
      setMsg('Give the new playlist a name first.');
      return null;
    }
    const created = await createStudioCollection({
      name,
      style: 'PLAYLIST',
      isPublic: false,
    });
    if (!created.ok || !created.data.id) {
      setMsg(created.ok ? 'Created playlist has no import ID.' : created.error);
      return null;
    }
    setDestinationCollections((current) => [created.data, ...current]);
    setDestinationId(created.data.id);
    setNewDestinationName('');
    toast.success(`Created playlist “${created.data.name}”.`);
    return created.data.id;
  };

  const persistImportedIds = (nextImportedIds: Set<string>) => {
    if (user && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`,
        JSON.stringify([...nextImportedIds]),
      );
    }
  };

  const importTracksToDestination = async (tracks: HearthisTrack[]) => {
    const resolvedDestinationId = await resolveDestinationId();
    if (!resolvedDestinationId) {
      setMsg((current) => current ?? 'Choose or create a playlist first.');
      return;
    }
    const pendingTracks = tracks.filter((track) => !importedIds.has(track.id));
    if (pendingTracks.length === 0) {
      setMsg(
        'Already imported — each hearthis.at item can only be imported once.',
      );
      toast.info('These hearthis.at tracks are already in your library.');
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(
      `Import started for ${pendingTracks.length} item${pendingTracks.length === 1 ? '' : 's'}…`,
    );
    const result = await hearthisSourceAdapter.importTracks(
      resolvedDestinationId,
      pendingTracks,
    );
    setBusy(false);
    setSelected(new Set());
    const nextImportedIds = new Set(importedIds);
    result.items.forEach((item) => nextImportedIds.add(item.trackId));
    setImportedIds(nextImportedIds);
    persistImportedIds(nextImportedIds);
    const completionMessage =
      result.failed > 0
        ? `Imported ${result.imported}; ${result.failed} could not be imported.`
        : result.artworkFailed > 0
          ? `Imported ${result.imported} item${result.imported === 1 ? '' : 's'}; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
          : `Import completed — ${result.imported} item${result.imported === 1 ? '' : 's'} added to the playlist.`;
    setMsg(completionMessage);
    const firstItem = result.items[0];
    if (firstItem) {
      toast.success(completionMessage, {
        id: notificationId,
        action: {
          label: result.items.length === 1 ? 'Open track' : 'Open first track',
          onClick: () =>
            void navigate({
              to: '/studio/sounds/$id',
              params: { id: firstItem.soundId },
            }),
        },
      });
    } else {
      toast.error(completionMessage, { id: notificationId });
    }
  };

  const importTracksAsCollection = async (
    name: string,
    description: string,
    tracks: HearthisTrack[],
    coverUrl?: string | null,
  ) => {
    const pendingTracks = tracks.filter((track) => !importedIds.has(track.id));
    if (pendingTracks.length === 0) {
      setMsg('Already imported — no duplicate collection was created.');
      toast.info('These hearthis.at items are already in your library.');
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(`Import started for “${name}”…`);
    const created = await createStudioCollection({
      name,
      description,
      style: 'PLAYLIST',
      isPublic: true,
    });
    if (!created.ok || !created.data.id) {
      setBusy(false);
      setMsg(
        created.ok ? 'Created collection has no import ID.' : created.error,
      );
      toast.error('Could not create the destination collection.', {
        id: notificationId,
      });
      return;
    }
    const result = await hearthisSourceAdapter.importTracks(
      created.data.id,
      pendingTracks,
    );
    if (coverUrl) {
      await patchStudioCollection(created.data.slug, { coverUrl });
    }
    setBusy(false);
    const nextImportedIds = new Set(importedIds);
    result.items.forEach((item) => nextImportedIds.add(item.trackId));
    setImportedIds(nextImportedIds);
    persistImportedIds(nextImportedIds);
    const completionMessage =
      result.failed > 0
        ? `Created “${name}” with ${result.imported} items; ${result.failed} failed.`
        : result.artworkFailed > 0
          ? `Created “${name}” with ${result.imported} items; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
          : `Import completed — created “${name}” with ${result.imported} item${result.imported === 1 ? '' : 's'}.`;
    setMsg(completionMessage);
    toast.success(completionMessage, {
      id: notificationId,
      action: {
        label: 'Open collection',
        onClick: () =>
          void navigate({
            to: '/studio/collections/$slug',
            params: { slug: created.data.slug },
          }),
      },
    });
    const collectionsResult = await fetchStudioCollections();
    setDestinationCollections(collectionsResult.data);
  };

  const importCollection = async (
    collection: NonNullable<HearthisLibrary>['collections'][number],
  ) => {
    setBusy(true);
    try {
      const tracks = await hearthisSourceAdapter.collectionTracks(
        collection.permalink,
      );
      await importTracksAsCollection(
        collection.title,
        collection.description,
        tracks,
        collection.coverUrl,
      );
    } catch (error) {
      setBusy(false);
      setMsg(
        error instanceof Error ? error.message : 'Collection import failed.',
      );
    }
  };

  const importSelection = async () => {
    if (tab === 'collections') {
      const collections = (library?.collections ?? []).filter((c) =>
        selected.has(c.id),
      );
      for (const collection of collections) {
        await importCollection(collection);
      }
      setSelected(new Set());
      return;
    }
    const tracks = visibleTracks.filter((track) => selected.has(track.id));
    await importTracksToDestination(tracks);
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      dialogClassName="max-w-3xl"
      header={(open) => (
        <PluginStoreItem
          icon={<SourceServiceIcon id="hearthis" />}
          name={plugin.name}
          author={plugin.author}
          description={plugin.description}
          isInstalled={Boolean(handle)}
          onInstall={open}
          labels={{ install: 'Configure', installed: 'Configured' }}
        />
      )}
    >
      <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        {handle ? (
          <span className="text-sm">
            Connected as <span className="font-medium">@{handle}</span>
          </span>
        ) : (
          <span className="text-foreground-secondary text-sm">
            Add your hearthis.at username to load your library.
          </span>
        )}
        <Input
          className="min-w-[10rem] flex-1"
          size="sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={handle ? 'Change username…' : 'hearthis.at username'}
          aria-label="hearthis.at username"
        />
        <Button size="sm" disabled={saving || !draft.trim()} onClick={save}>
          {saving ? 'Saving…' : handle ? 'Update' : 'Connect'}
        </Button>
      </div>
      {msg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {msg}
        </p>
      )}

      {handle && (
        <>
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              (['tracks', 'sets', 'collections', 'search'] as const).indexOf(
                tab,
              ),
            )}
            onChange={(index) => {
              const next = (
                ['tracks', 'sets', 'collections', 'search'] as const
              )[index];
              if (!next) {
                return;
              }
              setTab(next);
              setSelected(new Set());
            }}
          >
            <Tabs.List aria-label="hearthis.at library" className="flex-wrap">
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.tracks.length ?? 0}
                >
                  Tracks
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.sets.length ?? 0}
                >
                  DJ sets
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<FolderDownIcon size={14} />}
                  count={library?.collections.length ?? 0}
                >
                  Collections
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<SearchIcon size={14} />} count={hits.length}>
                  Search
                </TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          {tab === 'search' && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-[200px] flex-1"
                size="sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search hearthis.at"
              />
              <Button
                size="sm"
                disabled={!q.trim() || libraryBusy}
                onClick={() => {
                  setLibraryBusy(true);
                  void hearthisSourceAdapter.search(q.trim()).then((result) => {
                    setLibraryBusy(false);
                    setHits(result.data);
                  });
                }}
              >
                <SearchIcon size={16} aria-hidden className="mr-1.5" />
                {libraryBusy ? 'Searching…' : 'Search'}
              </Button>
            </div>
          )}

          {tab !== 'collections' && (
            <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <Select
                className="min-w-48 flex-1"
                options={[
                  { id: '', label: 'Choose destination playlist' },
                  { id: NEW_PLAYLIST_DESTINATION, label: 'New playlist…' },
                  ...playlistDestinations.map((c) => ({
                    id: c.id ?? c.slug,
                    label: c.name,
                  })),
                ]}
                value={destinationId}
                onValueChange={setDestinationId}
              />
              {destinationId === NEW_PLAYLIST_DESTINATION ? (
                <Input
                  size="sm"
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  aria-label="New playlist name"
                  placeholder="Playlist name"
                  className="min-w-48 flex-1"
                />
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                disabled={visibleTracks.length === 0}
                onClick={() =>
                  setSelected(
                    new Set(
                      visibleTracks
                        .filter((track) => !importedIds.has(track.id))
                        .map((track) => track.id),
                    ),
                  )
                }
              >
                <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                Select all
              </Button>
              <Button
                size="sm"
                disabled={
                  busy ||
                  !destinationId ||
                  (destinationId === NEW_PLAYLIST_DESTINATION &&
                    !newDestinationName.trim()) ||
                  selected.size === 0
                }
                onClick={() => void importSelection()}
              >
                <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                Import selected ({selected.size})
              </Button>
            </div>
          )}

          {tab === 'collections' ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {(library?.collections ?? []).map((collection) => (
                <li
                  key={collection.id}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <Toggle
                    label={`Select ${collection.title}`}
                    checked={selected.has(collection.id)}
                    onChange={() => toggleSelected(collection.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={collection.coverUrl}
                    alt={collection.title}
                    imageReveal={false}
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {collection.title}
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {collection.trackCount} items
                    </p>
                  </div>
                  <Tooltip content="Import as collection" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void importCollection(collection)}
                      aria-label={`Import ${collection.title} as collection`}
                    >
                      <FolderDownIcon size={15} />
                    </Button>
                  </Tooltip>
                </li>
              ))}
              {(library?.collections.length ?? 0) > 0 && (
                <li className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setSelected(
                        new Set(library?.collections.map((c) => c.id)),
                      )
                    }
                  >
                    <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || selected.size === 0}
                    onClick={() => void importSelection()}
                  >
                    <FolderDownIcon size={15} className="mr-1.5" aria-hidden />
                    Import selected ({selected.size})
                  </Button>
                </li>
              )}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleTracks.map((track) => (
                <li
                  key={track.id}
                  className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <Toggle
                    label={`Select ${track.title}`}
                    checked={selected.has(track.id)}
                    disabled={importedIds.has(track.id)}
                    onChange={() => toggleSelected(track.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={track.coverUrl}
                    alt={track.title}
                    imageReveal={false}
                    onPlay={() => play(playableFromHearthis(track))}
                    playLabel="Preview"
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {track.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {track.username}
                    </div>
                  </div>
                  <Tooltip content="Queue" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      aria-label={`Queue ${track.title}`}
                      onClick={() => enqueue(playableFromHearthis(track))}
                    >
                      <ListPlus size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy ||
                      !destinationId ||
                      (destinationId === NEW_PLAYLIST_DESTINATION &&
                        !newDestinationName.trim()) ||
                      importedIds.has(track.id)
                    }
                    onClick={() => void importTracksToDestination([track])}
                  >
                    <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                    {importedIds.has(track.id) ? 'Imported' : 'Import'}
                  </Button>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-secondary shrink-0 text-xs underline-offset-2 hover:underline"
                  >
                    hearthis.at ↗
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!libraryBusy &&
            tab !== 'search' &&
            tab !== 'collections' &&
            visibleTracks.length === 0 && (
              <p className="text-foreground-secondary text-sm">
                No {tab} found for this profile.
              </p>
            )}
        </>
      )}

      <p className="text-foreground-secondary text-xs">
        A hearthis.at Premium account is required to export your own tracks
        there — importing from hearthis.at works on any account.
      </p>
    </ConfigurableCard>
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

function AudioPluginToggleRow({
  name,
  author,
  description,
  enabled,
  onToggle,
}: {
  name: string;
  author: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <PluginStoreItem
      name={name}
      author={author}
      description={description}
      isInstalled={enabled}
      onInstall={onToggle}
      labels={{ install: 'Activate', installed: 'Active' }}
      accessory={
        <Tooltip content={enabled ? `Deactivate ${name}` : `Activate ${name}`}>
          <Button
            size="icon-sm"
            variant={enabled ? 'default' : 'secondary'}
            onClick={() => onToggle()}
            aria-label={enabled ? `Deactivate ${name}` : `Activate ${name}`}
            aria-pressed={enabled}
          >
            <PowerIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      }
    />
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

/** "Bring your own stream" — distinct from the curated station directory
 * below it (an admin-approved list for the main player bar): this pastes
 * one personal M3U/direct-stream URL, or searches the public Radio Browser
 * directory, and plays/queues/favorites the result. Ported from the
 * retired Sources page's `radio` tab. */
function PersonalRadioStreamCard() {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [station, setStation] = useState<PublicRadioStation | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicRadioStation[]>([]);

  const openStation = (next: PublicRadioStation) => {
    setStation(next);
    setNowPlaying(null);
    setNote(null);
    void readIcyStreamTitle(next.streamUrl).then(setNowPlaying);
  };

  const resolveUrl = () => {
    const input = url.trim();
    if (!input) {
      return;
    }
    setBusy(true);
    setNote(null);
    void resolveStreamUrl(input).then(async ({ streamUrl, title }) => {
      const found = await lookupStationByUrl(streamUrl);
      setBusy(false);
      const next: PublicRadioStation = found ?? {
        id: streamUrl,
        name: title || streamUrl,
        streamUrl,
        source: 'unknown',
      };
      if (!found) {
        setNote(
          'Not in the public station directory — playing the stream directly with the name from the playlist, if any.',
        );
      }
      openStation(next);
    });
  };

  return (
    <ConfigurableCard
      title="Personal radio stream"
      dialogClassName="max-w-2xl"
      header={(open) => (
        <PluginStoreItem
          name="Personal radio stream"
          author="Radio Browser · stream URL"
          description="Paste an M3U/M3U8 playlist or a direct stream URL, or search the public Radio Browser directory — plays via the main player, separate from curated Finnish stations in Radio Browser → Stations."
          categories={station !== null ? ['Configured'] : undefined}
          isInstalled={station !== null}
          onInstall={open}
          labels={{ install: 'Open', installed: 'Ready' }}
        />
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="text-foreground-secondary text-sm">
          Station metadata is looked up in the public Radio Browser directory;
          live "now playing" is read from the stream's ICY metadata when the
          server allows it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[240px] flex-1"
            size="sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/stream.m3u8"
          />
          <Button size="sm" disabled={!url.trim() || busy} onClick={resolveUrl}>
            <RadioIcon size={16} aria-hidden className="mr-1.5" />
            {busy ? 'Resolving…' : 'Resolve'}
          </Button>
        </div>
        {note && <p className="text-foreground-secondary text-xs">{note}</p>}
      </div>

      {station && (
        <div className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3">
          <MediaArtwork
            size="thumb"
            src={station.favicon}
            alt={station.name}
            imageReveal={false}
            onPlay={() => play(playableFromRadioStation(station, nowPlaying))}
            playLabel="Play"
            className="border-border shrink-0 rounded border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{station.name}</div>
            <div className="text-foreground-secondary truncate text-xs">
              {nowPlaying
                ? `Now playing: ${nowPlaying}`
                : nowPlaying === null
                  ? 'Live "now playing" unavailable for this stream'
                  : '…'}
            </div>
            {station.tags && station.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {station.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="pill" color="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Tooltip content="Queue" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={`Queue ${station.name}`}
              onClick={() =>
                enqueue(playableFromRadioStation(station, nowPlaying))
              }
            >
              <ListPlus size={15} aria-hidden />
            </Button>
          </Tooltip>
          <FavoriteButton
            size="sm"
            isFavorite={isFavoriteTrack(`radio:${station.id}`)}
            onToggle={() =>
              toggleFavoriteTrack(playableFromRadioStation(station, nowPlaying))
            }
            ariaLabelAdd={`Favorite ${station.name}`}
            ariaLabelRemove={`Unfavorite ${station.name}`}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-bold tracking-wide uppercase">
          Search the public directory
        </h3>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1"
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Station name"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void searchStationsByName(query.trim()).then(setResults);
            }}
          >
            <SearchIcon size={16} aria-hidden className="mr-1.5" />
            Search
          </Button>
        </div>
        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {results.map((s) => (
              <li
                key={s.id}
                className="border-border hover:bg-background-secondary flex items-center gap-1 rounded-md border pr-1"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left text-sm"
                  onClick={() => openStation(s)}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                    {s.codec}
                    {s.bitrateKbps ? ` ${s.bitrateKbps}kbps` : ''}
                  </span>
                </button>
                <FavoriteButton
                  size="sm"
                  isFavorite={isFavoriteTrack(`radio:${s.id}`)}
                  onToggle={() =>
                    toggleFavoriteTrack(playableFromRadioStation(s))
                  }
                  ariaLabelAdd={`Add ${s.name} to library`}
                  ariaLabelRemove={`Remove ${s.name} from library`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-bold tracking-wide uppercase">
          Common stations
        </h3>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {COMMON_STATIONS.map((s) => (
            <li
              key={s.id}
              className="border-border hover:bg-background-secondary flex items-center gap-1 rounded-md border pr-1"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left text-sm"
                onClick={() => openStation(s)}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                  {s.tags?.[0]}
                </span>
              </button>
              <FavoriteButton
                size="sm"
                isFavorite={isFavoriteTrack(`radio:${s.id}`)}
                onToggle={() =>
                  toggleFavoriteTrack(playableFromRadioStation(s))
                }
                ariaLabelAdd={`Add ${s.name} to library`}
                ariaLabelRemove={`Remove ${s.name} from library`}
              />
            </li>
          ))}
        </ul>
      </div>
    </ConfigurableCard>
  );
}

function RadioBrowserStationRow({
  station,
  onPlay,
  isSaved,
  onToggleSave,
}: {
  station: PublicRadioStation;
  onPlay: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <div className="border-border bg-background flex size-9 shrink-0 items-center justify-center overflow-hidden rounded border">
        <ImageReveal
          src={station.favicon ?? undefined}
          alt=""
          className="size-full"
          imgClassName="object-contain"
          placeholder={
            <RadioIcon
              size={16}
              className="text-foreground-secondary"
              aria-hidden
            />
          }
        />
      </div>
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col items-start text-left"
        onClick={onPlay}
      >
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.country ?? station.tags?.[0] ?? 'Unknown'}
        </span>
      </button>
      <Tooltip content={`Play ${station.name}`} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={`Play ${station.name}`}
          onClick={onPlay}
        >
          <PlayIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <SaveButton
        size="sm"
        label={isSaved ? 'Saved' : 'Save'}
        onClick={onToggleSave}
        aria-label={
          isSaved
            ? `Remove ${station.name} from Listen`
            : `Save ${station.name} to Listen`
        }
      />
    </li>
  );
}

function CuratedFinnishStationRow({
  station,
  enabled,
  onToggleEnable,
  onConfigure,
  onPlay,
  isPlaying,
}: {
  station: RadioStation;
  enabled: boolean;
  onToggleEnable: () => void;
  onConfigure: () => void;
  onPlay: (() => void) | null;
  isPlaying: boolean;
}) {
  const sourceConfigured = Boolean(station.streamUrl);
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <RadioStationCover
        src={station.logoUrl}
        label={station.name}
        stationName={station.name}
        catalogStationId={station.id}
        className="h-9 w-9 shrink-0 overflow-hidden rounded border"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.genre} · {station.bitrateKbps}kbps {station.codec}
          {sourceConfigured ? '' : ' · Needs source'}
        </span>
      </div>
      {onPlay ? (
        <Tooltip content={isPlaying ? 'Pause' : 'Preview'} side="top">
          <Button
            type="button"
            size="icon-sm"
            variant={isPlaying ? undefined : 'secondary'}
            aria-label={
              isPlaying ? `Pause ${station.name}` : `Preview ${station.name}`
            }
            aria-pressed={isPlaying}
            onClick={onPlay}
          >
            {isPlaying ? (
              <PauseIcon size={14} aria-hidden />
            ) : (
              <PlayIcon size={14} aria-hidden />
            )}
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content="Configure station" side="top">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={`Configure ${station.name}`}
          onClick={onConfigure}
        >
          <SettingsIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip
        content={enabled ? `Disable ${station.name}` : `Enable ${station.name}`}
        side="top"
      >
        <Button
          type="button"
          size="icon-sm"
          variant={enabled ? 'default' : 'secondary'}
          aria-label={
            enabled ? `Disable ${station.name}` : `Enable ${station.name}`
          }
          aria-pressed={enabled}
          onClick={onToggleEnable}
        >
          <PowerIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </li>
  );
}

function RadioBrowserDirectoryCard() {
  const enabled = useRadioBrowserStore((s) => s.enabled);
  const setEnabled = useRadioBrowserStore((s) => s.setEnabled);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const savedBrowserStations = useListenerWidgetsStore(
    (s) => s.savedBrowserStations,
  );
  const toggleSavedBrowserStation = useListenerWidgetsStore(
    (s) => s.toggleSavedBrowserStation,
  );
  const enabledStationIds = useListenerWidgetsStore((s) => s.enabledStationIds);
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const updateStation = useListenerWidgetsStore((s) => s.updateStation);

  const [loaded, setLoaded] = useState(false);
  const [stationCount, setStationCount] = useState<number | null>(null);
  const [countries, setCountries] = useState<RadioBrowserCountry[]>([]);
  const [tags, setTags] = useState<RadioBrowserTag[]>([]);
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genresExpanded, setGenresExpanded] = useState(false);
  const [country, setCountry] = useState('');
  const [results, setResults] = useState<PublicRadioStation[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [editingStation, setEditingStation] = useState<RadioStation | null>(
    null,
  );
  const [logoUrlDraft, setLogoUrlDraft] = useState('');
  const [streamUrlDraft, setStreamUrlDraft] = useState('');
  const [streamTestBusy, setStreamTestBusy] = useState(false);
  const [streamTestResult, setStreamTestResult] =
    useState<RadioStreamTestResult | null>(null);

  useEffect(() => {
    if (!enabled || loaded) {
      return;
    }
    setLoaded(true);
    void fetchStationCount().then(setStationCount);
    void fetchCountryList().then(setCountries);
    void fetchTagList().then(setTags);
    void searchStations({ limit: 20 }).then(setResults);
  }, [enabled, loaded]);

  useEffect(() => {
    setLogoUrlDraft(editingStation?.logoUrl ?? '');
    setStreamUrlDraft(editingStation?.streamUrl ?? '');
    setStreamTestBusy(false);
    setStreamTestResult(null);
  }, [editingStation]);

  const runSearch = () => {
    setSearching(true);
    setIsFiltered(Boolean(query.trim() || genres.length > 0 || country));
    void searchStations({
      name: query,
      tags: genres,
      countryCode: country || undefined,
      limit: 30,
    }).then((stations) => {
      setResults(stations);
      setSearching(false);
    });
  };

  const playStation = (station: PublicRadioStation) =>
    play(playableFromRadioStation(station));
  const saveProps = (station: PublicRadioStation) => ({
    isSaved: savedBrowserStations.some((item) => item.id === station.id),
    onToggleSave: () =>
      toggleSavedBrowserStation({
        id: station.id,
        name: station.name,
        streamUrl: station.streamUrl,
        favicon: station.favicon,
        country: station.country,
      }),
  });

  const savedStations = savedBrowserStations.filter((station) =>
    Boolean(station.streamUrl),
  );

  const curatedStations = RADIO_STATIONS.map((baseStation) => ({
    ...baseStation,
    ...stationOverrides[baseStation.id],
  })).sort((a, b) => {
    const aEnabled = enabledStationIds.includes(a.id);
    const bEnabled = enabledStationIds.includes(b.id);
    return aEnabled === bEnabled ? 0 : aEnabled ? -1 : 1;
  });

  const genreOptions = tags.slice(0, 24).map((tag) => ({
    id: tag.name,
    label: tag.name,
  }));

  return (
    <>
      <ConfigurableCard
        title="Radio Browser directory"
        dialogClassName="max-w-2xl"
        header={
          <AudioPluginToggleRow
            name="Radio Browser directory"
            author="radio-browser.info · community directory"
            description="Browse and search 50,000+ public internet radio stations, with genre and country filters — Finnish curated stations live under Stations."
            enabled={enabled}
            onToggle={() => setEnabled(!enabled)}
          />
        }
      >
        {!enabled ? (
          <p className="text-foreground-secondary text-sm">
            Activate the add-on to load Radio Browser, then use these tabs to
            search, save, and enable stations.
          </p>
        ) : (
          <Tabs
            items={[
              {
                id: 'stations',
                label: 'Stations',
                content: (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        Your stations
                      </h3>
                      {savedStations.length === 0 ? (
                        <EmptyState
                          size="sm"
                          title="No saved stations yet"
                          description="Save stations from Browser to show them on Listen."
                        />
                      ) : (
                        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {savedStations.map((station) => {
                            const row: PublicRadioStation = {
                              id: station.id,
                              name: station.name,
                              streamUrl: station.streamUrl,
                              favicon: station.favicon,
                              country: station.country,
                              source: 'unknown',
                            };
                            return (
                              <RadioBrowserStationRow
                                key={station.id}
                                station={row}
                                onPlay={() => playStation(row)}
                                {...saveProps(row)}
                              />
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        Finnish stations
                      </h3>
                      <ul className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                        {curatedStations.map((station) => {
                          const stationEnabled = enabledStationIds.includes(
                            station.id,
                          );
                          const stationPlayableId = `radio-widget:${station.id}`;
                          const stationIsCurrent =
                            currentId === stationPlayableId;
                          const stationIsPlaying =
                            stationIsCurrent &&
                            (playbackStatus === 'playing' ||
                              playbackStatus === 'loading');
                          const streamUrl = station.streamUrl;
                          return (
                            <CuratedFinnishStationRow
                              key={station.id}
                              station={station}
                              enabled={stationEnabled}
                              onToggleEnable={() => toggleStation(station.id)}
                              onConfigure={() => setEditingStation(station)}
                              isPlaying={stationIsPlaying}
                              onPlay={
                                streamUrl
                                  ? () => {
                                      if (stationIsCurrent) {
                                        setPlaybackStatus(
                                          stationIsPlaying
                                            ? 'paused'
                                            : 'playing',
                                        );
                                        return;
                                      }
                                      play(
                                        radioStationPlayable({
                                          ...station,
                                          streamUrl,
                                        }),
                                      );
                                    }
                                  : null
                              }
                            />
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ),
              },
              {
                id: 'browser',
                label: 'Browser',
                content: (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Input
                        size="sm"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            runSearch();
                          }
                        }}
                        placeholder="Search stations"
                        aria-label="Search stations"
                        startAddon={
                          <SearchIcon
                            size={14}
                            aria-hidden
                            className="opacity-70"
                          />
                        }
                        endAddon={
                          <Tooltip content="Search" side="top">
                            <button
                              type="button"
                              disabled={searching}
                              onClick={runSearch}
                              aria-label="Search"
                              className="disabled:opacity-60"
                            >
                              <SearchIcon size={14} aria-hidden />
                            </button>
                          </Tooltip>
                        }
                      />
                      {genreOptions.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            className="text-foreground-secondary hover:text-foreground self-start text-xs font-medium underline-offset-2 hover:underline"
                            onClick={() =>
                              setGenresExpanded((current) => !current)
                            }
                          >
                            {genresExpanded ? 'Hide genres' : 'All genres'}
                          </button>
                          {genresExpanded || genres.length > 0 ? (
                            <FilterChips
                              multiple
                              items={genreOptions}
                              selected={genres}
                              onChange={setGenres}
                              aria-label="Genres"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <Select
                        className="w-full"
                        options={[
                          { id: '', label: 'All countries' },
                          ...countries.map((entry) => ({
                            id: entry.code,
                            label: `${flagEmoji(entry.code)} ${entry.name} (${entry.stationCount})`,
                          })),
                        ]}
                        value={country}
                        onValueChange={setCountry}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        {isFiltered ? 'Results' : 'Popular stations'}
                        {stationCount
                          ? ` · ${stationCount.toLocaleString()} total`
                          : ''}
                      </h3>
                      {results.length === 0 ? (
                        <EmptyState
                          size="sm"
                          title="No stations found"
                          description="Try another search or clear the filters."
                        />
                      ) : (
                        <ul className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                          {results.map((station) => (
                            <RadioBrowserStationRow
                              key={station.id}
                              station={station}
                              onPlay={() => playStation(station)}
                              {...saveProps(station)}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </ConfigurableCard>

      <Dialog.Root
        isOpen={editingStation !== null}
        onClose={() => setEditingStation(null)}
        className="max-w-lg"
      >
        {editingStation && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateStation(editingStation.id, {
                name: String(form.get('name') ?? '').trim(),
                language: String(form.get('language') ?? '').trim(),
                genre: String(form.get('genre') ?? '').trim(),
                bitrateKbps: Number(form.get('bitrateKbps') ?? 0),
                codec: String(form.get('codec') ?? '').trim(),
                logoUrl: String(form.get('logoUrl') ?? '').trim(),
                streamUrl: streamUrlDraft.trim() || null,
                detailUrl: String(form.get('detailUrl') ?? '').trim(),
              });
              setEditingStation(null);
            }}
          >
            <Dialog.Title>Edit {editingStation.name}</Dialog.Title>
            <Dialog.Description>
              Update the station metadata, cover image, and programming source.
            </Dialog.Description>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                name="name"
                label="Station name"
                defaultValue={editingStation.name}
              />
              <Input
                name="language"
                label="Language"
                defaultValue={editingStation.language}
              />
              <Input
                name="genre"
                label="Genre"
                defaultValue={editingStation.genre}
              />
              <Input
                name="bitrateKbps"
                label="Bitrate (kbps)"
                defaultValue={String(editingStation.bitrateKbps)}
                inputMode="numeric"
              />
              <Input
                name="codec"
                label="Codec"
                defaultValue={editingStation.codec}
              />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium">Cover image</span>
                <RadioStationCover
                  src={logoUrlDraft}
                  label={editingStation.name}
                  stationName={editingStation.name}
                  catalogStationId={editingStation.id}
                  className="h-28 w-28 overflow-hidden rounded-lg"
                  onCoverChange={setLogoUrlDraft}
                />
                <input type="hidden" name="logoUrl" value={logoUrlDraft} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Input
                  name="streamUrl"
                  label="Programming source / stream URL"
                  value={streamUrlDraft}
                  onChange={(e) => {
                    setStreamUrlDraft(e.target.value);
                    setStreamTestResult(null);
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!streamUrlDraft.trim() || streamTestBusy}
                    onClick={() => {
                      setStreamTestBusy(true);
                      setStreamTestResult(null);
                      void testRadioStream(streamUrlDraft.trim()).then(
                        (result) => {
                          setStreamTestBusy(false);
                          setStreamTestResult(result);
                        },
                      );
                    }}
                  >
                    {streamTestBusy ? 'Testing…' : 'Test stream'}
                  </Button>
                  {streamTestResult && (
                    <p
                      className={`text-xs ${streamTestResult.ok ? 'text-accent-green' : 'text-foreground-secondary'}`}
                    >
                      {streamTestResult.ok ? '✓ ' : ''}
                      {streamTestResult.message}
                    </p>
                  )}
                </div>
              </div>
              <Input
                name="detailUrl"
                label="Station details URL"
                defaultValue={editingStation.detailUrl}
                className="sm:col-span-2"
              />
            </div>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <SaveButton type="submit" label="Save station" />
            </Dialog.Actions>
          </form>
        )}
      </Dialog.Root>
    </>
  );
}

function RadioCategory() {
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestLogoUrl, setSuggestLogoUrl] = useState('');
  const [suggestLanguage, setSuggestLanguage] = useState('');
  const [suggestBitrate, setSuggestBitrate] = useState('');
  const [suggestStreamUrl, setSuggestStreamUrl] = useState('');
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <PersonalRadioStreamCard />
      <RadioBrowserDirectoryCard />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSuggestOpen((v) => !v)}
        >
          {suggestOpen ? 'Cancel' : 'Suggest a station'}
        </Button>
      </div>

      {suggestOpen && (
        <form
          className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-lg border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSuggestBusy(true);
            setSuggestMsg(null);
            void import('../api/admin')
              .then(({ submitRadioStationSuggestion }) =>
                submitRadioStationSuggestion({
                  name: suggestName.trim(),
                  logoUrl: suggestLogoUrl.trim(),
                  language: suggestLanguage.trim(),
                  bitrateKbps: suggestBitrate.trim(),
                  streamUrl: suggestStreamUrl.trim(),
                }),
              )
              .then((r) => {
                setSuggestBusy(false);
                if (!r.ok) {
                  setSuggestMsg(r.error);
                  return;
                }
                setSuggestMsg('Thanks — sent to the Tahti team for review.');
                setSuggestName('');
                setSuggestLogoUrl('');
                setSuggestLanguage('');
                setSuggestBitrate('');
                setSuggestStreamUrl('');
              });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Station name"
              value={suggestName}
              onChange={(e) => setSuggestName(e.target.value)}
              required
            />
            <Input
              label="Language"
              value={suggestLanguage}
              onChange={(e) => setSuggestLanguage(e.target.value)}
              placeholder="Finnish"
            />
            <Input
              label="Bitrate (kbps)"
              value={suggestBitrate}
              onChange={(e) => setSuggestBitrate(e.target.value)}
              placeholder="128"
            />
            <Input
              label="Logo URL"
              value={suggestLogoUrl}
              onChange={(e) => setSuggestLogoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label="Stream URL"
              value={suggestStreamUrl}
              onChange={(e) => setSuggestStreamUrl(e.target.value)}
              placeholder="https://stream.example.fi/station.mp3"
              className="sm:col-span-2"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              type="submit"
              disabled={
                suggestBusy || !suggestName.trim() || !suggestStreamUrl.trim()
              }
            >
              {suggestBusy ? 'Sending…' : 'Send for review'}
            </Button>
            {suggestMsg && (
              <p className="text-foreground-secondary text-xs">{suggestMsg}</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

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

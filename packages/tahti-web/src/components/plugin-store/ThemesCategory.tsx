import { Link } from '@tanstack/react-router';
import { CircleHelpIcon, Eye, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Box,
  Button,
  Dialog,
  PluginStoreItem,
  Slider,
  ThemeController,
  ThemeStoreItem,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  DEFAULT_VISUAL_PRESET_SETTINGS,
  fetchChannelVisual,
  parseVisualSettingsMap,
  patchChannelVisual,
  resolveVisualPresetSettings,
  VISUAL_PRESETS,
  type VisualPresetSettings,
  type VisualSettingsMap,
} from '../../api/channel-design';
import { useThemeStore } from '../../plugins/themes';
import {
  visualizerMetadata,
  visualizerSupportsAudioReactive,
} from '../../plugins/visualizers';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { ChannelVisualizer } from '../ChannelVisualizer';
import { ThemeEditor } from '../ThemeEditor';
import { ThemeVisualizationSettings } from '../ThemeVisualizationSettings';
import { ConfigurableCard } from './shared';

function visualizerDescription(id: string): string {
  return visualizerMetadata(id).description;
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

export function ThemesCategory() {
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
          showLabels
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

export function VisualizersCategory() {
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
          to="/settings/$section"
          params={{ section: 'artist' }}
          search={{ tab: 'channel-designer' }}
          className="underline underline-offset-2"
          onClick={() => useSettingsModalStore.getState().close()}
        >
          Settings → Artist → Channel Designer
        </Link>
        .
      </p>
    </div>
  );
}

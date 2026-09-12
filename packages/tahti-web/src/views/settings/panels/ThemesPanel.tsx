import {
  CircleHelpIcon,
  Download,
  LayoutGrid,
  Pencil,
  Settings2 as Settings2Icon,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  Input,
  Tabs,
  Textarea,
  ThemeController,
  ThemeStoreItem,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { AMBIENT_SCHEME } from '../../../components/AmbientBackground';
import { ChannelVisualizer } from '../../../components/ChannelVisualizer';
import { ThemeEditor } from '../../../components/ThemeEditor';
import {
  isThemeVisualizationEnabled,
  ThemeVisualizationSettings,
} from '../../../components/ThemeVisualizationSettings';
import { useThemeStore } from '../../../plugins/themes';
import { useAmbientStore } from '../../../stores/ambientStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint } from '../SettingsFields';

export function ThemesPanel() {
  const {
    themes,
    customThemes,
    themeId,
    dark,
    colorMode,
    setTheme,
    setColorMode,
    importCustomTheme,
    renameCustomTheme,
    removeCustomTheme,
  } = useThemeStore();
  const [themeJson, setThemeJson] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [configuringThemeId, setConfiguringThemeId] = useState<string | null>(
    null,
  );
  const [renamingTheme, setRenamingTheme] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Close the nested "Configure theme" dialog in step with the outer
  // Settings modal, not after it — leaving it open while the parent's own
  // exit animation plays stacks two independently-animating overlays and
  // leaves visible fragments of both mid-transition.
  const settingsOpen = useSettingsModalStore((s) => s.isOpen);
  useEffect(() => {
    if (!settingsOpen) {
      setConfiguringThemeId(null);
    }
  }, [settingsOpen]);
  const ambientPreset = useAmbientStore((s) => s.preset);
  const ambientSpeed = useAmbientStore((s) => s.speed);
  const ambientIntensity = useAmbientStore((s) => s.intensity);

  const customEntries = Object.entries(customThemes);
  const dynamicEnabled = colorMode === 'dynamic';

  const exportTheme = (id: string, theme: (typeof customThemes)[string]) => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${
      theme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || id
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SettingsHint>
          Choose a palette and the light, dark, or time-of-day appearance that
          suits you.
        </SettingsHint>
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
      </div>

      <Tabs
        listClassName="flex-wrap"
        items={[
          {
            id: 'browse',
            label: 'Browse',
            icon: <LayoutGrid size={14} />,
            content: (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {themes.map((theme) => {
                    const active = theme.id === themeId;
                    const configurable = isThemeVisualizationEnabled(theme.id);
                    return (
                      <ThemeStoreItem
                        key={theme.id}
                        name={theme.name}
                        description="Built-in Nuclear theme"
                        author="Tahti"
                        palette={theme.palette}
                        isInstalled
                        isActive={active}
                        onInstall={() => setTheme(theme.id)}
                        onApply={() => setTheme(theme.id)}
                        labels={{
                          apply: 'Apply',
                          active: 'Active',
                        }}
                        accessory={
                          configurable ? (
                            <Tooltip
                              content={`Configure ${theme.name}`}
                              side="top"
                            >
                              <Button
                                size="icon-sm"
                                variant="secondary"
                                aria-label={`Configure ${theme.name}`}
                                onClick={() => setConfiguringThemeId(theme.id)}
                              >
                                <Settings2Icon size={14} aria-hidden />
                              </Button>
                            </Tooltip>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>

                {customEntries.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-foreground-secondary text-xs uppercase">
                      Your imported themes
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {customEntries.map(([id, theme]) => {
                        const active = id === themeId;
                        const configurable = isThemeVisualizationEnabled(id);
                        const palette: [string, string, string, string] = [
                          theme.palette?.[0] ?? '#888888',
                          theme.palette?.[1] ?? '#666666',
                          theme.palette?.[2] ?? '#444444',
                          theme.palette?.[3] ?? '#222222',
                        ];
                        return (
                          <ThemeStoreItem
                            key={id}
                            name={theme.name}
                            description={theme.description ?? 'Imported theme'}
                            author={theme.author ?? 'Imported'}
                            palette={palette}
                            tags={theme.tags}
                            isInstalled
                            isActive={active}
                            onInstall={() => setTheme(id)}
                            onApply={() => setTheme(id)}
                            onUninstall={() => removeCustomTheme(id)}
                            labels={{
                              apply: 'Apply',
                              active: 'Active',
                              uninstall: 'Remove',
                            }}
                            accessory={
                              <>
                                {configurable ? (
                                  <Tooltip
                                    content={`Configure ${theme.name}`}
                                    side="top"
                                  >
                                    <Button
                                      size="icon-sm"
                                      variant="secondary"
                                      aria-label={`Configure ${theme.name}`}
                                      onClick={() => setConfiguringThemeId(id)}
                                    >
                                      <Settings2Icon size={14} aria-hidden />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                                <Tooltip
                                  content={`Rename ${theme.name}`}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={`Rename ${theme.name}`}
                                    onClick={() =>
                                      setRenamingTheme({
                                        id,
                                        name: theme.name,
                                      })
                                    }
                                  >
                                    <Pencil size={14} aria-hidden />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Export theme JSON" side="top">
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={`Export ${theme.name} as JSON`}
                                    onClick={() => exportTheme(id, theme)}
                                  >
                                    <Download size={14} aria-hidden />
                                  </Button>
                                </Tooltip>
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'editor',
            label: 'Editor',
            icon: <Pencil size={14} />,
            content: <ThemeEditor />,
          },
          {
            id: 'import',
            label: 'Import JSON',
            icon: <Upload size={14} />,
            content: (
              <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
                <h3 className="font-bold">Import a theme</h3>
                <SettingsHint>
                  Paste a theme JSON (matches @tahti-player/themes'
                  AdvancedThemeSchema — version, name, and vars / dark CSS
                  variable overrides) to add it without a code change.
                </SettingsHint>
                <Textarea
                  tone="secondary"
                  className="font-mono text-xs"
                  rows={6}
                  value={themeJson}
                  onChange={(e) => setThemeJson(e.target.value)}
                  placeholder={
                    '{\n  "version": 1,\n  "name": "My theme",\n  "vars": { "primary": "oklch(0.7 0.15 250)" }\n}'
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!themeJson.trim()}
                    onClick={() => {
                      let parsed: unknown;
                      try {
                        parsed = JSON.parse(themeJson);
                      } catch {
                        setImportMsg('Not valid JSON.');
                        return;
                      }
                      const result = importCustomTheme(parsed);
                      if (!result.ok) {
                        setImportMsg(result.error);
                      } else {
                        setImportMsg(null);
                        setThemeJson('');
                      }
                    }}
                  >
                    Import & apply
                  </Button>
                  {importMsg && (
                    <span className="text-accent-red text-xs">{importMsg}</span>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      <Dialog.Root
        isOpen={configuringThemeId !== null}
        onClose={() => setConfiguringThemeId(null)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure theme</Dialog.Title>
        <div className="mt-4 flex flex-col gap-4">
          <div className="border-border h-40 overflow-hidden rounded-lg border">
            <ChannelVisualizer
              className="h-full w-full"
              preset={ambientPreset}
              colorScheme={AMBIENT_SCHEME}
              visualSettingsJson={`{"${ambientPreset}":{"speed":${ambientSpeed},"intensity":${ambientIntensity}}}`}
            />
          </div>
          <ThemeVisualizationSettings
            themeId={configuringThemeId ?? undefined}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>

      <Dialog.Root
        isOpen={renamingTheme !== null}
        onClose={() => setRenamingTheme(null)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renamingTheme) {
              renameCustomTheme(renamingTheme.id, renamingTheme.name);
            }
            setRenamingTheme(null);
          }}
        >
          <Dialog.Title>Rename theme</Dialog.Title>
          <div className="mt-4">
            <Input
              label="Name"
              value={renamingTheme?.name ?? ''}
              onChange={(e) =>
                setRenamingTheme((cur) =>
                  cur ? { ...cur, name: e.target.value } : cur,
                )
              }
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button type="submit" disabled={!renamingTheme?.name.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </div>
  );
}

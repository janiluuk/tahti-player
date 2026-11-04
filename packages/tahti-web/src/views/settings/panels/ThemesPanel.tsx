import {
  Check,
  CircleHelpIcon,
  Download,
  LayoutGrid,
  Pencil,
  Settings2 as Settings2Icon,
  Share2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  Tabs,
  ThemeController,
  ThemeStoreItem,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchMyThemes,
  submitThemeToCommunity,
  type MyTheme,
} from '../../../api/me-themes';
import { AMBIENT_SCHEME } from '../../../components/AmbientBackground';
import { ChannelVisualizer } from '../../../components/ChannelVisualizer';
import { PageError } from '../../../components/PageStates';
import { ThemeEditor } from '../../../components/ThemeEditor';
import { ThemeSubmissions } from '../../../components/ThemeSubmissions';
import {
  isThemeVisualizationEnabled,
  ThemeVisualizationSettings,
} from '../../../components/ThemeVisualizationSettings';
import { isPresetCustomThemeId, useThemeStore } from '../../../plugins/themes';
import { useAmbientStore } from '../../../stores/ambientStore';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint } from '../SettingsFields';

export function ThemesPanel() {
  const { t } = useTranslation('web');
  const {
    themes,
    customThemes,
    themeId,
    dark,
    colorMode,
    setTheme,
    setColorMode,
    renameCustomTheme,
    removeCustomTheme,
  } = useThemeStore(
    useShallow((s) => ({
      themes: s.themes,
      customThemes: s.customThemes,
      themeId: s.themeId,
      dark: s.dark,
      colorMode: s.colorMode,
      setTheme: s.setTheme,
      setColorMode: s.setColorMode,
      renameCustomTheme: s.renameCustomTheme,
      removeCustomTheme: s.removeCustomTheme,
    })),
  );
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const [submissions, setSubmissions] = useState<MyTheme[]>([]);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const loadSubmissions = useCallback(() => {
    if (!signedIn) {
      setSubmissions([]);
      setSubmissionsError(null);
      return;
    }
    void fetchMyThemes().then((result) => {
      if (result.ok) {
        setSubmissionsError(null);
        setSubmissions(result.data);
        return;
      }
      setSubmissionsError(result.error);
    });
  }, [signedIn]);
  useEffect(loadSubmissions, [loadSubmissions]);
  const [themeSection, setThemeSection] = useState(0);
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
  const activeThemeName =
    themes.find((theme) => theme.id === themeId)?.name ??
    customThemes[themeId]?.name;
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
        <SettingsHint>{t('settingsThemes.hint')}</SettingsHint>
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
              label={t('settingsThemes.dynamicTheme')}
            />
            <span className="text-sm font-medium">
              {t('settingsThemes.dynamic')}
            </span>
            <Tooltip content={t('settingsThemes.dynamicTooltip')}>
              <CircleHelpIcon
                size={14}
                className="text-foreground-secondary"
                aria-label={t('settingsThemes.dynamicHelp')}
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <Tabs
        listClassName="flex-wrap"
        selectedIndex={themeSection}
        onChange={setThemeSection}
        items={[
          {
            id: 'browse',
            label: t('settingsThemes.browse'),
            icon: <LayoutGrid size={14} />,
            content: (
              <div className="flex flex-col gap-3">
                {/* Pinned above the lists so the current choice is visible
                    without scrolling past the built-in and imported themes. */}
                {activeThemeName ? (
                  <p
                    role="status"
                    data-testid="themes-current"
                    className="text-foreground flex items-center gap-2 text-sm"
                  >
                    <Check
                      size={16}
                      className="text-primary-strong"
                      aria-hidden
                    />
                    <span>
                      {t('settingsThemes.currentTheme')}{' '}
                      <span className="font-semibold">{activeThemeName}</span>
                    </span>
                  </p>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  {themes.map((theme) => {
                    const active = theme.id === themeId;
                    const configurable = isThemeVisualizationEnabled(theme.id);
                    return (
                      <ThemeStoreItem
                        key={theme.id}
                        name={theme.name}
                        headingLevel={2}
                        description={t('settingsThemes.builtIn')}
                        author="Tahti"
                        palette={theme.palette}
                        isInstalled
                        isActive={active}
                        onInstall={() => setTheme(theme.id)}
                        onApply={() => setTheme(theme.id)}
                        labels={{
                          apply: t('settingsThemes.apply'),
                          active: t('settingsThemes.active'),
                        }}
                        accessory={
                          configurable ? (
                            <Tooltip
                              content={t('settingsThemes.configure', {
                                name: theme.name,
                              })}
                              side="top"
                            >
                              <Button
                                size="icon-sm"
                                variant="secondary"
                                aria-label={t('settingsThemes.configure', {
                                  name: theme.name,
                                })}
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
                    <h2 className="text-foreground-secondary text-xs uppercase">
                      {t('settingsThemes.importedThemes')}
                    </h2>
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
                            description={
                              theme.description ??
                              t('settingsThemes.importedTheme')
                            }
                            author={
                              theme.author ?? t('settingsThemes.imported')
                            }
                            palette={palette}
                            tags={theme.tags}
                            isInstalled
                            isActive={active}
                            onInstall={() => setTheme(id)}
                            onApply={() => setTheme(id)}
                            onUninstall={() => removeCustomTheme(id)}
                            labels={{
                              apply: t('settingsThemes.apply'),
                              active: t('settingsThemes.active'),
                              uninstall: t('settingsThemes.remove'),
                            }}
                            accessory={
                              <>
                                {configurable ? (
                                  <Tooltip
                                    content={t('settingsThemes.configure', {
                                      name: theme.name,
                                    })}
                                    side="top"
                                  >
                                    <Button
                                      size="icon-sm"
                                      variant="secondary"
                                      aria-label={t(
                                        'settingsThemes.configure',
                                        { name: theme.name },
                                      )}
                                      onClick={() => setConfiguringThemeId(id)}
                                    >
                                      <Settings2Icon size={14} aria-hidden />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                                <Tooltip
                                  content={t('settingsThemes.rename', {
                                    name: theme.name,
                                  })}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={t('settingsThemes.rename', {
                                      name: theme.name,
                                    })}
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
                                {signedIn && !isPresetCustomThemeId(id) ? (
                                  <Tooltip
                                    content={t(
                                      'settingsThemes.submitToCatalog',
                                    )}
                                    side="top"
                                  >
                                    <Button
                                      size="icon-sm"
                                      variant="secondary"
                                      aria-label={t(
                                        'settingsThemes.submitToCommunity',
                                        {
                                          name: theme.name,
                                        },
                                      )}
                                      disabled={
                                        submittingId === id ||
                                        submissions.some(
                                          (item) =>
                                            item.name === theme.name &&
                                            item.visibility ===
                                              'PENDING_REVIEW',
                                        )
                                      }
                                      onClick={() => {
                                        setSubmittingId(id);
                                        void submitThemeToCommunity(theme).then(
                                          (result) => {
                                            setSubmittingId(null);
                                            if (!result.ok) {
                                              toast.error(result.error);
                                              return;
                                            }
                                            toast.success(
                                              t(
                                                'settingsThemes.sentForReview',
                                                {
                                                  name: theme.name,
                                                },
                                              ),
                                            );
                                            loadSubmissions();
                                          },
                                        );
                                      }}
                                    >
                                      <Share2Icon size={14} aria-hidden />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                                <Tooltip
                                  content={t('settingsThemes.exportJson')}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    aria-label={t(
                                      'settingsThemes.exportAsJson',
                                      {
                                        name: theme.name,
                                      },
                                    )}
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
                {submissionsError ? (
                  <PageError
                    title={t('settingsThemes.submissionsError')}
                    description={submissionsError}
                    onRetry={loadSubmissions}
                  />
                ) : null}
                <ThemeSubmissions
                  themes={submissions}
                  onChanged={loadSubmissions}
                  onError={(message) => toast.error(message)}
                />
              </div>
            ),
          },
          {
            id: 'editor',
            label: t('settingsThemes.editor'),
            icon: <Pencil size={14} />,
            content: themeSection === 1 ? <ThemeEditor /> : null,
          },
        ]}
      />

      <Dialog.Root
        isOpen={configuringThemeId !== null}
        onClose={() => setConfiguringThemeId(null)}
        className="max-w-lg"
      >
        <Dialog.Title>{t('settingsThemes.configureTheme')}</Dialog.Title>
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
          <Dialog.Close>{t('settingsThemes.done')}</Dialog.Close>
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
          <Dialog.Title>{t('settingsThemes.renameTheme')}</Dialog.Title>
          <div className="mt-4">
            <Input
              autoComplete="off"
              label={t('settingsThemes.name')}
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
            <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
            <Button type="submit" disabled={!renamingTheme?.name.trim()}>
              {t('actions.save')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </div>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  applyAdvancedTheme,
  clearAdvancedTheme,
  listBasicThemes,
  parseAdvancedTheme,
  setBasicTheme,
  type AdvancedTheme,
  type BasicThemeMeta,
} from '@tahti-player/themes';

import {
  CLAUDE_THEME,
  CLAUDE_THEME_ID,
  COTTON_CANDY_THEME,
  COTTON_CANDY_THEME_ID,
  DAYDREAM_THEME,
  DAYDREAM_THEME_ID,
  DEEP_BLACK_THEME,
  DEEP_BLACK_THEME_ID,
  DRACULA_THEME,
  DRACULA_THEME_ID,
  EVERFOREST_THEME,
  EVERFOREST_THEME_ID,
  GREEN_MACHINE_THEME,
  GREEN_MACHINE_THEME_ID,
  GRUVBOX_THEME,
  GRUVBOX_THEME_ID,
  NEON_VIOLET_PINK_DUO_THEME,
  NEON_VIOLET_PINK_DUO_THEME_ID,
  NORD_THEME,
  NORD_THEME_ID,
  NUCLEAR_GREEN_THEME,
  NUCLEAR_GREEN_THEME_ID,
  OCEAN_GLOW_THEME,
  OCEAN_GLOW_THEME_ID,
  ONE_DARK_BLUE_THEME,
  ONE_DARK_BLUE_THEME_ID,
  ONE_DARK_THEME,
  ONE_DARK_THEME_ID,
  PIXEL_THEME,
  PIXEL_THEME_ID,
  PURPLE_VOID_THEME,
  PURPLE_VOID_THEME_ID,
  ROS_PINE_THEME,
  ROS_PINE_THEME_ID,
  RUBY_GLOW_THEME,
  RUBY_GLOW_THEME_ID,
  SOLARIZED_THEME,
  SOLARIZED_THEME_ID,
  SPOTIFY_DARK_THEME,
  SPOTIFY_DARK_THEME_ID,
  TAHTI_BLUE_THEME,
  TAHTI_BLUE_THEME_ID,
  YORHA_THEME,
  YORHA_THEME_ID,
} from './presets';

const CUSTOM_THEME_PREFIX = 'custom:';

const THEME_KEY = 'tahti-nuclear-theme-id';
const DARK_KEY = 'tahti-nuclear-dark';
const PERSIST_NAME = 'tahti-web-theme';

const DEFAULT_THEME_ID = 'nuclear:tahti-dark';

export type ColorMode = 'light' | 'dark' | 'dynamic';

/** Dark 19:00–06:59, light 07:00–18:59 local time. */
export function isDynamicDark(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour < 7 || hour >= 19;
}

export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true;
  }
}

function resolveDarkForMode(mode: ColorMode): boolean {
  if (mode === 'light') {
    return false;
  }
  if (mode === 'dark') {
    return true;
  }
  return isDynamicDark();
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'theme'
  );
}

function knownBasicThemeIds(): Set<string> {
  return new Set(listBasicThemes().map((t) => t.id));
}

/** Themes shipped pre-installed in the "Your imported themes" list — added
 * by stable id on every load if not already present. A rename is kept (the
 * id stays put), but removing one lets it reappear on the next load since
 * there's no persisted "user deleted this on purpose" flag. */
const PRESET_CUSTOM_THEMES: Record<string, AdvancedTheme> = {
  [TAHTI_BLUE_THEME_ID]: TAHTI_BLUE_THEME,
  [NUCLEAR_GREEN_THEME_ID]: NUCLEAR_GREEN_THEME,
  // Imported from the official Nuclear community theme store
  // (github.com/NuclearPlayer/theme-registry).
  [SPOTIFY_DARK_THEME_ID]: SPOTIFY_DARK_THEME,
  [CLAUDE_THEME_ID]: CLAUDE_THEME,
  [COTTON_CANDY_THEME_ID]: COTTON_CANDY_THEME,
  [DAYDREAM_THEME_ID]: DAYDREAM_THEME,
  [DEEP_BLACK_THEME_ID]: DEEP_BLACK_THEME,
  [DRACULA_THEME_ID]: DRACULA_THEME,
  [EVERFOREST_THEME_ID]: EVERFOREST_THEME,
  [GREEN_MACHINE_THEME_ID]: GREEN_MACHINE_THEME,
  [GRUVBOX_THEME_ID]: GRUVBOX_THEME,
  [NEON_VIOLET_PINK_DUO_THEME_ID]: NEON_VIOLET_PINK_DUO_THEME,
  [NORD_THEME_ID]: NORD_THEME,
  [OCEAN_GLOW_THEME_ID]: OCEAN_GLOW_THEME,
  [ONE_DARK_THEME_ID]: ONE_DARK_THEME,
  [ONE_DARK_BLUE_THEME_ID]: ONE_DARK_BLUE_THEME,
  [PIXEL_THEME_ID]: PIXEL_THEME,
  [PURPLE_VOID_THEME_ID]: PURPLE_VOID_THEME,
  [ROS_PINE_THEME_ID]: ROS_PINE_THEME,
  [RUBY_GLOW_THEME_ID]: RUBY_GLOW_THEME,
  [SOLARIZED_THEME_ID]: SOLARIZED_THEME,
  [YORHA_THEME_ID]: YORHA_THEME,
};

function withPresetCustomThemes(
  customThemes: Record<string, AdvancedTheme>,
): Record<string, AdvancedTheme> {
  const missing = Object.entries(PRESET_CUSTOM_THEMES).filter(
    ([id]) => !(id in customThemes),
  );
  if (missing.length === 0) {
    return customThemes;
  }
  return { ...customThemes, ...Object.fromEntries(missing) };
}

function resolveThemeId(
  id: string | null | undefined,
  customThemes: Record<string, AdvancedTheme>,
): string {
  if (id && knownBasicThemeIds().has(id)) {
    return id;
  }
  if (id && id.startsWith(CUSTOM_THEME_PREFIX) && customThemes[id]) {
    return id;
  }
  return DEFAULT_THEME_ID;
}

function applyToDocument(
  themeId: string,
  dark: boolean,
  customThemes: Record<string, AdvancedTheme>,
) {
  const custom = customThemes[themeId];
  if (custom) {
    // Basic theme underneath supplies structural fallbacks; the advanced
    // theme's CSS vars layer on top as an override.
    setBasicTheme(DEFAULT_THEME_ID);
    applyAdvancedTheme(custom);
  } else {
    clearAdvancedTheme();
    setBasicTheme(themeId);
  }
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  // Keep legacy keys in sync for the early index.html bootstrap.
  try {
    localStorage.setItem(THEME_KEY, themeId);
    localStorage.setItem(DARK_KEY, dark ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}

type ThemeState = {
  themes: BasicThemeMeta[];
  customThemes: Record<string, AdvancedTheme>;
  themeId: string;
  dark: boolean;
  /** User's chosen appearance preference. 'dynamic' re-resolves `dark`
   * against the local clock (see `isDynamicDark`) on an interval so it
   * keeps tracking day/night while the app stays open. */
  colorMode: ColorMode;
  hydrated: boolean;
  init: () => void;
  setTheme: (id: string) => void;
  /** Low-level: applies a dark/light boolean without touching colorMode.
   * Prefer `setColorMode` from UI — this exists for internal re-application
   * (e.g. the dynamic-mode clock tick). */
  setDark: (dark: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  /** Parses and applies a theme JSON matching @tahti-player/themes'
   * AdvancedThemeSchema, persisting it under a generated id. */
  importCustomTheme: (
    json: unknown,
  ) => { ok: true; id: string } | { ok: false; error: string };
  renameCustomTheme: (
    id: string,
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  removeCustomTheme: (id: string) => void;
};

let dynamicModeInterval: ReturnType<typeof setInterval> | undefined;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themes: listBasicThemes(),
      customThemes: {},
      themeId: DEFAULT_THEME_ID,
      dark: false,
      colorMode: 'light',
      hydrated: false,

      init: () => {
        const { themeId, colorMode } = get();
        const customThemes = withPresetCustomThemes(get().customThemes);
        const id = resolveThemeId(themeId, customThemes);
        const dark = resolveDarkForMode(colorMode);
        applyToDocument(id, dark, customThemes);
        set({ customThemes, themeId: id, dark, hydrated: true });

        if (typeof window !== 'undefined' && !dynamicModeInterval) {
          dynamicModeInterval = setInterval(
            () => {
              const state = get();
              if (state.colorMode !== 'dynamic') {
                return;
              }
              const nextDark = isDynamicDark();
              if (nextDark !== state.dark) {
                state.setDark(nextDark);
              }
            },
            5 * 60 * 1000,
          );
        }
      },

      setTheme: (rawId) => {
        const { dark, customThemes } = get();
        const id = resolveThemeId(rawId, customThemes);
        applyToDocument(id, dark, customThemes);
        set({ themeId: id });
      },

      setColorMode: (mode) => {
        const { themeId, customThemes } = get();
        const dark = resolveDarkForMode(mode);
        applyToDocument(themeId, dark, customThemes);
        set({ colorMode: mode, dark });
      },

      setDark: (dark) => {
        const { themeId, customThemes } = get();
        applyToDocument(themeId, dark, customThemes);
        set({ dark });
      },

      importCustomTheme: (json) => {
        let theme: AdvancedTheme;
        try {
          theme = parseAdvancedTheme(json);
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : 'Invalid theme JSON',
          };
        }
        const id = `${CUSTOM_THEME_PREFIX}${slugify(theme.name)}-${Date.now().toString(36)}`;
        const customThemes = { ...get().customThemes, [id]: theme };
        applyToDocument(id, get().dark, customThemes);
        set({ customThemes, themeId: id });
        return { ok: true, id };
      },

      renameCustomTheme: (id, name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return { ok: false, error: 'Theme name cannot be empty.' };
        }
        const existing = get().customThemes[id];
        if (!existing) {
          return { ok: false, error: 'Theme was not found.' };
        }
        const customThemes = {
          ...get().customThemes,
          [id]: { ...existing, name: trimmedName },
        };
        if (get().themeId === id) {
          applyToDocument(id, get().dark, customThemes);
        }
        set({ customThemes });
        return { ok: true };
      },

      removeCustomTheme: (id) => {
        const customThemes = Object.fromEntries(
          Object.entries(get().customThemes).filter(([key]) => key !== id),
        );
        const stillActive = get().themeId === id;
        set({ customThemes });
        if (stillActive) {
          const fallback = resolveThemeId(undefined, customThemes);
          applyToDocument(fallback, get().dark, customThemes);
          set({ themeId: fallback });
        }
      },
    }),
    {
      name: PERSIST_NAME,
      partialize: (s) => ({
        themeId: s.themeId,
        dark: s.dark,
        colorMode: s.colorMode,
        customThemes: s.customThemes,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        const id = resolveThemeId(state.themeId, state.customThemes);
        const dark = resolveDarkForMode(state.colorMode);
        applyToDocument(id, dark, state.customThemes);
        state.themeId = id;
        state.dark = dark;
        state.hydrated = true;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ThemeState>;
        // Migrate from older localStorage keys if zustand bag is empty.
        let themeId = p.themeId;
        let dark = p.dark;
        let colorMode = p.colorMode;
        try {
          if (themeId == null) {
            themeId = localStorage.getItem(THEME_KEY) ?? undefined;
          }
          if (dark == null) {
            const raw = localStorage.getItem(DARK_KEY);
            dark = raw == null ? undefined : raw === '1';
          }
        } catch {
          // ignore
        }
        if (colorMode == null) {
          // Preserve an existing explicit dark/light choice as-is; a
          // genuinely first-ever load has no preference yet, so match the
          // OS instead of hardcoding dark.
          colorMode =
            dark == null
              ? systemPrefersDark()
                ? 'dark'
                : 'light'
              : dark
                ? 'dark'
                : 'light';
        }
        const customThemes = p.customThemes ?? {};
        return {
          ...current,
          customThemes,
          themeId: resolveThemeId(themeId, customThemes),
          colorMode,
          dark: resolveDarkForMode(colorMode),
        };
      },
    },
  ),
);

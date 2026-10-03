import type { Decorator, Preview } from '@storybook/react-vite';
import { createElement } from 'react';

import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/space-mono/400.css';
import '@tahti-player/tailwind-config';
import '@tahti-player/themes';
import './dark-docs.css';

import {
  resetMockOverrides,
  setMockOverrides,
  type MockOverrides,
} from '@tahti-web/api/mock-overrides';

import { listBasicThemes } from '@tahti-player/themes';

// Every real basic theme (Default/Aurora/Ember/Lagoon/Moss/Tahti), read
// from the same source the live app's theme picker uses — see
// packages/themes/src/index.ts's listBasicThemes(). Keeps this toolbar in
// sync automatically if a theme is added/renamed instead of hardcoding
// theme ids here. Themes apply via [data-theme-id] (see e.g.
// packages/themes/src/basic/arctic-moss.css); "Tahti" is a fixed-dark
// identity that ignores the separate Mode toggle below, "Moss" has its
// own distinct dark variant ("the green dark mode") stacked with it.
//
// Two independent toolbar globals (Theme palette, Mode light/dark) via a
// single manual decorator, NOT two withThemeByDataAttribute() decorators
// — that addon-themes helper has no `globalName` option, so two instances
// collide on the same global/toolbar slot and only one dropdown actually
// renders. Writing the decorator by hand keeps both switches genuinely
// independent, matching how the live app's data-theme-id/data-theme
// attributes are orthogonal (packages/themes/src/index.ts, Card.tsx).
const THEME_ID_ITEMS = listBasicThemes().map((theme) => ({
  value: theme.id,
  title: theme.name,
}));

const withTahtiTheme: Decorator = (Story, context) => {
  const root = document.documentElement;
  root.setAttribute(
    'data-theme-id',
    context.globals.themeId ?? THEME_ID_ITEMS[0]?.value ?? 'nuclear:default',
  );
  if (context.globals.themeMode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  return createElement(Story);
};

const preview: Preview = {
  decorators: [withTahtiTheme],
  // Seeds tahti-web's mock fixture overrides from `parameters.mockData`
  // before each story renders, and clears them afterwards so one story's
  // data never leaks into the next. See src/tahti-web/_lib/README.md.
  beforeEach: ({ parameters }) => {
    setMockOverrides((parameters.mockData as MockOverrides | undefined) ?? {});
    return () => resetMockOverrides();
  },
  globalTypes: {
    themeId: {
      name: 'Theme',
      description: 'Basic theme palette',
      defaultValue: THEME_ID_ITEMS[0]?.value,
      toolbar: {
        icon: 'paintbrush',
        items: THEME_ID_ITEMS,
        dynamicTitle: true,
      },
    },
    themeMode: {
      name: 'Mode',
      description: 'Light / dark',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f2f0f0',
        },
        {
          name: 'dark',
          value: '#000000',
        },
      ],
    },
  },
};

export default preview;

/// <reference types="vite/client" />
import type { Decorator, Preview } from '@storybook/react-vite';
import { MotionConfig, MotionGlobalConfig } from 'motion/react';
import { createElement } from 'react';
import { configure } from 'storybook/test';

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

import {
  forgetStoryRouter,
  storyRouterSettled,
} from '../src/tahti-web/_lib/decorators';

// Under the Vitest play runner, CSS transitions and animations (fade-ins,
// dialog and popover enter/leave) made assertions race them on busy CI
// runners: "element is not visible" mid fade-in, a closing popover still in
// the DOM. Motion is already reduced below; this does the same for CSS.
if (import.meta.env.VITEST) {
  const style = document.createElement('style');
  style.setAttribute('data-storybook-test', 'no-animations');
  style.textContent =
    '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;}';
  document.head.appendChild(style);
  document.documentElement.setAttribute('data-skip-enter-motion', '');
  // MotionConfig reducedMotion only drops transforms, and components that
  // read useReducedMotion() ignore it, so opacity fades still started at 0;
  // skipAnimations finishes the rest on the next frame.
  MotionGlobalConfig.skipAnimations = true;
  // Two story files share a busy runner; the 1s default made findBy*
  // time out on data that was a moment away.
  configure({ asyncUtilTimeout: 5000 });
}

const withReducedMotion: Decorator = (Story) =>
  createElement(
    MotionConfig,
    { reducedMotion: 'always' },
    createElement(Story),
  );
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
  decorators: [withReducedMotion, withTahtiTheme],
  // Seeds tahti-web's mock fixture overrides from `parameters.mockData`
  // before each story renders, and clears them afterwards so one story's
  // data never leaks into the next. See src/tahti-web/_lib/README.md.
  beforeEach: ({ parameters }) => {
    forgetStoryRouter();
    setMockOverrides((parameters.mockData as MockOverrides | undefined) ?? {});
    return () => resetMockOverrides();
  },
  // Same as the React renderer's default mount, plus waiting for a
  // story's router to render before its play runs (see storyRouterSettled).
  mount: (context) => async () => {
    await context.renderToCanvas();
    await storyRouterSettled();
    return context.canvas;
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

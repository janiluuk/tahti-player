import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);
const tahtiWebSrc = fileURLToPath(
  new URL('../../tahti-web/src', import.meta.url),
);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // tahti-web's mock fixtures reference asset paths (e.g. mock avatars)
  // that live in its own public/ dir, not this package's.
  staticDirs: [{ from: '../../tahti-web/public', to: '/' }],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-themes'),
  ],
  features: {
    sidebarOnboardingChecklist: false,
  },
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  managerHead: (head) => `
    ${head}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Tahti Storybook</title>
  `,
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      plugins: [
        (await import('@tailwindcss/vite')).default(),
        (await import('vite-plugin-svgr')).default(),
      ],
      resolve: {
        alias: {
          '@tahti-web': tahtiWebSrc,
        },
      },
      define: {
        // tahti-web's API layer short-circuits to its own fixtures when
        // this is set, so admin/studio views render real-looking data
        // with zero network calls — see packages/tahti-web/src/api/mode.ts.
        'import.meta.env.VITE_FORCE_MOCK': JSON.stringify('1'),
        // tahti-web's own vite.config.ts bakes these in at build time
        // (see SidebarBuildInfo.tsx) — components that read them crash
        // without a definition, since Storybook doesn't build tahti-web
        // itself.
        __APP_VERSION__: JSON.stringify('storybook'),
        __COMMIT_HASH__: JSON.stringify('storybook'),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        __RELEASE_TAG_DATE__: JSON.stringify(new Date().toISOString()),
      },
    });
  },
};

export default config;

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')));
}

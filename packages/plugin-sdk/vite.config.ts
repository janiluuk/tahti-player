/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build';
  const isNpmBuild = mode === 'npm';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isProduction
        ? [
            dts({
              insertTypesEntry: true,
              copyDtsFiles: false,
              exclude: ['**/*.test.ts', '**/*.test.tsx'],
            }),
          ]
        : []),
    ],
    ...(isProduction && {
      build: {
        lib: {
          entry: 'src/index.ts',
          name: 'NuclearPluginSDK',
          formats: ['es'],
          fileName: 'index',
        },
        rollupOptions: {
          external: isNpmBuild
            ? ['react', 'react-dom']
            : ['react', 'react-dom', '@tahti-player/ui'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              '@tahti-player/ui': 'NuclearUI',
            },
          },
        },
      },
    }),
    test: {
      globals: true,
      environment: 'jsdom',
      // Node 25+ ships a global localStorage without getItem unless given
      // --localstorage-file; it shadows jsdom's Storage.
      execArgv: ['--no-experimental-webstorage'],
      setupFiles: ['./src/test/setup.ts'],
      reporters: vitestCiReporters(import.meta.url),
      outputFile: { junit: './test-results/junit.xml' },
      coverage: {
        reporter: ['text', 'lcov', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.test.{ts,tsx}',
          '**/*.config.{ts,js}',
          'dist/',
        ],
      },
    },
  };
});

/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [
      react(),
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
          name: 'NuclearHifi',
          formats: ['es'],
          fileName: 'index',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'hls.js'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
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
          '**/*.test.{ts,tsx}',
          '**/*.config.{ts,js}',
          'dist/',
        ],
      },
    },
  };
});

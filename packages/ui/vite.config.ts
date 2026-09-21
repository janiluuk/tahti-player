/// <reference types="vitest" />
/// <reference types="vite-plugin-svgr/client" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
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
          name: 'NuclearUI',
          formats: ['es'],
          fileName: 'index',
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
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
      // Shared CI runners are ~5x slower than a dev box; 5s default flakes.
      testTimeout: process.env.CI ? 20_000 : 5_000,
      environment: 'jsdom',
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

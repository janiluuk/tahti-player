/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'model',
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
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
});

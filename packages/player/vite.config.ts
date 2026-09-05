/// <reference types="vitest" />
/// <reference types="vite-plugin-svgr/client" />
import { execSync } from 'child_process';
import { codecovVitePlugin } from '@codecov/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const tahtiApiUrl = env.VITE_TAHTI_API_URL || 'https://api.tahti.live';

  return {
    define: {
      __COMMIT_HASH__: JSON.stringify(commitHash),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_TAHTI_API_URL': JSON.stringify(tahtiApiUrl),
    },
    plugins: [
      devtools(),
      react(),
      tanstackRouter(),
      tailwindcss(),
      svgr(),
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'player',
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ],
    clearScreen: false,
    server: {
      host: process.env.VITE_HOST ?? 'localhost',
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:4120',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      clearMocks: true,
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
          'src-tauri/',
        ],
      },
    },
  };
});

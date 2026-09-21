/// <reference types="vitest" />
/// <reference types="vite-plugin-svgr/client" />
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { extname, join, resolve } from 'path';
import { codecovVitePlugin } from '@codecov/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import { vitestCiReporters } from '../../scripts/ci/vitest-ci-reporters.mjs';

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();

// The desktop app mounts the tahti-web UI, which refers to some of its own
// static files by absolute path (radio station logos, artwork presets…).
// Serve and bundle just those folders; the map tiles (~110 MB) stay out.
const WEB_PUBLIC = resolve(__dirname, '../tahti-web/public');
const SHARED_PUBLIC_DIRS = ['radio-logos', 'artwork-presets', 'mock', 'assets'];
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function walk(dir: string, base = ''): string[] {
  return readdirSync(join(dir, base)).flatMap((name) => {
    const rel = base ? `${base}/${name}` : name;
    return statSync(join(dir, rel)).isDirectory() ? walk(dir, rel) : [rel];
  });
}

function sharedWebPublic(): Plugin {
  return {
    name: 'tahti-shared-web-public',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
        const top = path.split('/')[1] ?? '';
        const file = join(WEB_PUBLIC, path);
        if (
          SHARED_PUBLIC_DIRS.includes(top) &&
          file.startsWith(WEB_PUBLIC) &&
          existsSync(file) &&
          statSync(file).isFile()
        ) {
          res.setHeader(
            'Content-Type',
            MIME[extname(file)] ?? 'application/octet-stream',
          );
          res.end(readFileSync(file));
          return;
        }
        next();
      });
    },
    generateBundle() {
      for (const dir of SHARED_PUBLIC_DIRS) {
        if (!existsSync(join(WEB_PUBLIC, dir))) {
          continue;
        }
        for (const rel of walk(WEB_PUBLIC, dir)) {
          this.emitFile({
            type: 'asset',
            fileName: rel,
            source: readFileSync(join(WEB_PUBLIC, rel)),
          });
        }
      }
    },
  };
}

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
      sharedWebPublic(),
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

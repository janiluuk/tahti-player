import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import pkg from './package.json';
import { validateProductionBuildEnvironment } from './src/lib/buildPolicy';
import { sandboxDocumentHtml } from './src/lib/disco-widget-sandbox';

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();

// Commit date of the checked-out HEAD -- the release each deploy is built
// from is tagged `tahti-web@<version>` against this same commit (see
// .github/workflows/deploy-tahti-web-selfhosted.yml), so this doubles as
// "when this release was tagged" without needing to fetch tag metadata.
const releaseTagDate = (() => {
  try {
    return execSync('git log -1 --format=%cI').toString().trim();
  } catch {
    return new Date().toISOString();
  }
})();

// Written by the "Apply review" button on /more (ScreenAtlas). Claude Code
// reads this file to see which pages still need changes vs. which are
// approved — see tahti-fit/README.md for the review workflow.
const REVIEW_STATE_PATH = join(
  process.cwd(),
  '../../tahti-fit/review-state.json',
);

/** Dev-only endpoint: POST /__api/apply-review writes the current review
 * state (comments + approvals) to a repo file instead of just localStorage,
 * so it survives outside the browser and Claude Code can act on it. */
function discoWidgetSandboxMiddleware(
  req: { url?: string },
  res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body: string) => void;
  },
  next: () => void,
) {
  const pathname = req.url?.split('?')[0] ?? '';
  const page = /^\/widget-sandbox\/([0-9a-f]{64})\/?$/.exec(pathname);
  if (!page?.[1]) {
    next();
    return;
  }
  const html = sandboxDocumentHtml(page[1]);
  if (!html) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src https: data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  );
  res.end(html);
}

function discoWidgetSandboxPlugin(): Plugin {
  return {
    name: 'disco-widget-sandbox',
    configureServer(server) {
      server.middlewares.use(discoWidgetSandboxMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(discoWidgetSandboxMiddleware);
    },
  };
}

function reviewStateApiPlugin(): Plugin {
  return {
    name: 'tahti-review-state-api',
    configureServer(server) {
      server.middlewares.use('/__api/apply-review', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            mkdirSync(dirname(REVIEW_STATE_PATH), { recursive: true });
            writeFileSync(
              REVIEW_STATE_PATH,
              `${JSON.stringify(payload, null, 2)}\n`,
              'utf8',
            );
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, path: REVIEW_STATE_PATH }));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  validateProductionBuildEnvironment(command, env);
  const deployVersion =
    env.VITE_DEPLOY_VERSION ?? new Date().toISOString().replace(/\D/g, '');
  const tahtiApi =
    env.VITE_TAHTI_API_PROXY_TARGET ||
    env.VITE_TAHTI_API_URL ||
    'http://localhost:15011';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(`${pkg.version}+${deployVersion}`),
      __COMMIT_HASH__: JSON.stringify(commitHash),
      // Baked in at build time, not request time — reflects when this
      // bundle was built, which for beta is deploy time (deploy-vimage.sh
      // builds and ships the same dist/ in one step).
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __RELEASE_TAG_DATE__: JSON.stringify(releaseTagDate),
    },
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      reviewStateApiPlugin(),
      discoWidgetSandboxPlugin(),
    ],
    clearScreen: false,
    server: {
      host: process.env.VITE_HOST ?? 'localhost',
      port: 5180,
      strictPort: true,
      proxy: {
        '/tahti-api': {
          target: tahtiApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tahti-api/, ''),
        },
        '/widget-sandbox/bundle': {
          target: tahtiApi,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(
              /^\/widget-sandbox\/bundle/,
              '/api/v1/disco-widgets/bundle',
            ),
        },
      },
    },
    preview: {
      port: 5180,
    },
    test: {
      globals: true,
      clearMocks: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});

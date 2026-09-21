import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const OUT_DIR = path.join(ROOT, 'snapshot-digest');

// Public base URL where this run's PNGs are hosted (e.g. raw.githubusercontent.com
// on a dedicated orphan branch — see .github/workflows/ci.yml's "Publish visual
// snapshot diffs" step). Without it, the digest just names the file (local/
// non-CI runs, or a run with nothing to publish).
const PUBLIC_BASE_URL = process.env.SNAPSHOT_DIFF_PUBLIC_BASE_URL?.replace(
  /\/$/,
  '',
);

const cssCache = new Map();
const APP_BUNDLES = ['player', 'tahti-web'];

const allFailures = collectFailures(ROOT);
const baseline = loadBaseline();
const failures = [];
const standing = [];
for (const failure of allFailures) {
  failure.fingerprint = fingerprintOf(failure);
  (baseline && isInBaseline(baseline, failure) ? standing : failures).push(
    failure,
  );
}

mkdirSync(OUT_DIR, { recursive: true });

if (allFailures.length === 0) {
  const empty = {
    generatedAt: new Date().toISOString(),
    count: 0,
    newCount: 0,
    standingCount: 0,
    items: [],
    standing: [],
  };
  writeFileSync(
    path.join(OUT_DIR, 'digest.json'),
    JSON.stringify(empty, null, 2),
  );
  writeFileSync(
    path.join(OUT_DIR, 'digest.md'),
    [
      '## Snapshot digest',
      '',
      '_No Vitest snapshot mismatches were collected._',
      '',
      'If CI failed for another reason, check the test logs.',
      '',
    ].join('\n'),
  );
  console.log('snapshot-digest: no snapshot failures found');
  process.exit(0);
}

const items = [];
for (const [index, failure] of failures.entries()) {
  const slug = slugify(
    `${failure.packageName}-${failure.testName || failure.file}-${index}`,
  );
  const expectedHtml = failure.expectedHtml;
  const receivedHtml = failure.receivedHtml;
  const expectedPath = path.join(OUT_DIR, `${slug}.expected.html`);
  const receivedPath = path.join(OUT_DIR, `${slug}.received.html`);

  if (expectedHtml) {
    writeFileSync(
      expectedPath,
      wrapHtmlDocument(expectedHtml, 'Expected', failure.packageName),
    );
  }
  if (receivedHtml) {
    writeFileSync(
      receivedPath,
      wrapHtmlDocument(receivedHtml, 'Received', failure.packageName),
    );
  }

  items.push({
    id: slug,
    fingerprint: failure.fingerprint,
    packageName: failure.packageName,
    file: relativize(failure.file),
    testName: failure.testName,
    likelyCause: inferLikelyCause(expectedHtml, receivedHtml, failure.message),
    expectedHtmlPath: expectedHtml ? path.basename(expectedPath) : null,
    receivedHtmlPath: receivedHtml ? path.basename(receivedPath) : null,
    expectedPng: null,
    receivedPng: null,
    diffPng: null,
    diffPixels: null,
    messageExcerpt: excerpt(failure.message, 6000),
  });
}

await maybeScreenshot(items);
maybeDiffImages(items);

const digest = {
  generatedAt: new Date().toISOString(),
  // `count` is every mismatch in the run (CI uses it to tell snapshot-only
  // failures from other test failures); `items` and the markdown cover only
  // the ones this PR introduced or changed.
  count: allFailures.length,
  newCount: items.length,
  standingCount: standing.length,
  baselineAvailable: baseline !== null,
  items,
  standing: standing.map((failure) => ({
    fingerprint: failure.fingerprint,
    packageName: failure.packageName,
    file: relativize(failure.file),
    testName: failure.testName,
  })),
};

writeFileSync(
  path.join(OUT_DIR, 'digest.json'),
  JSON.stringify(digest, null, 2),
);
writeFileSync(path.join(OUT_DIR, 'digest.md'), renderMarkdown(digest));
console.log(
  `snapshot-digest: wrote ${items.length} new and ${standing.length} standing item(s) to ${OUT_DIR}`,
);

/** Identifies a mismatch across runs: package, file, test and a hash of what
 * was received (so the same test failing in a *different* way still counts
 * as new). Absolute checkout paths and ANSI codes are normalized away. */
function fingerprintOf(failure) {
  const received = stripAnsi(failure.receivedHtml ?? failure.message ?? '')
    .replaceAll(ROOT, '')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha1')
    .update(
      [
        failure.packageName,
        relativize(failure.file),
        failure.testName,
        received,
      ].join('\0'),
    )
    .digest('hex');
}

/** The base branch's mismatches, from its own `digest.json` (downloaded by
 * CI into `snapshot-baseline/`). `null` when there is none, in which case
 * every mismatch is treated as new. Entries from before fingerprints existed
 * match on package + file + test name only. */
function loadBaseline() {
  const file =
    process.env.SNAPSHOT_BASELINE_JSON ||
    path.join(ROOT, 'snapshot-baseline', 'digest.json');
  if (!existsSync(file)) {
    return null;
  }
  try {
    const payload = JSON.parse(readFileSync(file, 'utf8'));
    const entries = [...(payload.items ?? []), ...(payload.standing ?? [])];
    const strong = new Set();
    const loose = new Set();
    for (const entry of entries) {
      if (entry.fingerprint) {
        strong.add(entry.fingerprint);
      } else {
        loose.add(looseKey(entry));
      }
    }
    return { strong, loose };
  } catch (error) {
    console.warn(
      `snapshot-digest: ignoring baseline ${file}: ${error.message}`,
    );
    return null;
  }
}

function looseKey(entry) {
  return [entry.packageName, relativize(entry.file), entry.testName].join('\0');
}

function isInBaseline(baseline, failure) {
  return (
    baseline.strong.has(failure.fingerprint) ||
    baseline.loose.has(looseKey(failure))
  );
}

async function loadChromium() {
  const candidates = [
    'playwright',
    pathToFileURL(path.join(ROOT, 'node_modules/playwright/index.mjs')).href,
    pathToFileURL(
      path.join(ROOT, 'packages/tahti-web/node_modules/playwright/index.mjs'),
    ).href,
    pathToFileURL(
      path.join(ROOT, 'node_modules/.pnpm/node_modules/playwright/index.mjs'),
    ).href,
  ];

  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      if (mod?.chromium) {
        return mod.chromium;
      }
    } catch {
      // try next
    }
  }
  return null;
}

function collectFailures(root) {
  const packagesDir = path.join(root, 'packages');
  const collected = [];
  if (!existsSync(packagesDir)) {
    return collected;
  }

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const failuresPath = path.join(
      packagesDir,
      entry.name,
      'snapshot-digest',
      'failures.json',
    );
    if (!existsSync(failuresPath)) {
      continue;
    }
    try {
      const payload = JSON.parse(readFileSync(failuresPath, 'utf8'));
      for (const failure of payload.failures ?? []) {
        collected.push({
          ...failure,
          packageName: payload.packageName ?? entry.name,
        });
      }
    } catch (error) {
      console.warn(`snapshot-digest: skip ${failuresPath}: ${error.message}`);
    }
  }
  return collected;
}

/** Real app CSS (Tailwind utilities + @tahti-player/ui + theme tokens) from
 * a built bundle, so a snapshot's rendered PNG looks like the app instead of
 * unstyled HTML. Each package's snapshots render with the bundle of the app
 * that owns them (`packages/<name>/dist/assets`, e.g. the player's own
 * Tailwind build — not tahti-web's, which has a different class/theme set);
 * falls back to any other built app bundle, then to a plain dark stub. Both
 * app builds run before the digest step in CI. */

function readBundleCss(name) {
  const assetsDir = path.join(ROOT, 'packages', name, 'dist/assets');
  if (!existsSync(assetsDir)) {
    return null;
  }
  const cssFiles = readdirSync(assetsDir)
    .filter((f) => f.endsWith('.css'))
    .sort();
  if (cssFiles.length === 0) {
    return null;
  }
  return cssFiles
    .map((f) => readFileSync(path.join(assetsDir, f), 'utf8'))
    .join('\n');
}

function loadAppCss(packageName) {
  const order = [packageName, ...APP_BUNDLES].filter(
    (name, i, all) => name && all.indexOf(name) === i,
  );
  for (const name of order) {
    if (!cssCache.has(name)) {
      cssCache.set(name, readBundleCss(name));
    }
    const css = cssCache.get(name);
    if (css) {
      return css;
    }
  }
  console.warn(
    `snapshot-digest: no built app CSS found for ${packageName} (looked in ${order
      .map((n) => `packages/${n}/dist/assets`)
      .join(', ')}); rendering unstyled`,
  );
  return null;
}

function wrapHtmlDocument(fragment, title, packageName) {
  const appCss = loadAppCss(packageName);
  // Full-window app roots use h-screen/w-screen: pin them to the capture
  // viewport (900x700, minus the ~32px label row) so they can't overflow it.
  const baseStyle = appCss
    ? `body { margin: 0; padding: 0; }
    .h-screen { height: 668px; }
    .w-screen { width: 100%; }`
    : `:root { color-scheme: dark; }
    body { margin: 0; padding: 24px 24px 48px; font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1220; color: #f8fafc; }`;
  const labelStyle =
    '.tahti-snapshot-label { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.6; padding: 8px 12px; }';

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${appCss ?? ''}
${baseStyle}
${labelStyle}</style>
</head>
<body class="bg-background text-foreground">
  <div class="tahti-snapshot-label">${escapeHtml(title)}</div>
${fragment}
</body>
</html>
`;
}

async function maybeScreenshot(digestItems) {
  const chromium = await loadChromium();
  if (!chromium) {
    console.warn('snapshot-digest: playwright not available; skipping PNGs');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 900, height: 700 },
    });
    for (const item of digestItems) {
      if (item.expectedHtmlPath) {
        const png = `${item.id}.expected.png`;
        await page.goto(`file://${path.join(OUT_DIR, item.expectedHtmlPath)}`);
        await page.screenshot({
          path: path.join(OUT_DIR, png),
          fullPage: true,
        });
        item.expectedPng = png;
      }
      if (item.receivedHtmlPath) {
        const png = `${item.id}.received.png`;
        await page.goto(`file://${path.join(OUT_DIR, item.receivedHtmlPath)}`);
        await page.screenshot({
          path: path.join(OUT_DIR, png),
          fullPage: true,
        });
        item.receivedPng = png;
      }
    }
  } finally {
    await browser.close();
  }
}

/** Pixel-diffs expected vs. received PNGs (odiff/pixelmatch-style: same idea
 * as getsentry/action-visual-snapshot uses internally, run locally instead
 * of against a proprietary API). Mismatched dimensions are padded onto a
 * shared canvas first — pixelmatch requires equal width/height — with an
 * unmissable magenta fill so a size change (not just a content change) is
 * obvious in the diff image rather than silently cropped. */
function maybeDiffImages(digestItems) {
  for (const item of digestItems) {
    if (!item.expectedPng || !item.receivedPng) {
      continue;
    }
    try {
      const expected = PNG.sync.read(
        readFileSync(path.join(OUT_DIR, item.expectedPng)),
      );
      const received = PNG.sync.read(
        readFileSync(path.join(OUT_DIR, item.receivedPng)),
      );
      const width = Math.max(expected.width, received.width);
      const height = Math.max(expected.height, received.height);
      const a = padPng(expected, width, height);
      const b = padPng(received, width, height);
      const diff = new PNG({ width, height });
      const changedPixels = pixelmatch(
        a.data,
        b.data,
        diff.data,
        width,
        height,
        {
          threshold: 0.1,
        },
      );
      const diffName = `${item.id}.diff.png`;
      writeFileSync(path.join(OUT_DIR, diffName), PNG.sync.write(diff));
      item.diffPng = diffName;
      item.diffPixels = changedPixels;
    } catch (error) {
      console.warn(
        `snapshot-digest: diff failed for ${item.id}: ${error.message}`,
      );
    }
  }
}

function padPng(png, width, height) {
  if (png.width === width && png.height === height) {
    return png;
  }
  const padded = new PNG({ width, height });
  for (let i = 0; i < padded.data.length; i += 4) {
    padded.data[i] = 255;
    padded.data[i + 1] = 0;
    padded.data[i + 2] = 255;
    padded.data[i + 3] = 255;
  }
  PNG.bitblt(png, padded, 0, 0, png.width, png.height, 0, 0);
  return padded;
}

/** Builds an `owner/repo@branch/path` raw URL for an image published by the
 * "Publish visual snapshot diffs" CI step, or null when there's nowhere
 * public to point at (no PUBLIC_BASE_URL — local run, or nothing to
 * publish this time). */
function imageUrl(fileName) {
  if (!PUBLIC_BASE_URL || !fileName) {
    return null;
  }
  return `${PUBLIC_BASE_URL}/${fileName}`;
}

function renderMarkdown(digest) {
  const rows = digest.items.map((item) => {
    const diffNote =
      item.diffPixels != null ? `${item.diffPixels} px changed` : '—';
    return `| \`${item.packageName}\` | ${escapeMd(item.testName)} | ${escapeMd(item.likelyCause)} | ${diffNote} |`;
  });

  const details = digest.items
    .map((item) => {
      const expectedUrl = imageUrl(item.expectedPng);
      const receivedUrl = imageUrl(item.receivedPng);
      const diffUrl = imageUrl(item.diffPng);
      const images = [expectedUrl, receivedUrl, diffUrl].some(Boolean)
        ? [
            '',
            '| Expected | Received | Diff |',
            '| --- | --- | --- |',
            `| ${expectedUrl ? `![Expected](${expectedUrl})` : '_(none)_'} | ${receivedUrl ? `![Received](${receivedUrl})` : '_(none)_'} | ${diffUrl ? `![Diff](${diffUrl})` : '_(none)_'} |`,
          ]
        : [
            item.expectedPng ? `- Expected PNG: \`${item.expectedPng}\`` : null,
            item.receivedPng ? `- Received PNG: \`${item.receivedPng}\`` : null,
          ].filter((line) => line != null);

      const lines = [
        `<details>`,
        `<summary><code>${escapeHtml(item.packageName)}</code> — ${escapeHtml(item.testName)}</summary>`,
        '',
        `- File: \`${item.file}\``,
        `- Likely cause: ${item.likelyCause}`,
        ...images,
        '',
        item.messageExcerpt
          ? ['```diff', item.messageExcerpt, '```'].join('\n')
          : null,
        '',
        `</details>`,
        '',
      ].filter((line) => line != null);
      return lines.join('\n');
    })
    .join('\n');

  const imagesNote = PUBLIC_BASE_URL
    ? 'Expected/received/diff screenshots are rendered with the real app CSS and embedded inline below.'
    : 'PNG screenshots (and full HTML) are in this run’s **snapshot-digest** artifact — no public image host configured for this run, so they aren’t inlined.';

  const standingNote = renderStanding(digest);

  if (digest.items.length === 0) {
    return [
      '## Snapshot digest',
      '',
      '_No new snapshot differences in this PR._',
      '',
      standingNote,
    ].join('\n');
  }

  return [
    '## Snapshot digest',
    '',
    `${digest.items.length} new Vitest snapshot mismatch(es) in this PR. Review the list, then update with:`,
    '',
    '```bash',
    'pnpm --filter <package> test -- -u -- <test-file>',
    '```',
    '',
    `The diff for each mismatch below is the real Vitest expected/received output. ${imagesNote}`,
    '',
    '| Package | Snapshot | Likely cause | Diff |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    details,
    standingNote,
  ].join('\n');
}

/** One collapsed block for mismatches that already fail on the base branch. */
function renderStanding(digest) {
  if (!digest.standing?.length) {
    return digest.baselineAvailable
      ? ''
      : '_No master baseline was available, so every mismatch is listed as new._\n';
  }
  return [
    '<details>',
    `<summary>${digest.standing.length} mismatch(es) already failing on master (not from this PR)</summary>`,
    '',
    ...digest.standing.map(
      (entry) => `- \`${entry.packageName}\` — ${escapeMd(entry.testName)}`,
    ),
    '',
    '</details>',
    '',
  ].join('\n');
}

function inferLikelyCause(expected, received, message) {
  const blob = `${expected ?? ''}\n${received ?? ''}\n${message ?? ''}`;
  if (/aria-label="Copy"|lucide-copy|Tooltip/i.test(blob)) {
    return 'CopyButton Tooltip wrapper (aria-label + wrapper div)';
  }
  if (/class=.*font-bold|leading-tight|text-lg/i.test(blob)) {
    return 'Class name / Tailwind class order change';
  }
  if (/prettier|contributors/i.test(blob)) {
    return 'Formatting-only snapshot drift';
  }
  return 'DOM snapshot content changed';
}

function slugify(value) {
  const base = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const hash = createHash('sha1').update(value).digest('hex').slice(0, 8);
  return `${base || 'snapshot'}-${hash}`;
}

function relativize(filePath) {
  if (!filePath) {
    return 'unknown';
  }
  if (filePath.startsWith(ROOT)) {
    return path.relative(ROOT, filePath);
  }
  return filePath;
}

function excerpt(value, max) {
  const text = stripAnsi(String(value ?? '')).trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…`;
}

function stripAnsi(value) {
  return String(value).replace(
    // eslint-disable-next-line no-control-regex
    /\u001B\[[0-9;]*m/g,
    '',
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeMd(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
}

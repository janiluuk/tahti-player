import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'snapshot-digest');

const failures = collectFailures(ROOT);

mkdirSync(OUT_DIR, { recursive: true });

if (failures.length === 0) {
  const empty = {
    generatedAt: new Date().toISOString(),
    count: 0,
    items: [],
  };
  writeFileSync(path.join(OUT_DIR, 'digest.json'), JSON.stringify(empty, null, 2));
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
    writeFileSync(expectedPath, wrapHtmlDocument(expectedHtml, 'Expected'));
  }
  if (receivedHtml) {
    writeFileSync(receivedPath, wrapHtmlDocument(receivedHtml, 'Received'));
  }

  items.push({
    id: slug,
    packageName: failure.packageName,
    file: relativize(failure.file),
    testName: failure.testName,
    likelyCause: inferLikelyCause(expectedHtml, receivedHtml, failure.message),
    expectedHtmlPath: expectedHtml ? path.basename(expectedPath) : null,
    receivedHtmlPath: receivedHtml ? path.basename(receivedPath) : null,
    expectedPng: null,
    receivedPng: null,
    messageExcerpt: excerpt(failure.message, 400),
  });
}

await maybeScreenshot(items);

const digest = {
  generatedAt: new Date().toISOString(),
  count: items.length,
  items,
};

writeFileSync(path.join(OUT_DIR, 'digest.json'), JSON.stringify(digest, null, 2));
writeFileSync(path.join(OUT_DIR, 'digest.md'), renderMarkdown(digest));
console.log(`snapshot-digest: wrote ${items.length} item(s) to ${OUT_DIR}`);

async function loadChromium() {
  const candidates = [
    'playwright',
    pathToFileURL(
      path.join(ROOT, 'node_modules/playwright/index.mjs'),
    ).href,
    pathToFileURL(
      path.join(
        ROOT,
        'packages/tahti-web/node_modules/playwright/index.mjs',
      ),
    ).href,
    pathToFileURL(
      path.join(
        ROOT,
        'node_modules/.pnpm/node_modules/playwright/index.mjs',
      ),
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

function wrapHtmlDocument(fragment, title) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      padding: 24px;
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: #0b1220;
      color: #f8fafc;
    }
    .label {
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 12px;
    }
    .frame {
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      background: #111827;
    }
  </style>
</head>
<body>
  <div class="label">${escapeHtml(title)}</div>
  <div class="frame">
${fragment}
  </div>
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

function renderMarkdown(digest) {
  const rows = digest.items.map(
    (item) =>
      `| \`${item.packageName}\` | ${escapeMd(item.testName)} | ${escapeMd(item.likelyCause)} |`,
  );

  const details = digest.items
    .map((item) => {
      const lines = [
        `<details>`,
        `<summary><code>${escapeHtml(item.packageName)}</code> — ${escapeHtml(item.testName)}</summary>`,
        '',
        `- File: \`${item.file}\``,
        `- Likely cause: ${item.likelyCause}`,
        item.expectedPng ? `- Expected PNG: \`${item.expectedPng}\`` : null,
        item.receivedPng ? `- Received PNG: \`${item.receivedPng}\`` : null,
        '',
        item.messageExcerpt
          ? ['```', item.messageExcerpt, '```'].join('\n')
          : null,
        '',
        `</details>`,
        '',
      ].filter((line) => line != null);
      return lines.join('\n');
    })
    .join('\n');

  return [
    '## Snapshot digest',
    '',
    `${digest.count} Vitest snapshot mismatch(es). Review the list, then update with:`,
    '',
    '```bash',
    'pnpm --filter <package> test -- -u -- <test-file>',
    '```',
    '',
    'PNG expected/received screenshots (and HTML) are in this run’s **snapshot-digest** artifact.',
    '',
    '| Package | Snapshot | Likely cause |',
    '| --- | --- | --- |',
    ...rows,
    '',
    details,
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
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

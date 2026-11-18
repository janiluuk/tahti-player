import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Old addresses kept only as redirects. In-app links point at the page
 * they land on, so a click never takes two hops. */
const REDIRECT_ONLY = [
  '/studio/branding',
  '/studio/venues',
  '/studio/moderation',
  '/studio/revenue',
  '/studio/governance',
  '/studio/stash',
  '/studio/info',
  '/help/governance',
  '/settings/artist',
  '/settings/channel',
  '/settings/broadcast',
  '/settings/language',
  '/settings/integrations',
  '/admin/status',
  '/admin/monitoring',
  '/library/sounds',
  '/library/collections',
  '/library/upload',
  '/library/smartlinks',
  '/library/media',
  '/library/stash',
  '/library/local',
  '/library/embeds',
  '/library/recordings',
  '/library/releases',
  '/library/messages',
  '/listen/favorites',
  '/favorites',
];

const LINK_PROP = /\b(?:to|href)(?:=\{?|:)\s*["'`]([^"'`?#]+)/g;

describe('in-app links', () => {
  it('never point at an address that only redirects', () => {
    const srcDir = join(__dirname, '..');
    const offenders = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
      .filter(
        (file) =>
          file.endsWith('.tsx') &&
          !file.includes('.test.') &&
          !file.startsWith('router'),
      )
      .flatMap((file) =>
        [...readFileSync(join(srcDir, file), 'utf8').matchAll(LINK_PROP)]
          .map((match) => match[1])
          .filter((path): path is string => REDIRECT_ONLY.includes(path ?? ''))
          .map((path) => `${file}: ${path}`),
      );
    expect(offenders).toEqual([]);
  });
});

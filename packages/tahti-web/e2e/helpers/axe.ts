import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import { STANDARD_VIEWPORTS } from './viewports';

export const AXE_VIEWPORTS = {
  desktop: STANDARD_VIEWPORTS.desktop,
  phone: STANDARD_VIEWPORTS.phone,
} as const;

/**
 * Third-party widgets whose markup the app cannot change. Each entry needs
 * the widget and the reason it is excluded.
 */
const THIRD_PARTY_EXCLUDES: readonly string[] = [];

/**
 * A listbox trigger shows the selected value, not its label, so its name
 * ("Language") never contains its text ("English"). The experimental
 * label-content-name-mismatch rule reads that value as a label; WCAG 2.5.3
 * and the ARIA select-only pattern do not.
 */
function isListboxValueMismatch(rule: string, html: string): boolean {
  return (
    rule === 'label-content-name-mismatch' &&
    html.includes('aria-haspopup="listbox"')
  );
}

interface AxeCheckOptions {
  /** Extra selectors to skip, for a third-party widget on this page only. */
  exclude?: readonly string[];
}

/** Runs axe-core on the current page and fails on serious or critical violations. */
export async function expectNoSeriousAxeViolations(
  page: Page,
  options: AxeCheckOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'best-practice',
  ]);
  for (const selector of [
    ...THIRD_PARTY_EXCLUDES,
    ...(options.exclude ?? []),
  ]) {
    builder = builder.exclude(selector);
  }
  const { violations } = await builder.analyze();
  const blocking = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      ...v,
      nodes: v.nodes.filter((n) => !isListboxValueMismatch(v.id, n.html)),
    }))
    .filter((v) => v.nodes.length > 0)
    .map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 8).map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 200),
        summary: n.failureSummary?.split('\n').slice(0, 3).join(' | '),
      })),
    }));
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

/** Waits for the page's heading and for lazy content to settle before a scan. */
export async function settle(page: Page): Promise<void> {
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.locator('h1').first()).toBeAttached();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

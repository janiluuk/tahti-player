import { expect, test, type Page } from '@playwright/test';

export const PHONE_NARROW = { width: 360, height: 800 } as const;

type OverflowReport = {
  document: number;
  main: number;
  scrollport: number;
  offenders: string[];
};

/**
 * Measures horizontal overflow at the current viewport: the document and
 * `<main>` widths, how far any page-level scroller (one holding the page or dialog heading)
 * scrolls sideways, and visible elements whose right edge passes the
 * viewport without an inner swipe strip or clipped card containing them.
 */
export async function measurePhoneOverflow(
  page: Page,
): Promise<OverflowReport> {
  await page.addStyleTag({
    content: '* { content-visibility: visible !important; }',
  });
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const main = document.querySelector('main');
    const dialogTitles = [...document.querySelectorAll('[role=dialog]')]
      .map((dialog) => {
        const labelledBy = dialog.getAttribute('aria-labelledby');
        return (
          (labelledBy ? document.getElementById(labelledBy) : null) ??
          dialog.querySelector('h1, h2')
        );
      })
      .filter((title): title is HTMLElement => title !== null);
    const pageLevel = (el: Element) =>
      (main !== null && el.contains(main)) ||
      el.querySelector('h1') !== null ||
      dialogTitles.some((title) => el.contains(title));
    const clipped = (el: Element) => {
      for (
        let a = el.parentElement;
        a && a !== document.body;
        a = a.parentElement
      ) {
        if (getComputedStyle(a).overflowX === 'visible' || pageLevel(a)) {
          continue;
        }
        if (a.getBoundingClientRect().right > vw + 1) {
          continue;
        }
        return true;
      }
      return false;
    };

    let scrollport = 0;
    for (const el of document.querySelectorAll(
      'main, main *, [role=dialog], [role=dialog] *',
    )) {
      const { overflowX } = getComputedStyle(el);
      if ((overflowX === 'auto' || overflowX === 'scroll') && pageLevel(el)) {
        scrollport = Math.max(scrollport, el.scrollWidth - el.clientWidth);
      }
    }

    const offenders: string[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }
      if (rect.right <= vw + 1 || rect.left >= vw) {
        continue;
      }
      if (getComputedStyle(el).visibility === 'hidden' || clipped(el)) {
        continue;
      }
      const hasOffendingChild = [...el.children].some((child) => {
        const r = child.getBoundingClientRect();
        return (
          r.right > vw + 1 && r.left < vw && r.width > 0 && !clipped(child)
        );
      });
      if (!hasOffendingChild) {
        const testId = el.getAttribute('data-testid');
        offenders.push(
          `${el.tagName.toLowerCase()}${testId ? `[${testId}]` : ''} right=${Math.round(rect.right)} "${(el.textContent ?? '').trim().slice(0, 40)}"`,
        );
      }
    }

    return {
      document: document.documentElement.scrollWidth - vw,
      main: main ? main.scrollWidth - main.clientWidth : 0,
      scrollport,
      offenders: offenders.slice(0, 10),
    };
  });
}

export async function expectNoPhoneOverflow(
  page: Page,
  path: string,
): Promise<void> {
  const report = await measurePhoneOverflow(page);
  expect(report.document, `document overflow on ${path}`).toBeLessThanOrEqual(
    0,
  );
  expect(report.main, `main overflow on ${path}`).toBeLessThanOrEqual(1);
  expect(
    report.scrollport,
    `page scroller overflow on ${path}`,
  ).toBeLessThanOrEqual(1);
  expect(report.offenders, `elements past the viewport on ${path}`).toEqual([]);
}

const ROUTES_PER_TEST = 8;

/**
 * One test per batch of routes, so a long area stays inside the per-test
 * timeout and shards spread it across runners.
 */
export function describePhoneOverflow(
  area: string,
  routes: readonly string[],
  setup?: (page: Page) => Promise<void>,
): void {
  for (let start = 0; start < routes.length; start += ROUTES_PER_TEST) {
    const batch = routes.slice(start, start + ROUTES_PER_TEST);
    test(`phone 360: ${area} has no horizontal overflow (${batch[0]} +${batch.length - 1})`, async ({
      page,
    }) => {
      await page.setViewportSize(PHONE_NARROW);
      if (setup) {
        await setup(page);
      }
      for (const path of batch) {
        await page.goto(path);
        await expect(
          page
            .locator('main h1:visible, [role=dialog] :is(h1, h2):visible')
            .first(),
        ).toBeVisible();
        await page.waitForLoadState('networkidle');
        await expectNoPhoneOverflow(page, path);
      }
    });
  }
}

import { expect, type Page } from '@playwright/test';

import { signIn } from './auth';

// The browser logs failed network requests (third-party radio streams the
// home page probes, media the mock data points at, API calls a role can't
// make) as console errors. They don't say whether the route rendered, so
// only errors the app itself logs count.
const IGNORED_CONSOLE_ERRORS = [
  /^Failed to load resource/,
  /blocked by CORS policy/,
];

export type PageErrors = {
  /** Errors logged since the last call, cleared on read. */
  take(): string[];
};

export function trackPageErrors(page: Page): PageErrors {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') {
      return;
    }
    const text = message.text();
    if (IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
      return;
    }
    errors.push(text);
  });
  page.on('pageerror', (error) => {
    errors.push(`Uncaught: ${error.message}`);
  });
  return {
    take: () => errors.splice(0),
  };
}

export type RouteCheck = {
  path: string;
  /** The page's `<h1>`. Leave out for pages titled by their data. */
  heading?: string | RegExp;
  /** Where the route lands after redirects. Defaults to `path`. */
  url?: string | RegExp;
  /** Chrome that must stay mounted on this page, e.g. `[data-studio-navigation]`. */
  chrome?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function urlEndingWith(path: string): RegExp {
  return new RegExp(`^[^?#]*?${escapeRegExp(path)}$`);
}

/** The page is on screen and healthy: final URL, `<main>`, an `<h1>`,
 * expected chrome, no error boundary or not-found page, and no console
 * errors since the previous check. */
export async function expectHealthyPage(
  page: Page,
  errors: PageErrors,
  check: RouteCheck,
): Promise<void> {
  const url = check.url ?? check.path;
  await expect(page).toHaveURL(
    typeof url === 'string' ? urlEndingWith(url) : url,
  );
  await expect(page.getByRole('main')).toBeVisible();
  const heading = page.getByRole('heading', {
    level: 1,
    ...(check.heading ? { name: check.heading } : {}),
  });
  await expect(heading.first()).toBeVisible();
  if (check.chrome) {
    await expect(page.locator(check.chrome).first()).toBeVisible();
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Page not found')).toHaveCount(0);
  expect(errors.take(), `console errors on ${check.path}`).toEqual([]);
}

export async function visitRoute(
  page: Page,
  errors: PageErrors,
  check: RouteCheck,
): Promise<void> {
  errors.take();
  await page.goto(check.path);
  await expectHealthyPage(page, errors, check);
}

export async function firstLinkPath(
  page: Page,
  selector: string,
): Promise<string> {
  const link = page.locator(selector).first();
  await expect(link).toBeAttached();
  const href = await link.getAttribute('href');
  expect(href, selector).toBeTruthy();
  return href as string;
}

/** Signs in with the e2e account and gives it the board role client-side,
 * the same way `layout-stability.spec.ts` reaches the admin pages. */
export async function signInAsBoard(page: Page): Promise<void> {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      throw new Error('No signed-in session to promote');
    }
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.roles = ['BOARD', 'ARTIST'];
    auth.state.user.isBoard = true;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.reload();
}

import { expect, type ConsoleMessage, type Page } from '@playwright/test';

export type RouteVisit = {
  path: string;
  heading: string | RegExp;
  /** Final URL when the route redirects or normalises. */
  url?: RegExp;
};

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Radio streams and provider widgets live on other origins and fail CORS or
// load in a headless browser no matter how healthy the app is. Failures on the
// app's own origin still count.
function isThirdPartyNetworkError(page: Page, msg: ConsoleMessage): boolean {
  const text = msg.text();
  const corsTarget = /^Access to \w+ at '([^']+)'/.exec(text)?.[1];
  const resourceUrl =
    corsTarget ??
    (text.startsWith('Failed to load resource') ? msg.location().url : null);
  if (!resourceUrl) {
    return false;
  }
  const appOrigin = originOf(page.url());
  return appOrigin !== null && originOf(resourceUrl) !== appOrigin;
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isThirdPartyNetworkError(page, msg)) {
      errors.push(`console: ${msg.text()}`);
    }
  });
  return errors;
}

/**
 * Visits a route and fails on a missing landmark/heading, the app error
 * boundary, or any error logged while the page rendered.
 */
export async function expectRouteHealthy(
  page: Page,
  errors: string[],
  route: RouteVisit,
): Promise<void> {
  errors.length = 0;
  await page.goto(route.path);
  if (route.url) {
    await expect(page).toHaveURL(route.url);
  }
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(
    page.getByRole('heading', { name: route.heading }).first(),
  ).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(errors, `errors logged on ${route.path}`).toEqual([]);
}

// Checks what a visitor with no account and a plain listener account see.
//   1. Signed out: public pages must open without the sign-in dialog and
//      account pages must ask for sign-in. Dead (disabled) buttons are listed.
//      Follow, Add, reactions and Comment must open sign-in, and the top
//      search must find and open a result.
//   2. Listener (no channel): no Studio tab bar, no channel settings.
//   3. Signed out on a phone (390 px): no public page scrolls sideways, and
//      the top bar's search button finds and opens a result.
// Exits 1 when something is wrong. Run against the mock app:
//   VITE_FORCE_MOCK=1 pnpm dev:tahti
//   BASE=http://127.0.0.1:5173 node packages/tahti-web/scripts/audit-signed-out.mjs
import { chromium } from '@playwright/test';

const base = process.env.BASE || 'http://127.0.0.1:5173';

const PUBLIC_PATHS = [
  '/',
  '/discover',
  '/radio',
  '/radio/station/radio-helsinki',
  '/u/liis-kask',
  '/channel/liis-kask-ee',
  '/c/demo-collection',
  '/t/liis-kask-archive-1',
  '/v/kuudes-linja',
  '/search?tag=electronic',
  '/subscribe/liis-kask',
  '/schedule',
  '/newsletter/confirmed',
  '/newsletter/unsubscribed',
  '/newsletter/unsubscribe/token',
  '/favorites',
  '/listen/history',
  '/help',
  '/transparency',
  '/governance',
  '/studio',
];
const ACCOUNT_PATHS = ['/messages', '/feed', '/library'];
// Actions that need an account: each must open sign-in, not sit disabled
// or do nothing.
const SIGN_IN_ACTIONS = [
  { path: '/u/liis-kask', what: 'Follow', button: /^Log in to follow/ },
  { path: '/t/liis-kask-archive-1', what: 'Add', button: /^Add$/ },
  {
    path: '/t/liis-kask-archive-1',
    what: 'React',
    button: /^Log in to add /,
  },
  {
    path: '/channel/liis-kask-ee',
    what: 'Comment',
    button: /^Log in to comment$/,
  },
];
const LISTENER = {
  id: 'mock-listener@tahti.live',
  email: 'listener@tahti.live',
  username: 'listener',
  displayName: 'Demo Listener',
  role: 'LISTENER',
  roles: ['LISTENER'],
  avatarUrl: null,
  isMember: false,
  isBoard: false,
  channel: null,
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
});

const DESKTOP = { width: 1400, height: 900 };
const PHONE = { width: 390, height: 800 };

async function openAs(user, viewport = DESKTOP) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(base + '/');
  await page.evaluate((account) => {
    if (!account) {
      localStorage.removeItem('tahti-web-auth');
      return;
    }
    localStorage.setItem(
      'tahti-web-auth',
      JSON.stringify({ state: { user: account }, version: 0 }),
    );
    localStorage.setItem(`tahti-web-onboarded:${account.id}`, '1');
  }, user);
  return { context, page };
}

async function visit(page, path) {
  await page.goto(base + path, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const main = document.querySelector('[data-studio-shell]') ?? document.body;
    return {
      signInDialog: [...document.querySelectorAll('[role=dialog]')].some(
        (dialog) => dialog.querySelector('input[type=password]'),
      ),
      deadButtons: [...main.querySelectorAll('button:disabled')]
        .filter(visible)
        .map((button) =>
          (
            button.getAttribute('aria-label') ||
            button.textContent ||
            ''
          ).trim(),
        ),
      tabs: [...main.querySelectorAll('[role=tab], nav a')]
        .filter(visible)
        .map((tab) => (tab.textContent || '').trim()),
      settingsNav: [...document.querySelectorAll('[role=dialog] [role=tab]')]
        .filter(visible)
        .map((tab) => (tab.textContent || '').trim()),
    };
  });
}

const problems = [];
const notes = [];

{
  const { context, page } = await openAs(null);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message.slice(0, 120)));
  for (const path of PUBLIC_PATHS) {
    const seen = await visit(page, path);
    if (seen.signInDialog) {
      problems.push(`signed out: ${path} opens the sign-in dialog`);
      await page.keyboard.press('Escape');
    }
    const dead = [...new Set(seen.deadButtons)].filter(Boolean);
    if (dead.length > 0) {
      notes.push(
        `signed out: ${path} has disabled buttons: ${dead.slice(0, 6).join(', ')}`,
      );
    }
  }
  for (const path of ACCOUNT_PATHS) {
    const seen = await visit(page, path);
    if (!seen.signInDialog) {
      problems.push(`signed out: ${path} does not ask for sign-in`);
    } else {
      await page.keyboard.press('Escape');
    }
  }
  for (const action of SIGN_IN_ACTIONS) {
    await visit(page, action.path);
    const button = page.getByRole('button', { name: action.button }).first();
    const opened = await button
      .click({ timeout: 4000 })
      .then(() => page.waitForTimeout(500))
      .then(() => page.locator('[role=dialog] input[type=password]').count())
      .catch(() => null);
    if (opened === null) {
      problems.push(
        `signed out: ${action.path} has no "${action.what}" button`,
      );
    } else if (opened === 0) {
      problems.push(
        `signed out: "${action.what}" on ${action.path} does not ask for sign-in`,
      );
    } else {
      await page.keyboard.press('Escape');
    }
  }
  {
    await visit(page, '/');
    const search = page.getByRole('combobox', { name: /search artists/i });
    const found = await search
      .fill('mid', { timeout: 4000 })
      .then(() => page.getByRole('option').first().click({ timeout: 4000 }))
      .then(() => page.waitForTimeout(500))
      .then(() => new URL(page.url()).pathname)
      .catch(() => null);
    if (found === null) {
      problems.push('signed out: the top search shows no result for "mid"');
    } else if (!/^\/(u|t|c)\//.test(found)) {
      problems.push(`signed out: a search result opened ${found}`);
    }
  }
  for (const error of new Set(errors)) {
    problems.push(`signed out: page error: ${error}`);
  }
  await context.close();
}

{
  const { context, page } = await openAs(LISTENER);
  const studio = await visit(page, '/studio');
  if (studio.tabs.some((tab) => /^(Stats|Releases|Broadcast)$/.test(tab))) {
    problems.push('listener: /studio shows the Studio tab bar');
  }
  if (studio.signInDialog) {
    problems.push('listener: /studio opens the sign-in dialog');
  }
  const settings = await visit(page, '/settings');
  for (const section of ['Channel & chat', 'Broadcast']) {
    if (settings.settingsNav.includes(section)) {
      problems.push(`listener: Settings lists "${section}"`);
    }
  }
  await context.close();
}

{
  const { context, page } = await openAs(null, PHONE);
  for (const path of PUBLIC_PATHS) {
    await visit(page, path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (overflow > 2) {
      problems.push(`phone: ${path} scrolls sideways by ${overflow} px`);
    }
  }
  await visit(page, '/');
  const found = await page
    .getByRole('button', { name: 'Search', exact: true })
    .click({ timeout: 4000 })
    .then(() =>
      page
        .getByTestId('phone-search')
        .getByRole('combobox')
        .fill('mid', { timeout: 4000 }),
    )
    .then(() => page.getByRole('option').first().click({ timeout: 4000 }))
    .then(() => page.waitForTimeout(500))
    .then(() => new URL(page.url()).pathname)
    .catch(() => null);
  if (found === null) {
    problems.push('phone: the top bar search shows no result for "mid"');
  } else if (!/^\/(u|t|c)\//.test(found)) {
    problems.push(`phone: a search result opened ${found}`);
  }
  await context.close();
}

await browser.close();

console.log(
  `checked ${PUBLIC_PATHS.length} public and ${ACCOUNT_PATHS.length} account pages, ${SIGN_IN_ACTIONS.length} sign-in actions and the search signed out, plus Studio and Settings as a listener, and the public pages and the search at 390 px`,
);
if (notes.length > 0) {
  console.log('\nTo look at:\n' + notes.join('\n'));
}
if (problems.length > 0) {
  console.log('\nProblems:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('\nNo problems.');

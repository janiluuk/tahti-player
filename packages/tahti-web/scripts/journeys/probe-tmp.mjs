import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5195';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('console', (m) => console.log('CONSOLE:', m.text()));
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto(`${BASE}/login`, { waitUntil: 'load' });
await page.getByLabel('Email').fill('artist@tahti.live');
await page.getByLabel('Password').fill('demo-password');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForTimeout(1500);
console.log('URL after login:', page.url());
const signedIn = await page.getByRole('button', { name: /^Signed in as/ }).count();
console.log('signed in button count:', signedIn);

await page.goto(`${BASE}/studio/upload`, { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/jani/.claude/jobs/22afc63d/tmp/probe-upload.png', fullPage: true });
console.log('body snippet:', (await page.locator('body').innerText()).slice(0, 400));

await page.goto(`${BASE}/studio/channel`, { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/jani/.claude/jobs/22afc63d/tmp/probe-channel.png', fullPage: true });

await page.goto(`${BASE}/settings/plugin-store`, { waitUntil: 'load' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/home/jani/.claude/jobs/22afc63d/tmp/probe-plugins.png', fullPage: true });

await browser.close();

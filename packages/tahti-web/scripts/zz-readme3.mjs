import { chromium } from '@playwright/test';
import { join } from 'path';
import { CAPTURE_THEME_STATE, prepareCapturePage, withThemeSuffix } from './lib/captureSetup.mjs';
const BASE = 'http://127.0.0.1:5180';
const out = join(process.cwd(), 'docs/redesign-shots');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await prepareCapturePage(p);
await p.emulateMedia({ reducedMotion: 'reduce', colorScheme: process.env.CAPTURE_THEME_MODE === 'light' ? 'light' : 'dark' });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate((theme) => {
  localStorage.setItem('tahti-web-auth', JSON.stringify({ state: { user: { id: 'mock-board-1', email: 'board@tahti.live', username: 'board', displayName: 'Board Member', role: 'BOARD', isBoard: true, membershipStatus: 'ACTIVE', channel: { slug: 'demo', state: 'OFFLINE' } } }, version: 0 }));
  localStorage.setItem('tahti-web-onboarded:mock-board-1', '1');
  localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
}, CAPTURE_THEME_STATE);
for (const [path, file] of [['/', 'listen-home-v1.png'], ['/channel/demo', 'listen-channel-v1.png'], ['/studio/go-live', 'studio-go-live-v1.png']]) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: join(out, withThemeSuffix(file)) });
  console.log('wrote', withThemeSuffix(file));
}
await b.close();

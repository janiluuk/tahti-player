import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const logs = [];
p.on('console', (m) => { if (/error|cors|audio/i.test(m.text())) logs.push(m.text().slice(0, 160)); });
for (const name of ['Radio Nova', 'NRJ']) {
  await p.goto('https://tahti.live/radio', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  const all = await p.locator('button, a').evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 50)).filter((l) => /nova|nrj/i.test(l)));
  console.log('candidates', JSON.stringify(all.slice(0, 8)));
  await p.locator('button, a').filter({ hasText: new RegExp('^' + name + '$') }).first().click();
  await p.waitForTimeout(3000);
  console.log('url', p.url());
  const btn = p.getByRole('button', { name: /^(Play|Listen)/i }).first();
  const found = await btn.count();
  if (!found) { console.log(name, 'no play button'); const names = await p.getByRole('button').evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')).filter(Boolean).filter(l => /play/i.test(l)).slice(0, 15)); console.log(names); continue; }
  await btn.click();
  await p.waitForTimeout(9000);
  const st = await p.evaluate(() => [...document.querySelectorAll('audio')].map(a => ({ src: (a.currentSrc || a.src).slice(0, 70), paused: a.paused, t: Math.round(a.currentTime * 10) / 10, ready: a.readyState, err: a.error?.code ?? null, muted: a.muted, cors: a.crossOrigin })));
  console.log(name, JSON.stringify(st));
}
console.log(logs.slice(0, 6).join('\n'));
await b.close();

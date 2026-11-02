import { chromium } from '@playwright/test';
import { prepareCapturePage } from './lib/captureSetup.mjs';
const OUT = process.env.OUT; const BASE='http://127.0.0.1:5181';
const routes = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args:['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: Number(process.env.W||1440), height: Number(process.env.H||900) } });
await prepareCapturePage(p);
await p.goto(BASE+'/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => {
  localStorage.setItem('tahti-web-auth', JSON.stringify({ state: { user: { id:'mock-1', email:'demo@tahti.live', username:'demo', displayName:'Demo Artist', role:'ARTIST', membershipStatus:'ACTIVE', channel:{slug:'demo',state:'OFFLINE'} } }, version: 0 }));
  localStorage.setItem('tahti-web-onboarded:mock-1','1');
});
for (const r of routes) {
  const [path, name, action] = r.split('|');
  await p.goto(BASE+path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  if (action === 'play') { await p.getByText('Midnight Broadcast').first().click().catch(e=>console.log('noplay', e.message)); await p.waitForTimeout(2500); }
  if (action === 'play' && process.env.HOVER) { await p.getByTestId('player-seek-bar').hover(); await p.waitForTimeout(300); }
  if (action === 'play' && process.env.TITLECLICK) { await p.getByTestId('now-playing-title').click(); await p.waitForTimeout(800); }
  if (action === 'menu') { await p.getByRole('button', { name: /^Signed in as/ }).click(); await p.waitForTimeout(500); }
  if (action === 'story') { await p.getByTestId('story-card-open').first().click(); await p.waitForTimeout(1200); }
  if (process.env.PROBE) { console.log(await p.evaluate((pt) => { const [x,y]=pt.split(',').map(Number); return document.elementsFromPoint(x,y).slice(0,6).map(e => { const r=e.getBoundingClientRect(); return e.tagName+' '+(e.getAttribute('data-testid')||'')+' ['+(e.className?.baseVal??e.className).toString().slice(0,140)+'] y='+Math.round(r.top)+'-'+Math.round(r.bottom); }).join('\n'); }, process.env.PROBE)); }
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: process.env.FULL==='1' });
}
await b.close();

import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
for (const url of process.argv.slice(2)) {
  const p = await b.newPage();
  const seen = new Set();
  p.on('response', async (r) => {
    const u = r.url(); const ct = r.headers()['content-type'] || '';
    if (!/json|xml|text\/plain/.test(ct)) return;
    if (/google|facebook|analytics|doubleclick|cookie|consent|sentry|gtm|cdn-cgi|didomi|cxense|chartbeat/i.test(u)) return;
    if (seen.has(u.split('?')[0])) return; seen.add(u.split('?')[0]);
    let body = ''; try { body = (await r.text()).slice(0, 220).replace(/\s+/g, ' '); } catch {}
    console.log(url.slice(8, 40), '|', u.slice(0, 150), '|', body);
  });
  try { await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch {}
  await p.waitForTimeout(6000);
  await p.close();
}
await b.close();

import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: Number(process.env.W||520), height: Number(process.env.H||560) } });
for (const [id, name] of process.argv.slice(2).map((a) => a.split('|'))) {
  await p.goto(`http://127.0.0.1:6107/iframe.html?id=${id}&viewMode=story&globals=theme:dark`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${process.env.OUT}/${name}.png` });
}
await b.close();

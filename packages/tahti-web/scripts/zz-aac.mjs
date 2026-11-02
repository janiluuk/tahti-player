import { chromium } from '@playwright/test';
const url = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto('https://tahti.live/about', { waitUntil: 'domcontentloaded' });
const r = await p.evaluate(async (u) => {
  const a = new Audio(); a.src = u; a.muted = true;
  try { await a.play(); } catch (e) { return { playErr: String(e) }; }
  await new Promise((res) => setTimeout(res, 6000));
  return { t: a.currentTime, err: a.error?.code ?? null, ready: a.readyState, src: a.currentSrc.slice(0, 80) };
}, url);
console.log(JSON.stringify(r)); await b.close();

import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const seen = new Set();
p.on('request', (r) => { const u = r.url(); if (/privacy-mgmt|google|facebook|analytics|cxense|chartbeat|novelist|didomi|\.(js|css|png|jpg|svg|woff2?)(\?|$)/i.test(u)) return; const k = u.split('?')[0]; if (seen.has(k)) return; seen.add(k); console.log(r.resourceType(), u.slice(0, 170)); });
await p.goto('https://www.supla.fi/suomipop', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(5000);
for (const f of p.frames()) { const btn = f.getByRole('button', { name: /hyväksy|accept|salli/i }).first(); if (await btn.count()) { await btn.click().catch(() => {}); console.log('consent clicked'); break; } }
await p.waitForTimeout(4000);
const play = p.getByRole('button', { name: /kuuntele|toista|play/i }).first();
if (await play.count()) { await play.click().catch(() => {}); console.log('play clicked'); }
await p.waitForTimeout(12000);
await b.close();

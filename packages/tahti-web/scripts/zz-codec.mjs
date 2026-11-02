import { chromium, firefox } from '@playwright/test';
for (const [name, launch] of [['chromium', () => chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })], ['firefox', () => firefox.launch()]]) {
  try {
    const b = await launch(); const p = await b.newPage();
    await p.goto('about:blank');
    console.log(name, await p.evaluate(() => ({ aac: new Audio().canPlayType('audio/aac'), mp4a: new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"'), mp3: new Audio().canPlayType('audio/mpeg') })));
    await b.close();
  } catch (e) { console.log(name, 'unavailable', e.message.split('\n')[0]); }
}

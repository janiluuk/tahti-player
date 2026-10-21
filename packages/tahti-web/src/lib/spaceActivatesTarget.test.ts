import { describe, expect, it } from 'vitest';

import { spaceActivatesTarget } from './spaceActivatesTarget';

describe('spaceActivatesTarget', () => {
  it('leaves Space to focused buttons, links and controls', () => {
    document.body.innerHTML = `
      <button id="b"><span id="inner">Play</span></button>
      <a id="a" href="/x">Link</a>
      <div id="sw" role="switch"></div>
      <main id="m"><p id="p">Text</p></main>`;
    for (const id of ['b', 'inner', 'a', 'sw']) {
      expect(spaceActivatesTarget(document.getElementById(id))).toBe(true);
    }
  });

  it('lets the shortcut run on page content', () => {
    expect(spaceActivatesTarget(document.getElementById('p'))).toBe(false);
    expect(spaceActivatesTarget(document.body)).toBe(false);
    expect(spaceActivatesTarget(null)).toBe(false);
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { arrowKeyOwnedByTarget, swipeOwnedByChild } from './useEventBrowse';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('arrowKeyOwnedByTarget', () => {
  it('leaves arrows to text fields, dialogs and carousels', () => {
    document.body.innerHTML = `
      <input id="field" />
      <div role="dialog"><button id="in-dialog"></button></div>
      <section aria-roledescription="carousel" id="carousel"></section>
      <button id="plain"></button>`;
    expect(arrowKeyOwnedByTarget(document.getElementById('field'))).toBe(true);
    expect(arrowKeyOwnedByTarget(document.getElementById('in-dialog'))).toBe(
      true,
    );
    expect(arrowKeyOwnedByTarget(document.getElementById('carousel'))).toBe(
      true,
    );
    expect(arrowKeyOwnedByTarget(document.getElementById('plain'))).toBe(false);
    expect(arrowKeyOwnedByTarget(document.body)).toBe(false);
  });
});

describe('swipeOwnedByChild', () => {
  it('leaves swipes that start in a sideways scroller to it', () => {
    document.body.innerHTML = `
      <div id="page">
        <div id="strip" style="overflow-x: auto"><span id="tile"></span></div>
        <p id="text"></p>
      </div>`;
    const page = document.getElementById('page')!;
    const strip = document.getElementById('strip')!;
    Object.defineProperty(strip, 'scrollWidth', { value: 800 });
    Object.defineProperty(strip, 'clientWidth', { value: 300 });
    expect(swipeOwnedByChild(document.getElementById('tile'), page)).toBe(true);
    expect(swipeOwnedByChild(document.getElementById('text'), page)).toBe(
      false,
    );
  });
});

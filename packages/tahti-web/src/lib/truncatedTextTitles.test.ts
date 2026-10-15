import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startTruncatedTextTitles } from './truncatedTextTitles';

function sized(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, 'scrollWidth', {
    configurable: true,
    get: () => scrollWidth,
  });
  Object.defineProperty(el, 'clientWidth', {
    configurable: true,
    get: () => clientWidth,
  });
}

function hover(el: Element) {
  el.dispatchEvent(new Event('pointerover', { bubbles: true }));
}

describe('startTruncatedTextTitles', () => {
  let stop: () => void;

  beforeEach(() => {
    stop = startTruncatedTextTitles();
  });

  afterEach(() => {
    stop();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('titles cut-off text with its full text', () => {
    document.body.innerHTML =
      '<p class="truncate">Northern Lights — <b>Live Set</b></p>';
    const p = document.querySelector('p')!;
    sized(p, 400, 120);
    hover(p.querySelector('b')!);
    expect(p.title).toBe('Northern Lights — Live Set');
  });

  it('leaves text that fits alone', () => {
    document.body.innerHTML = '<p class="line-clamp-2">Short</p>';
    const p = document.querySelector('p')!;
    sized(p, 100, 100);
    hover(p);
    expect(p.hasAttribute('title')).toBe(false);
  });

  it('keeps a title the page set itself', () => {
    document.body.innerHTML =
      '<span class="truncate" title="Full name">Full na…</span>';
    const span = document.querySelector('span')!;
    sized(span, 400, 120);
    hover(span);
    expect(span.title).toBe('Full name');
  });

  it('drops its title once the text fits again', () => {
    document.body.innerHTML = '<span class="truncate">Aurora Drift</span>';
    const span = document.querySelector('span')!;
    sized(span, 400, 120);
    hover(span);
    expect(span.title).toBe('Aurora Drift');
    sized(span, 120, 120);
    hover(span);
    expect(span.hasAttribute('title')).toBe(false);
  });

  it('stops after it is stopped', () => {
    stop();
    document.body.innerHTML = '<span class="truncate">Aurora Drift</span>';
    const span = document.querySelector('span')!;
    sized(span, 400, 120);
    hover(span);
    expect(span.hasAttribute('title')).toBe(false);
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SectionTabs, tabStripFade } from './SectionTabs';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));

afterEach(cleanup);

const items = [
  { id: 'a', to: '/studio', label: 'Overview', icon: null },
  { id: 'b', to: '/studio/stats', label: 'Stats', icon: null, active: true },
];

describe('SectionTabs', () => {
  it('stays on one scrolling line when tabs overflow', () => {
    render(<SectionTabs aria-label="Studio" items={items} />);

    const list = screen.getByRole('tablist', { name: 'Studio' });
    expect(list.className).toContain('flex-nowrap');
    expect(list.className).toContain('overflow-x-auto');
    expect(list.className).not.toContain('flex-wrap');
  });

  it('marks the active item as the selected tab', () => {
    render(<SectionTabs aria-label="Studio" items={items} />);

    expect(
      screen.getByRole('tab', { name: 'Stats' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('fades whichever edge hides more tabs', () => {
    const strip = { scrollWidth: 600, clientWidth: 300 };
    expect(tabStripFade({ ...strip, scrollLeft: 0 })).toBe('end');
    expect(tabStripFade({ ...strip, scrollLeft: 150 })).toBe('both');
    expect(tabStripFade({ ...strip, scrollLeft: 300 })).toBe('start');
    expect(
      tabStripFade({ scrollWidth: 300, clientWidth: 300, scrollLeft: 0 }),
    ).toBeUndefined();
  });

  it('marks an overflowing strip so its cut-off edge fades', () => {
    const width = vi
      .spyOn(HTMLElement.prototype, 'scrollWidth', 'get')
      .mockReturnValue(600);
    const client = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(300);
    render(<SectionTabs aria-label="Studio" items={items} />);

    const list = screen.getByRole('tablist', { name: 'Studio' });
    expect(list.dataset.fade).toBe('end');
    expect(list.className).toContain('data-[fade=end]:');
    width.mockRestore();
    client.mockRestore();
  });
});

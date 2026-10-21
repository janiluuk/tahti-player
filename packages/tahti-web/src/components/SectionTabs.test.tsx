// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SectionTabs } from './SectionTabs';

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
});

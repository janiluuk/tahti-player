// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ListingDate } from './ListingDate';

describe('ListingDate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00.000Z'));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('humanizes a date inside a week, with the full timestamp as title', () => {
    const { container } = render(
      <ListingDate value="2026-10-30T09:00:00.000Z" />,
    );
    const time = container.querySelector('time');
    expect(time?.getAttribute('datetime')).toBe('2026-10-30T09:00:00.000Z');
    expect(time?.textContent).toBe('3 hours ago');
    expect(time?.getAttribute('title')).toBe(
      new Date('2026-10-30T09:00:00.000Z').toLocaleString(),
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('shows d.m.yyyy from a week on', () => {
    const { container } = render(
      <ListingDate value="2026-09-01T12:00:00.000Z" />,
    );
    expect(container.querySelector('time')?.textContent).toBe('1.9.2026');
  });

  it('reads a date-only value as that local day', () => {
    const { container } = render(<ListingDate value="2026-10-01" />);
    const time = container.querySelector('time');
    expect(time?.textContent).toBe('1.10.2026');
    expect(time?.getAttribute('datetime')).toBe('2026-10-01');
  });

  it('renders nothing for an unparsable value', () => {
    const { container } = render(<ListingDate value="soon" />);
    expect(container.innerHTML).toBe('');
  });
});

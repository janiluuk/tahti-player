// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShowEpisodeWhen } from './ShowEpisodeWhen';

describe('ShowEpisodeWhen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-04T12:00:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows a humanized listing date once the episode has aired', () => {
    render(
      <ShowEpisodeWhen
        episode={{
          startAt: '2026-11-02T18:00:00.000Z',
          endAt: '2026-11-02T20:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByText('1 day ago').tagName).toBe('TIME');
  });

  it('keeps the exact window for an upcoming episode', () => {
    const start = new Date(2026, 10, 6, 18, 0).toISOString();
    const end = new Date(2026, 10, 6, 19, 30).toISOString();
    render(<ShowEpisodeWhen episode={{ startAt: start, endAt: end }} />);
    expect(screen.getByText('Fri, Nov 6 · 06:00 PM–07:30 PM')).toBeTruthy();
    expect(document.querySelector('time')).toBeNull();
  });
});

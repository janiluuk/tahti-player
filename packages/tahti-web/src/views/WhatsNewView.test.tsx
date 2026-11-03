// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RELEASE_NOTES } from '../content/releaseNotes';
import { renderWithRouter } from '../test/renderWithRouter';
import { WhatsNewView } from './WhatsNewView';

function localDay(isoDate: string, plusDays = 0): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year!, month! - 1, day! + plusDays, 12);
}

describe('WhatsNewView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('dates each update in the listing style', async () => {
    const latest = RELEASE_NOTES[0]!;
    vi.setSystemTime(localDay(latest.date, 2));
    await renderWithRouter(<WhatsNewView />);
    const [first] = screen.getAllByText('2 days ago');
    expect(first!.tagName).toBe('TIME');
    expect(first!.getAttribute('datetime')).toBe(latest.date);
    const oldest = localDay(RELEASE_NOTES[RELEASE_NOTES.length - 1]!.date);
    const label = `${oldest.getDate()}.${oldest.getMonth() + 1}.${oldest.getFullYear()}`;
    expect(screen.getAllByText(label)[0]!.tagName).toBe('TIME');
  });
});

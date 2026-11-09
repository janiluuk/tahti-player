// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '../../../test/renderWithRouter';
import { ScheduledTimes } from './ScheduledTimes';

const broadcast = (id: string, title: string) => ({
  id,
  title,
  startAt: '2026-11-12T18:00:00.000Z',
  endAt: '2026-11-12T19:00:00.000Z',
});

describe('ScheduledTimes cards', () => {
  afterEach(cleanup);

  it('spaces the cards with a gap instead of a filled grid background', async () => {
    await renderWithRouter(
      <ScheduledTimes
        items={[broadcast('a', 'Night drive'), broadcast('b', 'Polar set')]}
        onEdit={() => {}}
      />,
    );
    const list = screen.getByTestId('scheduled-times-list');
    expect(list.className).toContain('gap-3');
    expect(list.className).not.toContain('bg-border');
    for (const card of list.querySelectorAll('li')) {
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
    }
  });
});

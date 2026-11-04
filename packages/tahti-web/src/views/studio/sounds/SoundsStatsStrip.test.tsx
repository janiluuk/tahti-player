import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SoundsStatsStrip } from './SoundsStatsStrip';
import type { StudioSoundsState } from './useStudioSoundsState';

function state(
  overrides: Partial<StudioSoundsState['stats']> & { total?: number } = {},
): StudioSoundsState {
  const { total = 2, ...stats } = overrides;
  return {
    stats: {
      total,
      durationSec: 0,
      publicCount: 0,
      privateCount: 0,
      processingCount: 0,
      errorCount: 0,
      readyCount: 0,
      ...stats,
    },
    total,
    items: [{ id: 'a' }, { id: 'b' }] as StudioSoundsState['items'],
  } as StudioSoundsState;
}

describe('SoundsStatsStrip', () => {
  afterEach(cleanup);

  it('renders counts and duration in the app language', () => {
    render(
      <SoundsStatsStrip
        state={state({
          total: 2,
          durationSec: 3660,
          publicCount: 1,
          privateCount: 1,
          processingCount: 1,
          errorCount: 1,
        })}
      />,
    );
    expect(screen.getByText(/2 sounds/)).toBeTruthy();
    expect(screen.getByText(/1 h 1 min/)).toBeTruthy();
    expect(screen.getByText(/1 public/)).toBeTruthy();
    expect(screen.getByText(/1 private/)).toBeTruthy();
    expect(screen.getByText(/1 processing/)).toBeTruthy();
    expect(screen.getByText(/1 failed/)).toBeTruthy();
  });

  it('hides when there is nothing to show', () => {
    const { container } = render(
      <SoundsStatsStrip
        state={
          {
            stats: null,
            total: 0,
            items: [],
          } as unknown as StudioSoundsState
        }
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

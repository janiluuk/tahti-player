// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as insights from '../api/track-insights';
import { TrackInsightsPanel } from './TrackInsightsPanel';

describe('TrackInsightsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says insights failed to load instead of "No insights"', async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    await act(async () => {
      render(<TrackInsightsPanel kind="sound" id="s1" />);
    });
    expect(screen.getByText('Could not load insights')).toBeTruthy();
    expect(screen.queryByText('No insights for this track yet')).toBeNull();
  });

  it('says there are no insights when the API has none', async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<TrackInsightsPanel kind="sound" id="s1" />);
    });
    expect(screen.getByText('No insights for this track yet')).toBeTruthy();
  });
});

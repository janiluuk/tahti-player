// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioTrackInsightsView } from './StudioTrackInsightsView';

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/TrackInsightsPanel', () => ({
  TrackInsightsPanel: () => null,
}));

describe('StudioTrackInsightsView back link', () => {
  afterEach(cleanup);

  it("leads a release track back to its release's Stats tab", async () => {
    await renderWithRouter(
      <StudioTrackInsightsView kind="release-tracks" id="t1" releaseId="r1" />,
      { paths: ['/studio/releases/$id'] },
    );

    const back = screen.getByTestId('page-back-link');
    expect(back).toHaveTextContent('Release stats');
    expect(back).toHaveAttribute('href', '/studio/releases/r1?tab=stats');
  });

  it('falls back to the Releases list without a release id', async () => {
    await renderWithRouter(
      <StudioTrackInsightsView kind="release-tracks" id="t1" />,
      { paths: ['/studio/releases'] },
    );

    expect(screen.getByTestId('page-back-link')).toHaveAttribute(
      'href',
      '/studio/releases',
    );
  });

  it('leads a sound back to Sounds', async () => {
    await renderWithRouter(<StudioTrackInsightsView kind="sound" id="s1" />, {
      paths: ['/library/sounds'],
    });

    expect(screen.getByTestId('page-back-link')).toHaveAttribute(
      'href',
      '/library/sounds',
    );
  });
});

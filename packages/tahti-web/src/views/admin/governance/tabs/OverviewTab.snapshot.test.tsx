// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../../api/admin';
import type { BoardResolution } from '../../../../api/types';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { OverviewTab } from './OverviewTab';

function resolution(id: string, title: string): BoardResolution {
  return {
    id,
    title,
    body: 'Body',
    outcome: 'PASSED',
    votedAt: '2026-01-01T00:00:00.000Z',
    voteFor: 3,
    voteAgainst: 0,
    voteAbstain: 0,
    publishedAt: '2026-01-02T00:00:00.000Z',
  } as BoardResolution;
}

function mockOverview(resolutions: Promise<BoardResolution[]>) {
  vi.spyOn(admin, 'fetchAdminGovernanceOverview').mockResolvedValue({
    data: {
      openMotions: 2,
      pendingVenueVerifications: 0,
      lastAnnualReportYear: null,
      boardResolutionsThisYear: 1,
    },
    meta: { source: 'api' },
  });
  vi.spyOn(admin, 'fetchAdminGovernanceActivity').mockResolvedValue({
    data: [],
    totalVotes: 0,
    totalComments: 0,
    meta: { source: 'api' },
  });
  vi.spyOn(admin, 'fetchAdminResolutions').mockImplementation(() =>
    resolutions.then((data) => ({ data, meta: { source: 'api' as const } })),
  );
}

async function renderTab() {
  return renderWithRouter(<OverviewTab />, {
    paths: ['/admin/governance/$tab'],
  });
}

describe('OverviewTab snapshot', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('shows the last loaded resolutions at once and swaps in the refresh', async () => {
    mockOverview(Promise.resolve([resolution('r1', 'Adopt budget')]));
    const first = await renderTab();
    expect(await screen.findByText('Adopt budget')).toBeInTheDocument();
    first.unmount();

    let resolve: (rows: BoardResolution[]) => void = () => undefined;
    mockOverview(new Promise((r) => (resolve = r)));
    await renderTab();
    expect(screen.getByText('Adopt budget')).toBeInTheDocument();

    resolve([resolution('r2', 'Elect board')]);
    expect(await screen.findByText('Elect board')).toBeInTheDocument();
    expect(screen.queryByText('Adopt budget')).toBeNull();
  });

  it('keeps the saved data and says the refresh failed', async () => {
    mockOverview(Promise.resolve([resolution('r1', 'Adopt budget')]));
    const first = await renderTab();
    expect(await screen.findByText('Adopt budget')).toBeInTheDocument();
    first.unmount();

    vi.spyOn(admin, 'fetchAdminResolutions').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderTab();
    expect(
      await screen.findByText(
        'Could not refresh governance activity; showing the last loaded data.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Adopt budget')).toBeInTheDocument();
  });

  it('says the first load failed', async () => {
    mockOverview(Promise.resolve([]));
    vi.spyOn(admin, 'fetchAdminResolutions').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderTab();
    expect(
      await screen.findByText('Could not load governance activity.'),
    ).toBeInTheDocument();
  });
});

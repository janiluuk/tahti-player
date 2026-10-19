// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioReleaseTrack } from '../../../api/studio-types';
import { ReleaseStatsPanel } from './ReleaseStatsPanel';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

vi.mock('../../../components/ListenerWorldMap', () => ({
  ListenerWorldMap: ({
    data,
  }: {
    data: Array<{ countryCode: string; count: number }>;
  }) => (
    <ul aria-label="countries">
      {data.map((c) => (
        <li key={c.countryCode}>{`${c.countryCode} ${c.count}`}</li>
      ))}
    </ul>
  ),
}));

const insights: Record<string, { plays: number; downloads: number }> = {
  t1: { plays: 10, downloads: 2 },
  t2: { plays: 30, downloads: 5 },
};

vi.mock('../../../api/track-insights', () => ({
  fetchTrackInsights: async (_kind: string, id: string) => ({
    data: {
      title: id,
      period: '30d',
      totalPlays: insights[id]!.plays,
      totalDownloads: insights[id]!.downloads,
      daily: [],
      countries: [{ countryCode: 'FI', displayName: 'Finland', count: 3 }],
    },
    meta: { source: 'api' },
  }),
}));

const tracks = [
  { id: 't1', position: 1, title: 'Quiet One' },
  { id: 't2', position: 2, title: 'Loud One' },
] as StudioReleaseTrack[];

describe('ReleaseStatsPanel', () => {
  afterEach(() => {
    cleanup();
    navigate.mockReset();
  });

  it('totals plays, downloads and countries across the tracks', async () => {
    render(<ReleaseStatsPanel tracks={tracks} />);
    expect(await screen.findByText('40')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('FI 6')).toBeTruthy();
  });

  it('ranks tracks by plays and opens a track insights page', async () => {
    render(<ReleaseStatsPanel tracks={tracks} />);
    await screen.findByText('Loud One');
    const labels = screen
      .getAllByText(/ One$/)
      .map((element) => element.textContent);
    expect(labels).toEqual(['Loud One', 'Quiet One']);
    fireEvent.click(screen.getByText('Quiet One'));
    expect(navigate).toHaveBeenCalledWith({
      to: '/studio/insights/$kind/$id',
      params: { kind: 'release-tracks', id: 't1' },
    });
  });

  it('asks for tracks when the release has none', () => {
    render(<ReleaseStatsPanel tracks={[]} />);
    expect(screen.getByText('No tracks yet')).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useStationNowPlaying } from '../../hooks/useStationNowPlaying';
import { StationCardSubtitle } from './StationCardSubtitle';

vi.mock('../../hooks/useStationNowPlaying', () => ({
  useStationNowPlaying: vi.fn(),
}));

const useStationNowPlayingMock = vi.mocked(useStationNowPlaying);

describe('StationCardSubtitle', () => {
  it('renders Now without opacity when a title is known', () => {
    useStationNowPlayingMock.mockReturnValue('Aurora Drift');
    render(
      <StationCardSubtitle
        source={{
          programmingUrl: 'https://example.test/programme',
          streamUrl: 'https://example.test/stream',
        }}
        fallback="Finnish · 192kbps"
      />,
    );
    const label = screen.getByText('Now');
    expect(label.className).toContain('text-accent-green-strong');
    expect(label.className).not.toContain('opacity-');
    expect(screen.getByText('Aurora Drift')).toBeTruthy();
  });

  it('renders the fallback without opacity when nothing is playing', () => {
    useStationNowPlayingMock.mockReturnValue(null);
    render(<StationCardSubtitle source={null} fallback="Finnish · 192kbps" />);
    const fallback = screen.getByText('Finnish · 192kbps');
    expect(fallback.className).toContain('text-foreground-secondary');
    expect(fallback.className).not.toContain('opacity-');
  });
});

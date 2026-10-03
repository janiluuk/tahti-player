import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTracksByTag } from '../api/listen';
import { TagSearchView } from './TagSearchView';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    params,
  }: {
    children: ReactNode;
    params: { id: string };
  }) => <a href={`/t/${params.id}`}>{children}</a>,
}));

vi.mock('../api/listen', () => ({
  fetchTracksByTag: vi.fn(),
}));

const fetchMock = vi.mocked(fetchTracksByTag);

describe('TagSearchView', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('lists public tracks with the tag, linking to each track', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      tracks: [
        {
          id: 's1',
          title: 'Midnight Drone',
          artistName: 'Aino',
          channelSlug: 'aino',
          durationSec: 300,
          coverUrl: null,
        },
      ],
    });

    render(<TagSearchView tag="late night" />);

    expect(screen.getByText('#late night')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: /Midnight Drone/ });
    expect(link).toHaveAttribute('href', '/t/s1');
    expect(screen.getByText('Aino')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('late night');
  });

  it('says so when no tracks have the tag', async () => {
    fetchMock.mockResolvedValue({ ok: true, tracks: [] });
    render(<TagSearchView tag="drone" />);
    expect(
      await screen.findByText('No public tracks have this tag yet'),
    ).toBeInTheDocument();
  });

  it('shows an error when the API cannot filter by tag', async () => {
    fetchMock.mockResolvedValue({ ok: false, error: 'Required' });
    render(<TagSearchView tag="drone" />);
    expect(
      await screen.findByText("Couldn't load tracks for this tag"),
    ).toBeInTheDocument();
  });

  it('does not search without a tag', () => {
    render(<TagSearchView />);
    expect(screen.getByText('No tag chosen')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

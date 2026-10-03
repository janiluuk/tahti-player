import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicTrackDetail } from '../../api/types';
import { TrackDetailsBlock } from './TrackDetailsBlock';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    params,
    search,
  }: {
    children: ReactNode;
    params?: { username: string };
    search?: { tag: string };
  }) => (
    <a
      href={
        search
          ? `/search?tag=${encodeURIComponent(search.tag)}`
          : `/u/${params?.username}`
      }
    >
      {children}
    </a>
  ),
}));

function detail(overrides: Partial<PublicTrackDetail>): PublicTrackDetail {
  return {
    genre: null,
    subGenres: [],
    mixVersion: null,
    commentary: null,
    credits: null,
    license: 'ALL_RIGHTS_RESERVED',
    effectiveBpm: null,
    effectiveKey: null,
    ...overrides,
  } as PublicTrackDetail;
}

describe('TrackDetailsBlock', () => {
  it('shows only the rows the track has', () => {
    render(
      <TrackDetailsBlock
        detail={detail({
          genre: 'House',
          subGenres: ['Deep house'],
          effectiveBpm: 122,
          credits: [{ role: 'producer', name: 'Aino', artistUsername: 'aino' }],
          commentary: 'Made on a rainy Sunday.',
        })}
      />,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Genres')).toBeInTheDocument();
    expect(screen.getByText('House · Deep house')).toBeInTheDocument();
    expect(screen.getByText('122')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aino' })).toHaveAttribute(
      'href',
      '/u/aino',
    );
    expect(screen.getByText('Made on a rainy Sunday.')).toBeInTheDocument();
    expect(screen.queryByText('Key')).not.toBeInTheDocument();
    expect(screen.queryByText('Licence')).not.toBeInTheDocument();
  });

  it('links each tag to tag search', () => {
    render(
      <TrackDetailsBlock detail={detail({ tags: ['Late night', 'drone'] })} />,
    );
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#Late night' })).toHaveAttribute(
      'href',
      '/search?tag=Late%20night',
    );
    expect(screen.getByRole('link', { name: '#drone' })).toHaveAttribute(
      'href',
      '/search?tag=drone',
    );
  });

  it('shows an explicit Creative Commons licence and key', () => {
    render(
      <TrackDetailsBlock
        detail={detail({ license: 'CC_BY_SA', effectiveKey: '8A' })}
      />,
    );
    expect(screen.getByText('CC BY-SA')).toBeInTheDocument();
    expect(screen.getByText('8A')).toBeInTheDocument();
  });

  it('renders nothing when the track has no details or failed to load', () => {
    const { container, rerender } = render(
      <TrackDetailsBlock detail={detail({})} />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<TrackDetailsBlock detail={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

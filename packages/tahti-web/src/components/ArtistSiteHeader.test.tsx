import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArtistSiteHeader } from './ArtistSiteHeader';

describe('ArtistSiteHeader', () => {
  it('shows the saved title and channel colors with a main-site link', () => {
    render(
      <ArtistSiteHeader
        title="My artist site"
        artistName="Artist"
        colorScheme={{ bg: '#123456', text: '#ffffff' }}
      />,
    );
    expect(screen.getByText('My artist site')).toBeInTheDocument();
    expect(screen.getByTestId('artist-site-header')).toHaveStyle({
      backgroundColor: '#123456',
      color: '#ffffff',
    });
    expect(screen.getByRole('link', { name: 'tahti.live' })).toHaveAttribute(
      'href',
      'https://tahti.live/',
    );
  });

  it('falls back to the artist name for an empty title', () => {
    render(<ArtistSiteHeader title="  " artistName="Artist" />);
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  it('keeps the main-site link when the header is hidden', () => {
    render(<ArtistSiteHeader title="Hidden title" hidden />);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'tahti.live' }),
    ).toBeInTheDocument();
  });
});

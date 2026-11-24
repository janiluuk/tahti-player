import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArtistSiteHeader } from './ArtistSiteHeader';

describe('ArtistSiteHeader', () => {
  it('shows the saved title and channel colors without a main-site link', () => {
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
    expect(screen.queryByRole('link', { name: 'tahti.live' })).toBeNull();
  });

  it('falls back to the artist name for an empty title', () => {
    render(<ArtistSiteHeader title="  " artistName="Artist" />);
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  it('renders nothing when the header is hidden and there is no menu', () => {
    const { container } = render(
      <ArtistSiteHeader title="Hidden title" hidden />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps only the menu button when the header is hidden', () => {
    render(
      <ArtistSiteHeader title="Hidden title" hidden onOpenMenu={() => {}} />,
    );
    expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open navigation' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

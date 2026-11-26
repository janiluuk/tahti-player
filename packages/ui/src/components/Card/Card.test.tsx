import { fireEvent, render, screen } from '@testing-library/react';

import { Card } from '.';
import { MediaArtworkDefaultProvider } from '../MediaArtwork';

describe('Card', () => {
  it('(Snapshot) renders correctly', async () => {
    const { container } = render(
      <Card
        src="https://picsum.photos/300"
        title="Test album"
        subtitle="Test artist"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('(Snapshot) renders the neutral surface', async () => {
    const { container } = render(
      <Card
        src="https://picsum.photos/300"
        title="Test album"
        subtitle="Test artist"
        surface="neutral"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('defaults to the brand surface and accepts neutral', () => {
    const { rerender } = render(
      <Card src="https://picsum.photos/300" title="Brand" />,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('data-surface', 'brand');
    expect(screen.getByTestId('card').className).toMatch(/bg-primary/);

    rerender(
      <Card
        src="https://picsum.photos/300"
        title="Neutral"
        surface="neutral"
      />,
    );
    expect(screen.getByTestId('card')).toHaveAttribute(
      'data-surface',
      'neutral',
    );
    expect(screen.getByTestId('card').className).toMatch(
      /bg-background-secondary/,
    );
  });
  it('marks the playing card and clears its highlight when paused', () => {
    const { rerender } = render(<Card title="Active track" isPlaying />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-playing', 'true');
    expect(screen.getByTestId('card')).toHaveClass(
      'ring-foreground/25',
      'ring-inset',
    );
    rerender(<Card title="Active track" isPlaying={false} />);
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-playing');
    expect(screen.getByTestId('card')).not.toHaveClass('ring-inset');
  });
  it('shows an artwork overlay alongside the playback control', () => {
    render(
      <Card
        title="Night Drive"
        artworkOverlay={<span>EP</span>}
        onPlay={() => undefined}
      />,
    );
    expect(screen.getByText('EP')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Play Night Drive', exact: true }),
    ).toBeInTheDocument();
  });

  it('names the overlay after itemName when the title is a node', () => {
    render(
      <Card
        title={<span>YleX</span>}
        itemName="YleX"
        onPlay={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Play YleX', exact: true }),
    ).toBeInTheDocument();
  });

  it('shows the default artwork when the cover fails to load', () => {
    const defaultSrc = (seed: string) => `/default/${seed}.webp`;
    render(
      <MediaArtworkDefaultProvider value={defaultSrc}>
        <Card src="https://cdn.example/expired.png" seed="sets" title="Sets" />
      </MediaArtworkDefaultProvider>,
    );
    const img = screen.getByRole('img', { name: 'Sets' });
    expect(img).toHaveAttribute('src', 'https://cdn.example/expired.png');
    fireEvent.error(img);
    expect(screen.getByRole('img', { name: 'Sets' })).toHaveAttribute(
      'src',
      '/default/sets.webp',
    );
    expect(screen.queryByTestId('media-artwork-fallback')).toBeNull();
  });

  it('shows the default artwork for a card without a cover', () => {
    render(
      <MediaArtworkDefaultProvider value={(seed) => `/default/${seed}.webp`}>
        <Card seed="tracks" title="Tracks" />
      </MediaArtworkDefaultProvider>,
    );
    expect(screen.getByRole('img', { name: 'Tracks' })).toHaveAttribute(
      'src',
      '/default/tracks.webp',
    );
  });

  it('keeps the cassette placeholder without a default provider', () => {
    render(<Card title="No provider" />);
    expect(screen.getByTestId('media-artwork-fallback')).toBeInTheDocument();
  });
});

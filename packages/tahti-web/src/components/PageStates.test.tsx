// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CardsRowSkeleton,
  ContentReveal,
  HeroSkeleton,
  ProfileSkeleton,
  RouteChunkSkeleton,
  TrackListSkeleton,
} from './PageStates';

describe('RouteChunkSkeleton', () => {
  it('exposes a page-shaped loading status for lazy route chunks', () => {
    render(<RouteChunkSkeleton />);
    expect(screen.getByRole('status', { name: 'Loading page' })).toBeTruthy();
    expect(screen.getByTestId('cards-row-skeleton')).toBeTruthy();
    expect(screen.getByTestId('track-list-skeleton')).toBeTruthy();
  });
});

describe('section skeletons', () => {
  it('reserves a cards-row strip without chrome when the parent owns the title', () => {
    render(<CardsRowSkeleton chrome={false} cards={3} />);
    expect(screen.getByTestId('cards-row-skeleton')).toBeTruthy();
  });

  it('reserves track-list rows without a duplicate title', () => {
    render(<TrackListSkeleton chrome={false} rows={2} />);
    expect(screen.getByTestId('track-list-skeleton')).toBeTruthy();
  });

  it('covers radio hero and artist profile shells', () => {
    const { rerender } = render(<HeroSkeleton />);
    expect(screen.getByTestId('hero-skeleton')).toBeTruthy();
    rerender(<ProfileSkeleton />);
    expect(screen.getByTestId('profile-skeleton')).toBeTruthy();
  });

  it('wraps ready content for a reveal', () => {
    render(
      <ContentReveal>
        <p>Ready</p>
      </ContentReveal>,
    );
    expect(screen.getByText('Ready')).toBeTruthy();
  });
});

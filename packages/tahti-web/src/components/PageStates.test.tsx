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
  TrackTableSkeleton,
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

  it('draws each placeholder card in a Card-sized frame', () => {
    render(<CardsRowSkeleton chrome={false} cards={3} />);
    const cards = screen.getAllByTestId('cards-row-skeleton-card');
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.className).toContain('w-46');
      expect(card.className).toContain('border-(length:--border-width)');
    }
  });

  it('reserves a track table with its title, toolbar and first rows', () => {
    render(<TrackTableSkeleton title={<h2>New tracks</h2>} />);
    const skeleton = screen.getByTestId('track-table-skeleton');
    expect(skeleton.textContent).toContain('New tracks');
    expect(skeleton.querySelectorAll('.h-\\[66px\\]')).toHaveLength(9);
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

  it('wraps ready content in a fade that does not move it', () => {
    render(
      <ContentReveal>
        <p>Ready</p>
      </ContentReveal>,
    );
    const reveal = screen.getByText('Ready').parentElement!;
    expect(reveal.className).toContain('motion-safe:fade-in');
    expect(reveal.className).not.toMatch(/slide-in|zoom-in/);
  });
});

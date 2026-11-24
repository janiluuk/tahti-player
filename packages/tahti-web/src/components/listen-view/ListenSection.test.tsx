// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ListenSection } from './ListenSection';

describe('ListenSection', () => {
  it('reserves a cards-row skeleton while loading', () => {
    render(
      <ListenSection
        title="On air"
        status="loading"
        empty
        emptyTitle="Nobody is on air"
        onRetry={vi.fn()}
      >
        <div>ready</div>
      </ListenSection>,
    );
    expect(screen.getByTestId('cards-row-skeleton')).toBeTruthy();
    expect(screen.queryByText('ready')).toBeNull();
  });

  it('gives the loading heading the CardsRow header height', () => {
    render(
      <ListenSection
        title="On air"
        status="loading"
        empty
        emptyTitle="Nobody is on air"
        onRetry={vi.fn()}
      >
        <div>ready</div>
      </ListenSection>,
    );
    const heading = screen.getByRole('heading', { name: 'On air' });
    expect(heading.closest('.min-h-10')).not.toBeNull();
  });

  it('reserves a track-table panel with the title inside when skeleton=list', () => {
    render(
      <ListenSection
        title="New tracks"
        status="loading"
        empty
        emptyTitle="No tracks"
        onRetry={vi.fn()}
        skeleton="list"
      >
        <div>ready</div>
      </ListenSection>,
    );
    const skeleton = screen.getByTestId('track-table-skeleton');
    expect(skeleton.textContent).toContain('New tracks');
    expect(screen.getAllByRole('heading', { name: 'New tracks' })).toHaveLength(
      1,
    );
  });

  it('reveals ready content without the loading shell', () => {
    render(
      <ListenSection
        title="On air"
        status="ready"
        empty={false}
        emptyTitle="Nobody is on air"
        onRetry={vi.fn()}
      >
        <div>ready rows</div>
      </ListenSection>,
    );
    expect(screen.getByText('ready rows')).toBeTruthy();
    expect(screen.queryByTestId('cards-row-skeleton')).toBeNull();
    const reveal = screen.getByText('ready rows').parentElement!;
    expect(reveal.className).toContain('fade-in');
    expect(reveal.className).not.toMatch(/slide-in/);
  });
});

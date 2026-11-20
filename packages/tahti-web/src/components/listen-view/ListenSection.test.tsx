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

  it('reserves a track-list skeleton when skeleton=list', () => {
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
    expect(screen.getByTestId('track-list-skeleton')).toBeTruthy();
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
  });
});

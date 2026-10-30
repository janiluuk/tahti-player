// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Masonry } from './Masonry';

function mockWidth(px: number) {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: px >= Number(/\d+/.exec(media)?.[0] ?? 0),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const items = ['a', 'b', 'c', 'd', 'e'].map((id) => <p key={id}>{id}</p>);

describe('Masonry', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('deals children round-robin into three columns on wide screens', () => {
    mockWidth(1400);
    render(<Masonry>{items}</Masonry>);
    const columns = screen.getAllByTestId('masonry-column');
    expect(columns.map((column) => column.textContent)).toEqual([
      'ad',
      'be',
      'c',
    ]);
  });

  it('uses two columns at md and one below', () => {
    mockWidth(900);
    const { unmount } = render(<Masonry>{items}</Masonry>);
    expect(screen.getAllByTestId('masonry-column')).toHaveLength(2);
    unmount();

    mockWidth(400);
    render(<Masonry>{items}</Masonry>);
    expect(screen.getAllByTestId('masonry-column')).toHaveLength(1);
  });
});
